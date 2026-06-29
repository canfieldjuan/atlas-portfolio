import { readFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';
import { repoRoot } from './ads-spec-io.mjs';
import { loadLocalEnv } from './local-env.mjs';
import checkoutRequirements from '../src/lib/deflection-checkout-requirements.js';

const {
  DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV: ALLOWED_AMOUNT_CENTS_ENV,
} = checkoutRequirements;

const DEFAULT_BASE_URL = 'https://juancanfield.com';
const PRICING_TERMS_PATH = '/api/deflection-pricing/standard';

function printUsage() {
  console.log(`Deflection standard price preflight

Usage:
  npm --prefix web run smoke:deflection-standard-price-preflight

Options:
  --base-url <url>    Hosted portfolio base URL (default: ${DEFAULT_BASE_URL})
  --env-file <path>   Load candidate env values from a file before validation
  --no-local-env      Do not auto-load .env.local/.env before reading local env
  --json              Print machine-readable JSON
  --output <path>     Write the preflight artifact JSON

Safety:
  This fetches hosted standard pricing terms and compares the amount to the
  local/candidate ${ALLOWED_AMOUNT_CENTS_ENV} value. It does not create Stripe
  Checkout Sessions, complete payments, fake webhooks, or unlock reports.`);
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

function pricingTermsUrl(baseUrl) {
  return `${baseUrl}${PRICING_TERMS_PATH}`;
}

function parseEnvLine(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;
  const equalsIndex = trimmed.indexOf('=');
  if (equalsIndex <= 0) return null;
  const key = trimmed.slice(0, equalsIndex).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null;
  let value = trimmed.slice(equalsIndex + 1).trim();
  if (value.length >= 2) {
    const first = value[0];
    const last = value[value.length - 1];
    if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
      value = value.slice(1, -1);
    }
  }
  return { key, value };
}

async function readEnvFile(file) {
  const path = isAbsolute(file) ? file : join(repoRoot, file);
  const text = await readFile(path, 'utf8');
  const env = {};
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (parsed) env[parsed.key] = parsed.value;
  }
  return env;
}

function parseAllowedAmounts(env) {
  const raw = String(env[ALLOWED_AMOUNT_CENTS_ENV] || '').trim();
  if (!raw) {
    return {
      ok: false,
      error: `${ALLOWED_AMOUNT_CENTS_ENV} must be set for the standard price preflight.`,
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

async function jsonOrNull(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function parseStandardPricingTerms(value) {
  if (!value || typeof value !== 'object') return null;
  const amountCents = value.amount_cents;
  const currency = value.currency;
  const priceLabel = value.price_label;
  if (
    value.ok === true &&
    value.variant === 'standard' &&
    value.status === 'configured' &&
    Number.isSafeInteger(amountCents) &&
    amountCents > 0 &&
    typeof currency === 'string' &&
    /^[a-zA-Z]{3}$/.test(currency) &&
    typeof priceLabel === 'string' &&
    priceLabel.trim().length > 0
  ) {
    return {
      amountCents,
      currency: currency.trim().toLowerCase(),
      priceLabel: priceLabel.trim(),
      status: 'configured',
      variant: 'standard',
    };
  }
  return null;
}

async function fetchStandardPricingTerms(fetchImpl, baseUrl) {
  const checkedUrl = pricingTermsUrl(baseUrl);
  let response;
  try {
    response = await fetchImpl(checkedUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch (error) {
    return {
      ok: false,
      checkedUrl,
      error: 'Standard pricing terms failed before an HTTP response.',
      cause: error instanceof Error ? error.message : String(error),
    };
  }

  const body = await jsonOrNull(response);
  if (!response.ok) {
    return {
      ok: false,
      checkedUrl,
      error: `Standard pricing terms failed with HTTP ${response.status}.`,
      httpStatus: response.status,
    };
  }

  const terms = parseStandardPricingTerms(body);
  if (!terms) {
    return {
      ok: false,
      checkedUrl,
      error: 'Standard pricing terms returned an invalid envelope.',
      httpStatus: response.status,
    };
  }

  return { ok: true, checkedUrl, terms };
}

export async function runDeflectionStandardPricePreflight(options = {}) {
  const baseUrl = normalizeBaseUrl(options.baseUrl || DEFAULT_BASE_URL);
  if (!baseUrl) {
    return {
      ok: false,
      error: 'Invalid --base-url. Use https://, localhost, or 127.0.0.1.',
    };
  }

  const env = options.env || process.env;
  const allowed = parseAllowedAmounts(env);
  if (!allowed.ok) return { ok: false, error: allowed.error };

  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== 'function') {
    return { ok: false, error: 'No fetch implementation is available.' };
  }

  const fetched = await fetchStandardPricingTerms(fetchImpl, baseUrl);
  if (!fetched.ok) return fetched;

  const { terms } = fetched;
  const allowedAmountMatched = allowed.amounts.includes(terms.amountCents);
  const result = {
    ok: allowedAmountMatched,
    checkedUrl: fetched.checkedUrl,
    variant: terms.variant,
    status: terms.status,
    amountCents: terms.amountCents,
    currency: terms.currency,
    priceLabel: terms.priceLabel,
    allowedAmountsCents: allowed.amounts,
    allowedAmountMatched,
  };

  if (!allowedAmountMatched) {
    return {
      ...result,
      error: `Hosted standard amount ${terms.amountCents} is not present in ${ALLOWED_AMOUNT_CENTS_ENV}.`,
    };
  }

  return result;
}

async function buildCliEnv(parsed) {
  let env = process.env;
  if (parsed.values.has('--env-file')) {
    env = { ...process.env, ...(await readEnvFile(parsed.values.get('--env-file'))) };
  } else if (!parsed.flags.has('--no-local-env')) {
    await loadLocalEnv();
    env = process.env;
  }
  return env;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const outputJson = parsed.flags.has('--json');
  const outputPath = parsed.values.get('--output');

  if (parsed.flags.has('--help') || parsed.flags.has('-h')) {
    printUsage();
    return;
  }
  if (isBareFlag(parsed, '--base-url')) {
    failCommand('Refusing to continue without --base-url <url>.', outputJson);
  }
  if (isBareFlag(parsed, '--env-file')) {
    failCommand('Refusing to continue without --env-file <path>.', outputJson);
  }
  if (isBareFlag(parsed, '--output')) {
    failCommand('Refusing to continue without --output <path>.', outputJson);
  }

  const result = await runDeflectionStandardPricePreflight({
    baseUrl: parsed.values.get('--base-url'),
    env: await buildCliEnv(parsed),
  });
  const artifactPath = outputPath
    ? await writeJsonArtifact(outputPath, result, { includeOutputPath: false })
    : '';

  if (!result.ok) {
    failCommand('Deflection standard price preflight failed.', outputJson, {
      ...result,
      artifactPath,
    });
  }

  if (outputJson) {
    console.log(JSON.stringify({ ...result, artifactPath }, null, 2));
    return;
  }

  console.log('Deflection standard price preflight passed.');
  console.log(`Checked: ${result.checkedUrl}`);
  console.log(`Standard price: ${result.priceLabel} (${result.amountCents} ${result.currency})`);
  console.log(`Allowed amounts: ${result.allowedAmountsCents.join(', ')}`);
  if (artifactPath) {
    console.log(`Preflight artifact: ${artifactPath}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    failCommand(error.message || String(error), false, {
      apiCalls: false,
    });
  });
}
