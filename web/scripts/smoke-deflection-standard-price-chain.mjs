import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';
import { loadLocalEnv } from './local-env.mjs';
import { runDeflectionHostedCheckoutSmoke } from './smoke-deflection-hosted-checkout.mjs';
import {
  makeVercelCurlFetch,
  runDeflectionPaidUnlockSmoke,
} from './smoke-deflection-paid-unlock.mjs';
import checkoutRequirements from '../src/lib/deflection-checkout-requirements.js';

const {
  DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV: ALLOWED_AMOUNT_CENTS_ENV,
} = checkoutRequirements;

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const ATTEMPT_ID_RE = /^[A-Za-z0-9._:-]{8,160}$/;
const DEFAULT_BASE_URL = 'https://juancanfield.com';
const PRICING_TERMS_PATH = '/api/deflection-pricing/standard';
const STRIPE_API_VERSION = '2026-05-27.dahlia';
const DEFAULT_MAX_WAIT_MS = 120_000;
const DEFAULT_POLL_MS = 5_000;
const EXPECTED_MODES = new Set(['any', 'live', 'test']);

function printUsage() {
  console.log(`Deflection standard price-chain smoke

Usage:
  npm --prefix web run smoke:deflection-standard-price-chain -- \\
    --request-id content-ops-...

Options:
  --attempt-id <id>           Explicit Checkout attempt id (default: generated)
  --base-url <url>            Hosted portfolio base URL (default: ${DEFAULT_BASE_URL})
  --expect-mode <m>           Expected Checkout mode: any, live, or test (default: any)
  --max-wait-ms <ms>          Unlock polling timeout (default: ${DEFAULT_MAX_WAIT_MS})
  --poll-ms <ms>              Unlock polling interval (default: ${DEFAULT_POLL_MS})
  --vercel-curl               Route hosted portfolio requests through "vercel curl"
  --vercel-deployment <id|url> Deployment for vercel curl (default: --base-url)
  --allow-live-checkout       Do not fail closed on cs_live_ Checkout URLs
  --no-local-env              Do not auto-load .env.local/.env before reading local env
  --json                      Print machine-readable JSON
  --output <path>             Write the smoke artifact JSON

Safety:
  This creates one hosted Stripe Checkout Session, reads that Session from
  Stripe, then waits for the real webhook unlock. It does not complete payment
  automatically, fake a webhook, or call privileged ATLAS paid routes.`);
}

function fail(message, outputJson, details = {}) {
  failCommand(message, outputJson, details, {
    sanitize: (value) => String(value || 'Unknown error.').slice(0, 300),
  });
}

function normalizeBaseUrl(value) {
  const raw = String(value || DEFAULT_BASE_URL).trim().replace(/\/$/, '');
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      return null;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseAllowedAmounts(env) {
  const raw = String(env[ALLOWED_AMOUNT_CENTS_ENV] || '').trim();
  if (!raw) {
    return {
      ok: false,
      error: `${ALLOWED_AMOUNT_CENTS_ENV} must be set for the standard price-chain smoke.`,
    };
  }
  const amounts = [];
  for (const part of raw.split(',')) {
    const token = part.trim();
    if (!/^\d+$/.test(token)) {
      return {
        ok: false,
        error: `${ALLOWED_AMOUNT_CENTS_ENV} must contain comma-separated positive integer cents.`,
      };
    }
    const amount = Number(token);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return {
        ok: false,
        error: `${ALLOWED_AMOUNT_CENTS_ENV} must contain comma-separated positive integer cents.`,
      };
    }
    amounts.push(amount);
  }
  return { ok: true, amounts: [...new Set(amounts)] };
}

function pricingTermsUrl(baseUrl) {
  return `${baseUrl}${PRICING_TERMS_PATH}`;
}

async function jsonOrNull(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function readStandardPricingTerms(fetchImpl, baseUrl) {
  const url = pricingTermsUrl(baseUrl);
  let response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    return {
      ok: false,
      error: 'Standard pricing terms failed before an HTTP response.',
      url,
    };
  }
  const body = await jsonOrNull(response);
  if (!response.ok) {
    return {
      ok: false,
      error: `Standard pricing terms failed with HTTP ${response.status}.`,
      url,
      statusCode: response.status,
    };
  }
  const amountCents = Number(body?.amount_cents);
  const currency = String(body?.currency || '').trim().toLowerCase();
  if (
    body?.ok !== true ||
    body?.variant !== 'standard' ||
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0 ||
    !/^[a-z]{3}$/.test(currency)
  ) {
    return {
      ok: false,
      error: 'Standard pricing terms returned an invalid envelope.',
      url,
    };
  }
  return {
    ok: true,
    url,
    terms: {
      variant: 'standard',
      status: String(body.status || 'configured'),
      amountCents,
      currency,
      priceLabel: typeof body.price_label === 'string' ? body.price_label : '',
    },
  };
}

function extractCheckoutSession(checkoutUrl) {
  try {
    const url = new URL(String(checkoutUrl || ''));
    if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') return null;
    const match = decodeURIComponent(url.pathname).match(/\bcs_(test|live)_[A-Za-z0-9_]+/);
    if (!match) return null;
    return {
      id: match[0],
      mode: match[1],
    };
  } catch {
    return null;
  }
}

function stripeApiKey(env) {
  const restrictedKey = String(env.ATLAS_SAAS_STRIPE_RAK || '').trim();
  const fallbackKey = String(env.ATLAS_SAAS_STRIPE_SECRET_KEY || '').trim();
  if (restrictedKey) {
    if (!restrictedKey.startsWith('rk_')) {
      return { ok: false, error: 'ATLAS_SAAS_STRIPE_RAK must start with rk_.' };
    }
    return { ok: true, key: restrictedKey, keySource: 'ATLAS_SAAS_STRIPE_RAK' };
  }
  if (fallbackKey) {
    if (!fallbackKey.startsWith('sk_')) {
      return { ok: false, error: 'ATLAS_SAAS_STRIPE_SECRET_KEY must start with sk_.' };
    }
    return { ok: true, key: fallbackKey, keySource: 'ATLAS_SAAS_STRIPE_SECRET_KEY' };
  }
  return {
    ok: false,
    error: 'ATLAS_SAAS_STRIPE_RAK or ATLAS_SAAS_STRIPE_SECRET_KEY is required to read the Stripe Session.',
  };
}

async function retrieveStripeCheckoutSession({ sessionId, apiKey, stripeFetchImpl }) {
  const url = `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`;
  let response;
  try {
    response = await stripeFetchImpl(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Stripe-Version': STRIPE_API_VERSION,
      },
      cache: 'no-store',
    });
  } catch {
    return {
      ok: false,
      error: 'Stripe Checkout Session lookup failed before an HTTP response.',
      url,
    };
  }
  const body = await jsonOrNull(response);
  if (!response.ok) {
    return {
      ok: false,
      error: `Stripe Checkout Session lookup failed with HTTP ${response.status}.`,
      url,
      statusCode: response.status,
    };
  }
  return { ok: true, url, session: body || {} };
}

function verifyStripeSession({ session, terms, requestId }) {
  const amountTotal = Number(session?.amount_total);
  const currency = String(session?.currency || '').trim().toLowerCase();
  const metadata = session?.metadata && typeof session.metadata === 'object' ? session.metadata : {};
  const errors = [];

  if (amountTotal !== terms.amountCents) {
    errors.push('Stripe Checkout Session amount_total does not match ATLAS terms.');
  }
  if (currency !== terms.currency) {
    errors.push('Stripe Checkout Session currency does not match ATLAS terms.');
  }
  if (String(metadata.request_id || '') !== requestId) {
    errors.push('Stripe Checkout Session metadata request_id does not match the smoke request id.');
  }
  if (String(metadata.price_amount_cents || '') !== String(terms.amountCents)) {
    errors.push('Stripe Checkout Session metadata price_amount_cents does not match ATLAS terms.');
  }
  if (String(metadata.price_currency || '').toLowerCase() !== terms.currency) {
    errors.push('Stripe Checkout Session metadata price_currency does not match ATLAS terms.');
  }
  if (!String(metadata.price_id || '').startsWith('price_')) {
    errors.push('Stripe Checkout Session metadata price_id is missing.');
  }

  if (errors.length) {
    return { ok: false, error: errors[0], errors };
  }
  return {
    ok: true,
    amountCents: amountTotal,
    currency,
    metadata: {
      requestId: metadata.request_id,
      priceId: metadata.price_id,
      priceAmountCents: metadata.price_amount_cents,
      priceCurrency: metadata.price_currency,
    },
  };
}

export async function runDeflectionStandardPriceChainSmoke(options, deps = {}) {
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const stripeFetchImpl = deps.stripeFetchImpl || globalThis.fetch;
  const now = deps.now || (() => new Date().toISOString());
  const nowMs = deps.nowMs || (() => Date.now());
  const sleepImpl = deps.sleepImpl || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const makeAttemptId = deps.makeAttemptId || (() => randomUUID());
  const onAwaitingPayment = deps.onAwaitingPayment || (async () => {});
  const env = options.env || process.env;

  const requestId = String(options.requestId || '').trim();
  const attemptId = String(options.attemptId || makeAttemptId()).trim();
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const expectedMode = String(options.expectMode || 'any').trim().toLowerCase();
  const maxWaitMs = parsePositiveInteger(options.maxWaitMs, DEFAULT_MAX_WAIT_MS);
  const pollMs = parsePositiveInteger(options.pollMs, DEFAULT_POLL_MS);
  const allowLiveCheckout = options.allowLiveCheckout === true;

  if (!REQUEST_ID_RE.test(requestId)) {
    return { ok: false, error: 'Standard price-chain smoke request id is invalid.', apiCalls: false };
  }
  if (!ATTEMPT_ID_RE.test(attemptId)) {
    return { ok: false, error: 'Standard price-chain smoke attempt id is invalid.', apiCalls: false };
  }
  if (!baseUrl) {
    return { ok: false, error: 'Standard price-chain smoke base URL is invalid.', apiCalls: false };
  }
  if (!EXPECTED_MODES.has(expectedMode)) {
    return { ok: false, error: 'Standard price-chain smoke expected mode is invalid.', apiCalls: false };
  }
  if (!maxWaitMs || !pollMs) {
    return { ok: false, error: 'Standard price-chain smoke wait options are invalid.', apiCalls: false };
  }

  const terms = await readStandardPricingTerms(fetchImpl, baseUrl);
  if (!terms.ok) {
    return { ...terms, ok: false, stage: 'pricing_terms', apiCalls: true, requestId, attemptId };
  }

  const allowedAmounts = parseAllowedAmounts(env);
  if (!allowedAmounts.ok) {
    return {
      ok: false,
      error: allowedAmounts.error,
      stage: 'allowed_amounts',
      apiCalls: true,
      requestId,
      attemptId,
      terms: terms.terms,
    };
  }
  if (!allowedAmounts.amounts.includes(terms.terms.amountCents)) {
    return {
      ok: false,
      error: 'ATLAS standard pricing amount is not present in the portfolio allowed amount set.',
      stage: 'allowed_amounts',
      apiCalls: true,
      requestId,
      attemptId,
      terms: terms.terms,
      allowedAmountsCents: allowedAmounts.amounts,
    };
  }

  const checkout = await runDeflectionHostedCheckoutSmoke({
    requestId,
    attemptId,
    baseUrl,
    expectMode: expectedMode,
    priceVariant: 'standard',
    requireCheckoutSession: true,
  }, {
    fetchImpl,
    makeAttemptId,
    now,
  });
  if (!checkout.ok) {
    return { ...checkout, ok: false, stage: checkout.stage || 'checkout', terms: terms.terms };
  }

  const checkoutSession = extractCheckoutSession(checkout.checkoutUrl);
  if (!checkoutSession) {
    return {
      ok: false,
      error: 'Hosted Checkout URL did not include a Stripe Checkout Session id.',
      stage: 'checkout_session',
      apiCalls: true,
      requestId,
      attemptId,
      checkoutUrl: checkout.checkoutUrl,
      terms: terms.terms,
    };
  }
  if (checkoutSession.mode === 'live' && !allowLiveCheckout) {
    return {
      ok: false,
      error: 'Refusing to verify and wait on a live-mode Stripe Checkout Session.',
      stage: 'checkout_mode',
      apiCalls: true,
      requestId,
      attemptId,
      checkoutUrl: checkout.checkoutUrl,
      checkoutMode: checkoutSession.mode,
      terms: terms.terms,
    };
  }

  const apiKey = stripeApiKey(env);
  if (!apiKey.ok) {
    return {
      ok: false,
      error: apiKey.error,
      stage: 'stripe_env',
      apiCalls: true,
      requestId,
      attemptId,
      checkoutUrl: checkout.checkoutUrl,
      checkoutMode: checkoutSession.mode,
      terms: terms.terms,
    };
  }

  const stripeSession = await retrieveStripeCheckoutSession({
    sessionId: checkoutSession.id,
    apiKey: apiKey.key,
    stripeFetchImpl,
  });
  if (!stripeSession.ok) {
    return {
      ...stripeSession,
      ok: false,
      stage: 'stripe_session',
      apiCalls: true,
      requestId,
      attemptId,
      checkoutUrl: checkout.checkoutUrl,
      checkoutMode: checkoutSession.mode,
      terms: terms.terms,
      stripeSessionId: checkoutSession.id,
      keySource: apiKey.keySource,
    };
  }

  const verifiedSession = verifyStripeSession({
    session: stripeSession.session,
    terms: terms.terms,
    requestId,
  });
  if (!verifiedSession.ok) {
    return {
      ...verifiedSession,
      ok: false,
      stage: 'stripe_session',
      apiCalls: true,
      requestId,
      attemptId,
      checkoutUrl: checkout.checkoutUrl,
      checkoutMode: checkoutSession.mode,
      terms: terms.terms,
      stripeSessionId: checkoutSession.id,
      keySource: apiKey.keySource,
    };
  }

  const paidUnlock = await runDeflectionPaidUnlockSmoke({
    requestId,
    attemptId,
    baseUrl,
    checkoutUrl: checkout.checkoutUrl,
    maxWaitMs,
    pollMs,
    allowLiveCheckout,
  }, {
    fetchImpl,
    now,
    nowMs,
    sleepImpl,
    onAwaitingPayment,
  });
  if (!paidUnlock.ok) {
    return {
      ...paidUnlock,
      ok: false,
      stage: `paid_unlock_${paidUnlock.stage || 'unknown'}`,
      terms: terms.terms,
      allowedAmountsCents: allowedAmounts.amounts,
      stripeSessionId: checkoutSession.id,
      stripeSession: verifiedSession,
      keySource: apiKey.keySource,
    };
  }

  return {
    ok: true,
    mode: 'DEFLECTION_STANDARD_PRICE_CHAIN_SMOKE',
    status: 'paid_rendered',
    apiCalls: true,
    checkedAt: now(),
    requestId,
    attemptId,
    pricingTermsUrl: terms.url,
    terms: terms.terms,
    allowedAmountsCents: allowedAmounts.amounts,
    checkoutUrl: checkout.checkoutUrl,
    checkoutMode: checkoutSession.mode,
    stripeSessionId: checkoutSession.id,
    stripeSession: verifiedSession,
    keySource: apiKey.keySource,
    paidUnlock,
  };
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const outputJson = parsed.flags.has('--json');
  const outputPath = parsed.values.get('--output');

  if (parsed.flags.has('--help') || parsed.flags.has('-h')) {
    printUsage();
    return;
  }
  if (isBareFlag(parsed, '--output')) {
    fail('Refusing to continue without --output <path>.', outputJson);
  }
  if (isBareFlag(parsed, '--request-id') || !parsed.values.get('--request-id')?.trim()) {
    fail('Deflection standard price-chain smoke is missing --request-id.', outputJson, {
      apiCalls: false,
    });
  }
  if (isBareFlag(parsed, '--base-url')) {
    fail('Refusing to continue without --base-url <url>.', outputJson, { apiCalls: false });
  }
  if (isBareFlag(parsed, '--expect-mode')) {
    fail('Refusing to continue without --expect-mode <mode>.', outputJson, {
      apiCalls: false,
    });
  }
  if (isBareFlag(parsed, '--vercel-deployment')) {
    fail('Refusing to continue without --vercel-deployment <id|url>.', outputJson, {
      apiCalls: false,
    });
  }

  if (!parsed.flags.has('--no-local-env')) {
    await loadLocalEnv();
  }

  const baseUrl = parsed.values.get('--base-url') || DEFAULT_BASE_URL;
  const useVercelCurl = parsed.flags.has('--vercel-curl');
  const fetchImpl = useVercelCurl
    ? makeVercelCurlFetch({
      deployment: parsed.values.get('--vercel-deployment') || baseUrl,
    })
    : undefined;
  const result = await runDeflectionStandardPriceChainSmoke({
    requestId: parsed.values.get('--request-id'),
    attemptId: parsed.values.get('--attempt-id'),
    baseUrl,
    expectMode: parsed.values.get('--expect-mode') || 'any',
    maxWaitMs: parsed.values.get('--max-wait-ms'),
    pollMs: parsed.values.get('--poll-ms'),
    allowLiveCheckout: parsed.flags.has('--allow-live-checkout'),
  }, {
    ...(fetchImpl ? { fetchImpl } : {}),
    onAwaitingPayment: async (artifact) => {
      console.log(`${artifact.checkoutMode === 'live' ? 'Live' : 'Test'}-mode Checkout URL: ${artifact.checkoutUrl}`);
      console.log('Complete payment in another window; polling for unlock...');
      if (outputPath) {
        await writeJsonArtifact(outputPath, {
          ok: true,
          mode: 'DEFLECTION_STANDARD_PRICE_CHAIN_SMOKE',
          stage: 'awaiting_payment',
          requestId: artifact.requestId,
          attemptId: artifact.attemptId,
          checkoutUrl: artifact.checkoutUrl,
          checkoutMode: artifact.checkoutMode,
        }, { includeOutputPath: false });
      }
    },
  });
  const artifactPath = outputPath
    ? await writeJsonArtifact(outputPath, result, { includeOutputPath: false })
    : '';

  if (!result.ok) fail(result.error, outputJson, result);
  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Deflection standard price-chain smoke passed.');
  console.log(`Terms: ${result.terms.amountCents} ${result.terms.currency}`);
  console.log(`Allowed amounts: ${result.allowedAmountsCents.join(', ')}`);
  console.log(`Checkout mode: ${result.checkoutMode}`);
  console.log(`Results URL: ${result.paidUnlock.resultsUrl}`);
  if (artifactPath) console.log(`Smoke artifact: ${artifactPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    fail(error.message || String(error), false, { apiCalls: false });
  });
}
