import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateDeflectionCheckoutEnv } from './check-deflection-checkout-env.mjs';

function validate(env, environment) {
  return validateDeflectionCheckoutEnv(env, { environment });
}

const DEFAULT_ALLOWED_AMOUNT_CENTS = 1500 * 100;
const PARTNER_ALLOWED_AMOUNT_CENTS = 1000 * 100;
const VARIANT_ALLOWED_AMOUNT_CENTS = DEFAULT_ALLOWED_AMOUNT_CENTS + 30_000;
const STANDARD_PRICE_ID_ENV = 'STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD';
const PARTNER_PRICE_ID_ENV = 'STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER';
const PARTNER_ACCESS_TOKEN_ENV = 'DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN';
const LEGACY_PRICE_ID_ENV = 'STRIPE_DEFLECTION_REPORT_PRICE_ID';
const PRICE_ID_MISSING_NAME = `${STANDARD_PRICE_ID_ENV} or ${LEGACY_PRICE_ID_ENV}`;
const ALLOWED_AMOUNT_CENTS_ENV =
  'ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS';
const LEGACY_INLINE_AMOUNT_ERROR =
  `${ALLOWED_AMOUNT_CENTS_ENV} must include ${DEFAULT_ALLOWED_AMOUNT_CENTS} when ` +
  'ATLAS_SAAS_STRIPE_SECRET_KEY fallback uses inline test price_data.';
const STANDARD_ALLOWED_AMOUNT_ERROR =
  `${ALLOWED_AMOUNT_CENTS_ENV} must include ${DEFAULT_ALLOWED_AMOUNT_CENTS} when ` +
  `${STANDARD_PRICE_ID_ENV} or ${LEGACY_PRICE_ID_ENV} is configured.`;
const PARTNER_ALLOWED_AMOUNT_ERROR =
  `${ALLOWED_AMOUNT_CENTS_ENV} must include ${PARTNER_ALLOWED_AMOUNT_CENTS} when ` +
  `${PARTNER_PRICE_ID_ENV} is configured.`;
const PRODUCTION_ALLOWED_AMOUNTS = `${DEFAULT_ALLOWED_AMOUNT_CENTS}, ${PARTNER_ALLOWED_AMOUNT_CENTS}`;
const PRODUCTION_PARTNER_ACCESS_TOKEN = 'partner_unit_access_token';

function withProductionPartnerAccessToken(env) {
  return {
    ...env,
    [PARTNER_ACCESS_TOKEN_ENV]: PRODUCTION_PARTNER_ACCESS_TOKEN,
  };
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_legacy_ignored',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [LEGACY_PRICE_ID_ENV]: 'price_legacy123',
      [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
    }),
    'production',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes.ATLAS_SAAS_STRIPE_RAK, 'live_restricted');
  assert.equal(result.keyModes[STANDARD_PRICE_ID_ENV], 'configured');
  assert.equal(result.keyModes[PARTNER_PRICE_ID_ENV], 'configured');
  assert.equal(result.keyModes[PARTNER_ACCESS_TOKEN_ENV], 'configured');
  assert.equal(result.keyModes[LEGACY_PRICE_ID_ENV], 'configured');
  assert.equal(result.keyModes[ALLOWED_AMOUNT_CENTS_ENV], 'configured');
  assert.deepEqual(result.allowedAmountsCents, [
    DEFAULT_ALLOWED_AMOUNT_CENTS,
    PARTNER_ALLOWED_AMOUNT_CENTS,
  ]);
  assert(result.warnings.some((warning) => warning.includes('ignored')));
  assert(result.warnings.some((warning) => warning.includes(LEGACY_PRICE_ID_ENV)));
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
    },
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [PARTNER_ACCESS_TOKEN_ENV]);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes[PARTNER_ACCESS_TOKEN_ENV], 'missing');
  assert(result.errors.includes(`Missing ${PARTNER_ACCESS_TOKEN_ENV}.`));
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [PARTNER_ACCESS_TOKEN_ENV]: ' , ,, ',
      [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
    },
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [PARTNER_ACCESS_TOKEN_ENV]);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes[PARTNER_ACCESS_TOKEN_ENV], 'missing');
  assert(!result.present.includes(PARTNER_ACCESS_TOKEN_ENV));
  assert(result.errors.includes(`Missing ${PARTNER_ACCESS_TOKEN_ENV}.`));
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [LEGACY_PRICE_ID_ENV]: 'not_a_price',
      [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
    }),
    'production',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
  assert(result.warnings.some((warning) => warning.includes(LEGACY_PRICE_ID_ENV)));
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [LEGACY_PRICE_ID_ENV]: 'price_legacy123',
      [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
    }),
    'production',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes[STANDARD_PRICE_ID_ENV], 'missing');
  assert.equal(result.keyModes[LEGACY_PRICE_ID_ENV], 'configured');
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'not_a_price',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [LEGACY_PRICE_ID_ENV]: 'price_legacy123',
      [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, [`${STANDARD_PRICE_ID_ENV} must be a Stripe price_ id.`]);
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [ALLOWED_AMOUNT_CENTS_ENV]:
        `${DEFAULT_ALLOWED_AMOUNT_CENTS}, ${PARTNER_ALLOWED_AMOUNT_CENTS}, ${VARIANT_ALLOWED_AMOUNT_CENTS}`,
    }),
    'production',
  );
  assert.equal(result.ok, true);
  assert(result.present.includes(ALLOWED_AMOUNT_CENTS_ENV));
  assert.equal(result.keyModes[ALLOWED_AMOUNT_CENTS_ENV], 'configured');
  assert.deepEqual(result.allowedAmountsCents, [
    DEFAULT_ALLOWED_AMOUNT_CENTS,
    PARTNER_ALLOWED_AMOUNT_CENTS,
    VARIANT_ALLOWED_AMOUNT_CENTS,
  ]);
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, [PARTNER_ALLOWED_AMOUNT_ERROR]);
  assert.equal(result.keyModes[PARTNER_PRICE_ID_ENV], 'configured');
  assert.deepEqual(result.allowedAmountsCents, [DEFAULT_ALLOWED_AMOUNT_CENTS]);
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [ALLOWED_AMOUNT_CENTS_ENV]:
        `${DEFAULT_ALLOWED_AMOUNT_CENTS}, ${PARTNER_ALLOWED_AMOUNT_CENTS}`,
    }),
    'production',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes[PARTNER_PRICE_ID_ENV], 'configured');
  assert.deepEqual(result.allowedAmountsCents, [
    DEFAULT_ALLOWED_AMOUNT_CENTS,
    PARTNER_ALLOWED_AMOUNT_CENTS,
  ]);
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [ALLOWED_AMOUNT_CENTS_ENV]: String(PARTNER_ALLOWED_AMOUNT_CENTS),
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, [STANDARD_ALLOWED_AMOUNT_ERROR]);
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [PARTNER_PRICE_ID_ENV]: 'not_a_price',
      [ALLOWED_AMOUNT_CENTS_ENV]:
        `${DEFAULT_ALLOWED_AMOUNT_CENTS}, ${PARTNER_ALLOWED_AMOUNT_CENTS}`,
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, [`${PARTNER_PRICE_ID_ENV} must be a Stripe price_ id.`]);
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [ALLOWED_AMOUNT_CENTS_ENV]: `${DEFAULT_ALLOWED_AMOUNT_CENTS},,${VARIANT_ALLOWED_AMOUNT_CENTS}`,
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, [
    `${ALLOWED_AMOUNT_CENTS_ENV} must contain comma-separated positive integer cents.`,
  ]);
  assert.deepEqual(result.allowedAmountsCents, []);
  assert.equal(result.keyModes[ALLOWED_AMOUNT_CENTS_ENV], 'invalid');
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [ALLOWED_AMOUNT_CENTS_ENV]: '0',
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, [
    `${ALLOWED_AMOUNT_CENTS_ENV} must contain comma-separated positive integer cents.`,
  ]);
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_legacy_only',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['ATLAS_SAAS_STRIPE_RAK', PARTNER_PRICE_ID_ENV]);
  assert.deepEqual(result.invalid, []);
  assert(result.errors.includes('Missing ATLAS_SAAS_STRIPE_RAK.'));
  assert.equal(result.keyModes.ATLAS_SAAS_STRIPE_SECRET_KEY, 'test_secret');
  assert(result.warnings.includes('ATLAS_SAAS_STRIPE_SECRET_KEY is ignored by production checkout.'));
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [PARTNER_PRICE_ID_ENV]);
  assert.deepEqual(result.invalid, ['ATLAS_SAAS_STRIPE_RAK must start with rk_live_ in production.']);
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [PRICE_ID_MISSING_NAME, PARTNER_PRICE_ID_ENV]);
  assert(result.errors.includes(`Missing ${PRICE_ID_MISSING_NAME}.`));
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'lookup_key_not_price',
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, [`${STANDARD_PRICE_ID_ENV} must be a Stripe price_ id.`]);
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
    },
    'preview',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes.ATLAS_SAAS_STRIPE_RAK, 'test_restricted');
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
    },
    'preview',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, ['Non-production checkout env must not use an rk_live_ key.']);
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
    },
    'local',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [PRICE_ID_MISSING_NAME]);
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
      ATLAS_ACCOUNT_ID: 'acct_unit',
    },
    'development',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes.ATLAS_SAAS_STRIPE_SECRET_KEY, 'test_secret');
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [ALLOWED_AMOUNT_CENTS_ENV]: String(VARIANT_ALLOWED_AMOUNT_CENTS),
    },
    'preview',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, [LEGACY_INLINE_AMOUNT_ERROR]);
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_live_unit_secret',
      ATLAS_ACCOUNT_ID: 'acct_unit',
    },
    'preview',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, [
    'ATLAS_SAAS_STRIPE_SECRET_KEY fallback must be sk_test_ outside production.',
  ]);
}

{
  const result = validate({}, 'preview');
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [
    'ATLAS_ACCOUNT_ID',
    'ATLAS_SAAS_STRIPE_RAK or ATLAS_SAAS_STRIPE_SECRET_KEY',
  ]);
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['ATLAS_ACCOUNT_ID', PARTNER_PRICE_ID_ENV]);
  assert(result.errors.includes('Missing ATLAS_ACCOUNT_ID.'));
}

{
  const result = validate(
    {
      ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
    },
    'preview',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, ['ATLAS_ACCOUNT_ID']);
  assert.deepEqual(result.invalid, []);
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_with_under_score',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
    }),
    'production',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.invalid, []);
}

{
  const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-checkout-env-'));
  const envFile = join(testDir, 'prod.env');
  const validEnvFile = join(testDir, 'prod-valid.env');
  await writeFile(
    envFile,
    [
      'ATLAS_SAAS_STRIPE_SECRET_KEY=sk_test_legacy_only',
      'ATLAS_ACCOUNT_ID=acct_unit',
      `${STANDARD_PRICE_ID_ENV}=price_standard123`,
      '',
    ].join('\n'),
    'utf8',
  );
  await writeFile(
    validEnvFile,
    [
      'ATLAS_SAAS_STRIPE_RAK=rk_live_candidate_restricted',
      'ATLAS_ACCOUNT_ID=acct_unit',
      `${STANDARD_PRICE_ID_ENV}=price_standard123`,
      `${PARTNER_PRICE_ID_ENV}=price_partner123`,
      `${PARTNER_ACCESS_TOKEN_ENV}=partner_unit_access_token`,
      `${ALLOWED_AMOUNT_CENTS_ENV}=${DEFAULT_ALLOWED_AMOUNT_CENTS},${PARTNER_ALLOWED_AMOUNT_CENTS},${VARIANT_ALLOWED_AMOUNT_CENTS}`,
      '',
    ].join('\n'),
    'utf8',
  );
  try {
    const run = spawnSync(
      process.execPath,
      [
        new URL('./check-deflection-checkout-env.mjs', import.meta.url).pathname,
        '--environment',
        'production',
        '--env-file',
        envFile,
        '--json',
      ],
      {
        cwd: new URL('..', import.meta.url).pathname,
        env: { PATH: process.env.PATH, ATLAS_SAAS_STRIPE_RAK: 'rk_live_shell_must_not_mask_file' },
        encoding: 'utf8',
      },
    );
    assert.equal(run.status, 1);
    const payload = JSON.parse(run.stdout);
    assert.equal(payload.ok, false);
    assert.deepEqual(payload.missing, [
      'ATLAS_SAAS_STRIPE_RAK',
      PARTNER_PRICE_ID_ENV,
      PARTNER_ACCESS_TOKEN_ENV,
    ]);
    assert.equal(payload.keyModes.ATLAS_SAAS_STRIPE_SECRET_KEY, 'test_secret');
    assert.equal(run.stderr, '');

    const validRun = spawnSync(
      process.execPath,
      [
        new URL('./check-deflection-checkout-env.mjs', import.meta.url).pathname,
        '--environment',
        'production',
        '--env-file',
        validEnvFile,
        '--json',
      ],
      {
        cwd: new URL('..', import.meta.url).pathname,
        env: { PATH: process.env.PATH },
        encoding: 'utf8',
      },
    );
    assert.equal(validRun.status, 0);
    const validPayload = JSON.parse(validRun.stdout);
    assert.equal(validPayload.ok, true);
    assert.equal(validPayload.keyModes.ATLAS_SAAS_STRIPE_RAK, 'live_restricted');
    assert.equal(validPayload.keyModes.ATLAS_ACCOUNT_ID, 'configured');
    assert.equal(validPayload.keyModes[STANDARD_PRICE_ID_ENV], 'configured');
    assert.equal(validPayload.keyModes[PARTNER_PRICE_ID_ENV], 'configured');
    assert.equal(validPayload.keyModes[PARTNER_ACCESS_TOKEN_ENV], 'configured');
    assert.equal(validPayload.keyModes[ALLOWED_AMOUNT_CENTS_ENV], 'configured');
    assert.deepEqual(validPayload.allowedAmountsCents, [
      DEFAULT_ALLOWED_AMOUNT_CENTS,
      PARTNER_ALLOWED_AMOUNT_CENTS,
      VARIANT_ALLOWED_AMOUNT_CENTS,
    ]);
    assert.equal(validRun.stderr, '');
  } finally {
    await rm(testDir, { recursive: true, force: true });
  }
}

console.log('Deflection checkout env tests passed.');
