import { readFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';
import { repoRoot } from './ads-spec-io.mjs';
import { loadLocalEnv } from './local-env.mjs';
import checkoutRequirements from '../src/lib/deflection-checkout-requirements.js';

const {
  DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV: ALLOWED_AMOUNT_CENTS_ENV,
  DEFLECTION_CHECKOUT_ENV_KEYS: CHECKOUT_ENV_KEYS,
  DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV: LEGACY_PRICE_ID_ENV,
  DEFLECTION_CHECKOUT_PARTNER_ACCESS_TOKEN_ENV: PARTNER_ACCESS_TOKEN_ENV,
  DEFLECTION_CHECKOUT_PARTNER_PRICE_ID_ENV: PARTNER_PRICE_ID_ENV,
  DEFLECTION_CHECKOUT_PARTNER_SIGNING_SECRETS_ENV: PARTNER_SIGNING_SECRETS_ENV,
  DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV: STANDARD_PRICE_ID_ENV,
  validateDeflectionCheckoutEnv,
} = checkoutRequirements;

export { validateDeflectionCheckoutEnv };

function printUsage() {
  console.log(`Deflection checkout env preflight

Usage:
  npm --prefix web run check:deflection-checkout-env -- --environment production

Options:
  --environment <name>  Deployment environment: production, preview, development, or local.
  --env-file <path>     Load env values from a file before validation.
  --no-local-env        Do not auto-load .env.local/.env.
  --json                Print machine-readable JSON.
  --output <path>       Write the preflight artifact JSON.

Production requires:
  ATLAS_SAAS_STRIPE_RAK=rk_live_...
  ATLAS_ACCOUNT_ID=<account-id>
  ${STANDARD_PRICE_ID_ENV}=price_... (preferred)
  ${LEGACY_PRICE_ID_ENV}=price_... (legacy fallback)
  ${PARTNER_PRICE_ID_ENV}=price_... (partner variant)
  ${PARTNER_ACCESS_TOKEN_ENV}=<long random token> (direct partner links)
  ${PARTNER_SIGNING_SECRETS_ENV}=<old,current> (signed expiring partner links)
  ${ALLOWED_AMOUNT_CENTS_ENV}=150000[,100000...] (required to include 100000 when partner is configured)

Preview/development/local accept:
  ATLAS_SAAS_STRIPE_RAK=rk_test_... plus ${STANDARD_PRICE_ID_ENV}=price_...
  or ATLAS_SAAS_STRIPE_SECRET_KEY=sk_test_... as the legacy test-mode fallback.`);
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

function overlayCheckoutEnv(baseEnv, checkoutEnv) {
  const merged = { ...baseEnv };
  for (const key of CHECKOUT_ENV_KEYS) {
    delete merged[key];
  }
  return { ...merged, ...checkoutEnv };
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const outputJson = parsed.flags.has('--json');
  const outputPath = parsed.values.get('--output');
  const envFile = parsed.values.get('--env-file');

  if (parsed.flags.has('--help') || parsed.flags.has('-h')) {
    printUsage();
    return;
  }
  if (isBareFlag(parsed, '--output')) {
    failCommand('Refusing to continue without --output <path>.', outputJson);
  }
  if (isBareFlag(parsed, '--environment')) {
    failCommand('Refusing to continue without --environment <name>.', outputJson);
  }
  if (isBareFlag(parsed, '--env-file')) {
    failCommand('Refusing to continue without --env-file <path>.', outputJson);
  }

  let env = process.env;
  if (envFile) {
    env = overlayCheckoutEnv(process.env, await readEnvFile(envFile));
  } else if (!parsed.flags.has('--no-local-env')) {
    await loadLocalEnv();
  }

  const result = validateDeflectionCheckoutEnv(env, {
    environment: parsed.values.get('--environment'),
  });
  const artifactPath = outputPath
    ? await writeJsonArtifact(outputPath, result, { includeOutputPath: false })
    : '';

  if (!result.ok) {
    failCommand('Deflection checkout environment is incomplete.', outputJson, result);
  }

  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Deflection checkout env preflight passed.');
  console.log(`Environment: ${result.environment}`);
  console.log(`Present: ${result.present.join(', ') || 'none'}`);
  console.log(`Allowed amounts: ${result.allowedAmountsCents.join(', ')}`);
  if (result.warnings.length) {
    console.log(`Warnings: ${result.warnings.join(' ')}`);
  }
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
