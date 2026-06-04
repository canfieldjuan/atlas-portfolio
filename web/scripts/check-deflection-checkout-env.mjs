import { readFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';
import { repoRoot } from './ads-spec-io.mjs';
import { loadLocalEnv } from './local-env.mjs';

const DEFAULT_ENVIRONMENT = 'local';
const PRICE_ID_RE = /^price_[A-Za-z0-9_]{8,}$/;
const DEFAULT_ALLOWED_AMOUNT_CENTS = 1500 * 100;
const ALLOWED_AMOUNT_CENTS_ENV =
  'ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS';
const LEGACY_INLINE_AMOUNT_ERROR =
  `${ALLOWED_AMOUNT_CENTS_ENV} must include ${DEFAULT_ALLOWED_AMOUNT_CENTS} when ` +
  'ATLAS_SAAS_STRIPE_SECRET_KEY fallback uses inline test price_data.';
const CHECKOUT_ENV_KEYS = [
  'ATLAS_SAAS_STRIPE_RAK',
  'ATLAS_SAAS_STRIPE_SECRET_KEY',
  'ATLAS_ACCOUNT_ID',
  'STRIPE_DEFLECTION_REPORT_PRICE_ID',
  ALLOWED_AMOUNT_CENTS_ENV,
  'VERCEL_ENV',
];

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
  STRIPE_DEFLECTION_REPORT_PRICE_ID=price_...
  ${ALLOWED_AMOUNT_CENTS_ENV}=150000[,180000...] (optional; defaults to 150000)

Preview/development/local accept:
  ATLAS_SAAS_STRIPE_RAK=rk_test_... plus STRIPE_DEFLECTION_REPORT_PRICE_ID=price_...
  or ATLAS_SAAS_STRIPE_SECRET_KEY=sk_test_... as the legacy test-mode fallback.`);
}

function modeForKey(value) {
  if (!value) return 'missing';
  if (value.startsWith('rk_live_')) return 'live_restricted';
  if (value.startsWith('rk_test_')) return 'test_restricted';
  if (value.startsWith('rk_')) return 'restricted_unknown_mode';
  if (value.startsWith('sk_live_')) return 'live_secret';
  if (value.startsWith('sk_test_')) return 'test_secret';
  if (value.startsWith('sk_')) return 'secret_unknown_mode';
  return 'unknown';
}

function clean(value) {
  return String(value || '').trim();
}

function parseAllowedAmounts(rawValue) {
  const raw = clean(rawValue);
  if (!raw) {
    return {
      ok: true,
      amounts: [DEFAULT_ALLOWED_AMOUNT_CENTS],
      mode: 'default',
      error: '',
    };
  }

  const amounts = [];
  for (const part of raw.split(',')) {
    const token = part.trim();
    if (!/^\d+$/.test(token)) {
      return {
        ok: false,
        amounts: [],
        mode: 'invalid',
        error: `${ALLOWED_AMOUNT_CENTS_ENV} must contain comma-separated positive integer cents.`,
      };
    }
    const amount = Number(token);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return {
        ok: false,
        amounts: [],
        mode: 'invalid',
        error: `${ALLOWED_AMOUNT_CENTS_ENV} must contain comma-separated positive integer cents.`,
      };
    }
    amounts.push(amount);
  }

  return {
    ok: true,
    amounts: [...new Set(amounts)],
    mode: 'configured',
    error: '',
  };
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

function addMissing(missing, name) {
  if (!missing.includes(name)) missing.push(name);
}

function addInvalid(invalid, message) {
  if (!invalid.includes(message)) invalid.push(message);
}

function classifyEnv(env) {
  const rak = clean(env.ATLAS_SAAS_STRIPE_RAK);
  const legacySecret = clean(env.ATLAS_SAAS_STRIPE_SECRET_KEY);
  const accountId = clean(env.ATLAS_ACCOUNT_ID);
  const priceId = clean(env.STRIPE_DEFLECTION_REPORT_PRICE_ID);
  const allowedAmounts = parseAllowedAmounts(env[ALLOWED_AMOUNT_CENTS_ENV]);

  return {
    present: [
      rak ? 'ATLAS_SAAS_STRIPE_RAK' : '',
      legacySecret ? 'ATLAS_SAAS_STRIPE_SECRET_KEY' : '',
      accountId ? 'ATLAS_ACCOUNT_ID' : '',
      priceId ? 'STRIPE_DEFLECTION_REPORT_PRICE_ID' : '',
      clean(env[ALLOWED_AMOUNT_CENTS_ENV]) ? ALLOWED_AMOUNT_CENTS_ENV : '',
    ].filter(Boolean),
    keyModes: {
      ATLAS_SAAS_STRIPE_RAK: modeForKey(rak),
      ATLAS_SAAS_STRIPE_SECRET_KEY: modeForKey(legacySecret),
      ATLAS_ACCOUNT_ID: accountId ? 'configured' : 'missing',
      STRIPE_DEFLECTION_REPORT_PRICE_ID: priceId ? 'configured' : 'missing',
      [ALLOWED_AMOUNT_CENTS_ENV]: allowedAmounts.mode,
    },
    rak,
    legacySecret,
    accountId,
    priceId,
    allowedAmounts,
  };
}

export function validateDeflectionCheckoutEnv(env, options = {}) {
  const environment = clean(options.environment || env.VERCEL_ENV || DEFAULT_ENVIRONMENT).toLowerCase();
  const deploymentEnvironment = environment || DEFAULT_ENVIRONMENT;
  const classified = classifyEnv(env);
  const missing = [];
  const invalid = [];
  const warnings = [];
  const isProduction = deploymentEnvironment === 'production';

  if (!classified.accountId) {
    addMissing(missing, 'ATLAS_ACCOUNT_ID');
  }
  if (!classified.allowedAmounts.ok) {
    addInvalid(invalid, classified.allowedAmounts.error);
  }

  if (isProduction) {
    if (!classified.rak) {
      addMissing(missing, 'ATLAS_SAAS_STRIPE_RAK');
      if (classified.legacySecret) {
        warnings.push('ATLAS_SAAS_STRIPE_SECRET_KEY is ignored by production checkout.');
      }
    } else if (!classified.rak.startsWith('rk_live_')) {
      addInvalid(invalid, 'ATLAS_SAAS_STRIPE_RAK must start with rk_live_ in production.');
    }

    if (!classified.priceId) {
      addMissing(missing, 'STRIPE_DEFLECTION_REPORT_PRICE_ID');
    } else if (!PRICE_ID_RE.test(classified.priceId)) {
      addInvalid(invalid, 'STRIPE_DEFLECTION_REPORT_PRICE_ID must be a Stripe price_ id.');
    }

    if (classified.legacySecret && classified.rak) {
      warnings.push('ATLAS_SAAS_STRIPE_SECRET_KEY is present but ignored while ATLAS_SAAS_STRIPE_RAK is configured.');
    }
  } else {
    if (classified.rak) {
      if (!classified.rak.startsWith('rk_')) {
        addInvalid(invalid, 'ATLAS_SAAS_STRIPE_RAK must start with rk_.');
      }
      if (classified.rak.startsWith('rk_live_')) {
        addInvalid(invalid, 'Non-production checkout env must not use an rk_live_ key.');
      }
      if (!classified.priceId) {
        addMissing(missing, 'STRIPE_DEFLECTION_REPORT_PRICE_ID');
      } else if (!PRICE_ID_RE.test(classified.priceId)) {
        addInvalid(invalid, 'STRIPE_DEFLECTION_REPORT_PRICE_ID must be a Stripe price_ id.');
      }
    } else if (classified.legacySecret) {
      if (!classified.legacySecret.startsWith('sk_test_')) {
        addInvalid(invalid, 'ATLAS_SAAS_STRIPE_SECRET_KEY fallback must be sk_test_ outside production.');
      }
      if (
        !classified.priceId &&
        classified.allowedAmounts.ok &&
        !classified.allowedAmounts.amounts.includes(DEFAULT_ALLOWED_AMOUNT_CENTS)
      ) {
        addInvalid(invalid, LEGACY_INLINE_AMOUNT_ERROR);
      }
    } else {
      addMissing(missing, 'ATLAS_SAAS_STRIPE_RAK or ATLAS_SAAS_STRIPE_SECRET_KEY');
    }
  }

  const errors = [
    ...missing.map((name) => `Missing ${name}.`),
    ...invalid,
  ];

  return {
    ok: missing.length === 0 && invalid.length === 0,
    mode: 'DEFLECTION_CHECKOUT_ENV_PREFLIGHT',
    environment: deploymentEnvironment,
    present: classified.present,
    missing,
    invalid,
    warnings,
    errors,
    keyModes: classified.keyModes,
    allowedAmountsCents: classified.allowedAmounts.amounts,
  };
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
