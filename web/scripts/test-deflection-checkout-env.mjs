import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateDeflectionCheckoutEnv } from './check-deflection-checkout-env.mjs';
import checkoutRequirements from '../src/lib/deflection-checkout-requirements.js';
import pricingCatalog from '../src/lib/deflection-pricing-catalog.js';

function validate(env, environment) {
  return validateDeflectionCheckoutEnv(env, { environment });
}

const DEFAULT_ALLOWED_AMOUNT_CENTS = 1500 * 100;
const PARTNER_ALLOWED_AMOUNT_CENTS = 1000 * 100;
const VARIANT_ALLOWED_AMOUNT_CENTS = DEFAULT_ALLOWED_AMOUNT_CENTS + 30_000;
const STANDARD_PRICE_ID_ENV = 'STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD';
const PARTNER_PRICE_ID_ENV = 'STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER';
const PARTNER_ACCESS_TOKEN_ENV = 'DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN';
const PARTNER_SIGNING_SECRETS_ENV = 'DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS';
const LEGACY_PRICE_ID_ENV = 'STRIPE_DEFLECTION_REPORT_PRICE_ID';
const PARTNER_CREDENTIAL_ENV =
  `${PARTNER_ACCESS_TOKEN_ENV} or ${PARTNER_SIGNING_SECRETS_ENV}`;
const ALLOWED_AMOUNT_CENTS_ENV =
  'ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS';
const STANDARD_AMOUNT_CENTS_ENV =
  checkoutRequirements.DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_ENV;
const PARTNER_AMOUNT_CENTS_ENV =
  checkoutRequirements.DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_ENV;
const PARTNER_ALLOWED_AMOUNT_ERROR =
  `${ALLOWED_AMOUNT_CENTS_ENV} must include ${PARTNER_ALLOWED_AMOUNT_CENTS} when ` +
  `${PARTNER_PRICE_ID_ENV} is configured.`;
const ATLAS_AUTH_ENV = {
  ATLAS_API_BASE_URL: 'https://atlas.example.test',
  ATLAS_B2B_SERVICE_TOKEN: 'atlas_unit_token',
};
const CUSTOM_STANDARD_AMOUNT_CENTS = 1800 * 100;
const CUSTOM_PARTNER_AMOUNT_CENTS = 1200 * 100;
const PRODUCTION_ALLOWED_AMOUNTS = `${DEFAULT_ALLOWED_AMOUNT_CENTS}, ${PARTNER_ALLOWED_AMOUNT_CENTS}`;
const PRODUCTION_PARTNER_ACCESS_TOKEN = 'partner_unit_access_token';
const pricingSource = await readFile(
  new URL('../src/lib/deflection-pricing.ts', import.meta.url),
  'utf8',
);

function withProductionPartnerAccessToken(env) {
  return {
    ...ATLAS_AUTH_ENV,
    ...env,
    [PARTNER_ACCESS_TOKEN_ENV]: PRODUCTION_PARTNER_ACCESS_TOKEN,
  };
}

function withProductionPartnerSigningSecret(env) {
  return {
    ...ATLAS_AUTH_ENV,
    ...env,
    [PARTNER_SIGNING_SECRETS_ENV]: 'partner_unit_signing_secret',
  };
}

{
  const variants = pricingCatalog.buildDeflectionPriceVariants({
    [STANDARD_AMOUNT_CENTS_ENV]: String(CUSTOM_STANDARD_AMOUNT_CENTS),
    [PARTNER_AMOUNT_CENTS_ENV]: String(CUSTOM_PARTNER_AMOUNT_CENTS),
  });
  assert.equal(variants[0].amountCents, CUSTOM_STANDARD_AMOUNT_CENTS);
  assert.equal(variants[0].priceLabel, '$1,800');
  assert.equal(variants[1].amountCents, CUSTOM_PARTNER_AMOUNT_CENTS);
  assert.equal(variants[1].priceLabel, '$1,200');
}

assert.throws(
  () =>
    pricingCatalog.buildDeflectionPriceVariants({
      [STANDARD_AMOUNT_CENTS_ENV]: '1800.00',
    }),
  new RegExp(`${STANDARD_AMOUNT_CENTS_ENV} must contain a positive integer cents value\\.`),
);

assert(
  pricingSource.includes(
    'process.env.NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS',
  ),
  'browser-facing pricing must use a literal standard NEXT_PUBLIC env read',
);
assert(
  pricingSource.includes(
    'process.env.NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_PARTNER_AMOUNT_CENTS',
  ),
  'browser-facing pricing must use a literal partner NEXT_PUBLIC env read',
);
assert(
  !pricingSource.includes('buildDeflectionPriceVariants()'),
  'browser-facing pricing must pass the static public env object into the catalog',
);

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
  assert.equal(result.keyModes[PARTNER_SIGNING_SECRETS_ENV], 'missing');
  assert.equal(result.keyModes[LEGACY_PRICE_ID_ENV], 'configured');
  assert.equal(result.keyModes[ALLOWED_AMOUNT_CENTS_ENV], 'configured');
  assert.deepEqual(result.allowedAmountsCents, [
    DEFAULT_ALLOWED_AMOUNT_CENTS,
    PARTNER_ALLOWED_AMOUNT_CENTS,
  ]);
  assert.deepEqual(result.configuredPriceAmountsCents, {
    standard: DEFAULT_ALLOWED_AMOUNT_CENTS,
    partner: PARTNER_ALLOWED_AMOUNT_CENTS,
  });
  assert(result.warnings.some((warning) => warning.includes('ignored')));
  assert(result.warnings.some((warning) => warning.includes(LEGACY_PRICE_ID_ENV)));
}

{
  const result = validate(
    withProductionPartnerSigningSecret({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
    }),
    'production',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes[PARTNER_ACCESS_TOKEN_ENV], 'missing');
  assert.equal(result.keyModes[PARTNER_SIGNING_SECRETS_ENV], 'configured');
  assert.equal(result.keyModes[STANDARD_PRICE_ID_ENV], 'missing');
  assert(result.present.includes(PARTNER_SIGNING_SECRETS_ENV));
}

{
  const result = validate(
    {
      ...ATLAS_AUTH_ENV,
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
    },
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.missing, [PARTNER_CREDENTIAL_ENV]);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes[PARTNER_ACCESS_TOKEN_ENV], 'missing');
  assert.equal(result.keyModes[PARTNER_SIGNING_SECRETS_ENV], 'missing');
  assert(result.errors.includes(`Missing ${PARTNER_CREDENTIAL_ENV}.`));
}

{
  const result = validate(
    {
      ...ATLAS_AUTH_ENV,
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
  assert.deepEqual(result.missing, [PARTNER_CREDENTIAL_ENV]);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes[PARTNER_ACCESS_TOKEN_ENV], 'missing');
  assert.equal(result.keyModes[PARTNER_SIGNING_SECRETS_ENV], 'missing');
  assert(!result.present.includes(PARTNER_ACCESS_TOKEN_ENV));
  assert(!result.present.includes(PARTNER_SIGNING_SECRETS_ENV));
  assert(result.errors.includes(`Missing ${PARTNER_CREDENTIAL_ENV}.`));
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
      [STANDARD_AMOUNT_CENTS_ENV]: String(CUSTOM_STANDARD_AMOUNT_CENTS),
      [PARTNER_AMOUNT_CENTS_ENV]: String(CUSTOM_PARTNER_AMOUNT_CENTS),
      [ALLOWED_AMOUNT_CENTS_ENV]:
        `${CUSTOM_STANDARD_AMOUNT_CENTS}, ${CUSTOM_PARTNER_AMOUNT_CENTS}`,
    }),
    'production',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
  assert(result.present.includes(STANDARD_AMOUNT_CENTS_ENV));
  assert(result.present.includes(PARTNER_AMOUNT_CENTS_ENV));
  assert.equal(result.keyModes[STANDARD_AMOUNT_CENTS_ENV], 'env');
  assert.equal(result.keyModes[PARTNER_AMOUNT_CENTS_ENV], 'env');
  assert.deepEqual(result.configuredPriceAmountsCents, {
    standard: CUSTOM_STANDARD_AMOUNT_CENTS,
    partner: CUSTOM_PARTNER_AMOUNT_CENTS,
  });
  assert.deepEqual(result.allowedAmountsCents, [
    CUSTOM_STANDARD_AMOUNT_CENTS,
    CUSTOM_PARTNER_AMOUNT_CENTS,
  ]);
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [STANDARD_AMOUNT_CENTS_ENV]: String(CUSTOM_STANDARD_AMOUNT_CENTS),
      [ALLOWED_AMOUNT_CENTS_ENV]:
        `${CUSTOM_STANDARD_AMOUNT_CENTS}, ${PARTNER_ALLOWED_AMOUNT_CENTS}`,
    }),
    'production',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
  assert.equal(result.keyModes[STANDARD_PRICE_ID_ENV], 'missing');
  assert.deepEqual(result.allowedAmountsCents, [
    CUSTOM_STANDARD_AMOUNT_CENTS,
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
      [STANDARD_AMOUNT_CENTS_ENV]: String(CUSTOM_STANDARD_AMOUNT_CENTS),
      [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
    }),
    'production',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
  assert.deepEqual(result.configuredPriceAmountsCents, {
    standard: CUSTOM_STANDARD_AMOUNT_CENTS,
    partner: PARTNER_ALLOWED_AMOUNT_CENTS,
  });
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [STANDARD_AMOUNT_CENTS_ENV]: '1800.00',
      [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, [
    `${STANDARD_AMOUNT_CENTS_ENV} must contain a positive integer cents value.`,
  ]);
  assert.equal(result.keyModes[STANDARD_AMOUNT_CENTS_ENV], 'invalid');
}

{
  const result = validate(
    withProductionPartnerAccessToken({
      ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      [PARTNER_AMOUNT_CENTS_ENV]: '0',
      [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
    }),
    'production',
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.invalid, [
    `${PARTNER_AMOUNT_CENTS_ENV} must contain a positive integer cents value.`,
  ]);
  assert.equal(result.keyModes[PARTNER_AMOUNT_CENTS_ENV], 'invalid');
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
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
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
  assert.deepEqual(result.missing, [PARTNER_PRICE_ID_ENV]);
  assert(!result.errors.some((error) => error.includes(STANDARD_PRICE_ID_ENV)));
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
      ...ATLAS_AUTH_ENV,
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
      ...ATLAS_AUTH_ENV,
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
      ...ATLAS_AUTH_ENV,
      ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
      ATLAS_ACCOUNT_ID: 'acct_unit',
    },
    'local',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
}

{
  const result = validate(
    {
      ...ATLAS_AUTH_ENV,
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
      ...ATLAS_AUTH_ENV,
      ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
      ATLAS_ACCOUNT_ID: 'acct_unit',
      [ALLOWED_AMOUNT_CENTS_ENV]: String(VARIANT_ALLOWED_AMOUNT_CENTS),
    },
    'preview',
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.missing, []);
  assert.deepEqual(result.invalid, []);
}

{
  const result = validate(
    {
      ...ATLAS_AUTH_ENV,
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
    'ATLAS_API_BASE_URL',
    'ATLAS_B2B_SERVICE_TOKEN',
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
      ...ATLAS_AUTH_ENV,
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
	      'ATLAS_API_BASE_URL=https://atlas.example.test',
	      'ATLAS_B2B_SERVICE_TOKEN=atlas_unit_token',
	      `${STANDARD_PRICE_ID_ENV}=price_standard123`,
      `${PARTNER_PRICE_ID_ENV}=price_partner123`,
      `${PARTNER_SIGNING_SECRETS_ENV}=old_partner_signing_secret,current_partner_signing_secret`,
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
	      'ATLAS_API_BASE_URL',
	      'ATLAS_B2B_SERVICE_TOKEN',
	      'ATLAS_SAAS_STRIPE_RAK',
      PARTNER_PRICE_ID_ENV,
      PARTNER_CREDENTIAL_ENV,
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
    assert.equal(validPayload.keyModes[PARTNER_ACCESS_TOKEN_ENV], 'missing');
    assert.equal(validPayload.keyModes[PARTNER_SIGNING_SECRETS_ENV], 'configured');
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
