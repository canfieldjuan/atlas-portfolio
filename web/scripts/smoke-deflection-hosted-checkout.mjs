import { randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const ATTEMPT_ID_RE = /^[A-Za-z0-9._:-]{8,160}$/;
const DEFAULT_BASE_URL = 'https://juancanfield.com';
const CHECKOUT_PATH = '/api/deflection-checkout';

function printUsage() {
  console.log(`Deflection hosted Checkout smoke

Usage:
  npm --prefix web run smoke:deflection-hosted-checkout -- \\
    --request-id content-ops-...

Options:
  --attempt-id <id>  Explicit attempt id (default: generated)
  --base-url <url>   Hosted portfolio base URL (default: ${DEFAULT_BASE_URL})
  --json             Print machine-readable JSON
  --output <path>    Write the smoke artifact JSON

Safety:
  This creates a Stripe Checkout Session through the hosted portfolio route.
  It does not complete payment, call Stripe directly, or mark the report paid.`);
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

function isStripeCheckoutUrl(value) {
  if (typeof value !== 'string' || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'checkout.stripe.com';
  } catch {
    return false;
  }
}

async function jsonOrNull(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function runDeflectionHostedCheckoutSmoke(options, deps = {}) {
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const now = deps.now || (() => new Date().toISOString());
  const makeAttemptId = deps.makeAttemptId || (() => randomUUID());
  const requestId = String(options.requestId || '').trim();
  const attemptId = String(options.attemptId || makeAttemptId()).trim();
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  if (!REQUEST_ID_RE.test(requestId)) {
    return {
      ok: false,
      error: 'Hosted Checkout smoke request id is invalid.',
      apiCalls: false,
      requestId,
    };
  }
  if (!ATTEMPT_ID_RE.test(attemptId)) {
    return {
      ok: false,
      error: 'Hosted Checkout smoke attempt id is invalid.',
      apiCalls: false,
      requestId,
      attemptId,
    };
  }
  if (!baseUrl) {
    return {
      ok: false,
      error: 'Hosted Checkout smoke base URL is invalid.',
      apiCalls: false,
      requestId,
      attemptId,
    };
  }

  const url = `${baseUrl}${CHECKOUT_PATH}`;
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, attemptId }),
      cache: 'no-store',
    });
  } catch {
    return {
      ok: false,
      error: 'Hosted Checkout route failed before an HTTP response.',
      stage: 'checkout',
      apiCalls: true,
      requestId,
      attemptId,
      url,
    };
  }

  const body = await jsonOrNull(response);
  if (!response.ok) {
    return {
      ok: false,
      error: `Hosted Checkout route failed with HTTP ${response.status}.`,
      stage: 'checkout',
      apiCalls: true,
      requestId,
      attemptId,
      url,
    };
  }

  if (body?.alreadyPaid === true) {
    return {
      ok: true,
      mode: 'DEFLECTION_HOSTED_CHECKOUT_SMOKE',
      status: 'already_paid',
      apiCalls: true,
      checkedAt: now(),
      requestId,
      attemptId,
      url,
    };
  }

  if (!isStripeCheckoutUrl(body?.url)) {
    return {
      ok: false,
      error: 'Hosted Checkout route did not return a Stripe Checkout URL.',
      stage: 'checkout',
      apiCalls: true,
      requestId,
      attemptId,
      url,
    };
  }

  return {
    ok: true,
    mode: 'DEFLECTION_HOSTED_CHECKOUT_SMOKE',
    status: 'checkout_created',
    apiCalls: true,
    checkedAt: now(),
    requestId,
    attemptId,
    url,
    checkoutUrl: body.url,
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
    fail('Deflection hosted Checkout smoke is missing --request-id.', outputJson, {
      apiCalls: false,
    });
  }

  const result = await runDeflectionHostedCheckoutSmoke({
    requestId: parsed.values.get('--request-id'),
    attemptId: parsed.values.get('--attempt-id'),
    baseUrl: parsed.values.get('--base-url') || DEFAULT_BASE_URL,
  });
  const artifactPath = outputPath
    ? await writeJsonArtifact(outputPath, result, { includeOutputPath: false })
    : '';

  if (!result.ok) {
    fail(result.error, outputJson, result);
  }
  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Deflection hosted Checkout smoke passed.');
  console.log(`Status: ${result.status}`);
  console.log(`Request id: ${result.requestId}`);
  if (result.checkoutUrl) {
    console.log(`Checkout URL: ${result.checkoutUrl}`);
  }
  if (artifactPath) {
    console.log(`Smoke artifact: ${artifactPath}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    fail(error.message || String(error), false, {
      apiCalls: false,
    });
  });
}
