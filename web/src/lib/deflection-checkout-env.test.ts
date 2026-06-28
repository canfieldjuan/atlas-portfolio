import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { validateDeflectionCheckoutEnv } from '../../scripts/check-deflection-checkout-env.mjs';
import * as checkoutRequirements from './deflection-checkout-requirements';
import * as pricingCatalog from './deflection-pricing-catalog';

type CheckoutEnv = Record<string, string | undefined>;

const DEFAULT_ALLOWED_AMOUNT_CENTS = 1500 * 100;
const PARTNER_ALLOWED_AMOUNT_CENTS = 1000 * 100;
const VARIANT_ALLOWED_AMOUNT_CENTS = DEFAULT_ALLOWED_AMOUNT_CENTS + 30_000;
const STANDARD_PRICE_ID_ENV =
  checkoutRequirements.DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV;
const PARTNER_PRICE_ID_ENV =
  checkoutRequirements.DEFLECTION_CHECKOUT_PARTNER_PRICE_ID_ENV;
const PARTNER_ACCESS_TOKEN_ENV =
  checkoutRequirements.DEFLECTION_CHECKOUT_PARTNER_ACCESS_TOKEN_ENV;
const PARTNER_SIGNING_SECRETS_ENV =
  checkoutRequirements.DEFLECTION_CHECKOUT_PARTNER_SIGNING_SECRETS_ENV;
const LEGACY_PRICE_ID_ENV =
  checkoutRequirements.DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV;
const PARTNER_CREDENTIAL_ENV =
  `${PARTNER_ACCESS_TOKEN_ENV} or ${PARTNER_SIGNING_SECRETS_ENV}`;
const ALLOWED_AMOUNT_CENTS_ENV =
  checkoutRequirements.DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV;
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

function validate(env: CheckoutEnv, environment: string) {
  return validateDeflectionCheckoutEnv(env, { environment });
}

function withProductionPartnerAccessToken(env: CheckoutEnv): CheckoutEnv {
  return {
    ...ATLAS_AUTH_ENV,
    ...env,
    [PARTNER_ACCESS_TOKEN_ENV]: PRODUCTION_PARTNER_ACCESS_TOKEN,
  };
}

function withProductionPartnerSigningSecret(env: CheckoutEnv): CheckoutEnv {
  return {
    ...ATLAS_AUTH_ENV,
    ...env,
    [PARTNER_SIGNING_SECRETS_ENV]: 'partner_unit_signing_secret',
  };
}

describe('deflection checkout env preflight', () => {
  it('builds price variants from public amount env values', () => {
    const variants = pricingCatalog.buildDeflectionPriceVariants({
      [STANDARD_AMOUNT_CENTS_ENV]: String(CUSTOM_STANDARD_AMOUNT_CENTS),
      [PARTNER_AMOUNT_CENTS_ENV]: String(CUSTOM_PARTNER_AMOUNT_CENTS),
    });

    expect(variants[0].amountCents).toBe(CUSTOM_STANDARD_AMOUNT_CENTS);
    expect(variants[0].priceLabel).toBe('$1,800');
    expect(variants[1].amountCents).toBe(CUSTOM_PARTNER_AMOUNT_CENTS);
    expect(variants[1].priceLabel).toBe('$1,200');
    expect(() =>
      pricingCatalog.buildDeflectionPriceVariants({
        [STANDARD_AMOUNT_CENTS_ENV]: '1800.00',
      }),
    ).toThrow(
      new RegExp(`${STANDARD_AMOUNT_CENTS_ENV} must contain a positive integer cents value\\.`),
    );
  });

  it('keeps browser-facing pricing reads literal and static', async () => {
    const pricingSource = await readFile(
      new URL('./deflection-pricing.ts', import.meta.url),
      'utf8',
    );

    expect(pricingSource).toContain(
      'process.env.NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS',
    );
    expect(pricingSource).toContain(
      'process.env.NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_PARTNER_AMOUNT_CENTS',
    );
    expect(pricingSource).not.toContain('buildDeflectionPriceVariants()');
  });

  it('accepts complete production config with partner access token', () => {
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

    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
    expect(result.keyModes.ATLAS_SAAS_STRIPE_RAK).toBe('live_restricted');
    expect(result.keyModes[STANDARD_PRICE_ID_ENV]).toBe('configured');
    expect(result.keyModes[PARTNER_PRICE_ID_ENV]).toBe('configured');
    expect(result.keyModes[PARTNER_ACCESS_TOKEN_ENV]).toBe('configured');
    expect(result.keyModes[PARTNER_SIGNING_SECRETS_ENV]).toBe('missing');
    expect(result.keyModes[LEGACY_PRICE_ID_ENV]).toBe('configured');
    expect(result.keyModes[ALLOWED_AMOUNT_CENTS_ENV]).toBe('configured');
    expect(result.allowedAmountsCents).toEqual([
      DEFAULT_ALLOWED_AMOUNT_CENTS,
      PARTNER_ALLOWED_AMOUNT_CENTS,
    ]);
    expect(result.configuredPriceAmountsCents).toEqual({
      standard: DEFAULT_ALLOWED_AMOUNT_CENTS,
      partner: PARTNER_ALLOWED_AMOUNT_CENTS,
    });
    expect(result.warnings.some((warning: string) => warning.includes('ignored'))).toBe(true);
    expect(result.warnings.some((warning: string) => warning.includes(LEGACY_PRICE_ID_ENV))).toBe(true);
  });

  it('accepts production partner signing secret without a direct access token', () => {
    const result = validate(
      withProductionPartnerSigningSecret({
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [PARTNER_PRICE_ID_ENV]: 'price_partner123',
        [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
      }),
      'production',
    );

    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
    expect(result.keyModes[PARTNER_ACCESS_TOKEN_ENV]).toBe('missing');
    expect(result.keyModes[PARTNER_SIGNING_SECRETS_ENV]).toBe('configured');
    expect(result.keyModes[STANDARD_PRICE_ID_ENV]).toBe('missing');
    expect(result.present).toContain(PARTNER_SIGNING_SECRETS_ENV);
  });

  it.each([
    [
      'missing partner credential',
      {
        ...ATLAS_AUTH_ENV,
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
        [PARTNER_PRICE_ID_ENV]: 'price_partner123',
        [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
      },
    ],
    [
      'blank partner access token',
      {
        ...ATLAS_AUTH_ENV,
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
        [PARTNER_PRICE_ID_ENV]: 'price_partner123',
        [PARTNER_ACCESS_TOKEN_ENV]: ' , ,, ',
        [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
      },
    ],
  ])('rejects production config with %s', (_label, env) => {
    const result = validate(env, 'production');

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([PARTNER_CREDENTIAL_ENV]);
    expect(result.invalid).toEqual([]);
    expect(result.keyModes[PARTNER_ACCESS_TOKEN_ENV]).toBe('missing');
    expect(result.keyModes[PARTNER_SIGNING_SECRETS_ENV]).toBe('missing');
    expect(result.present).not.toContain(PARTNER_ACCESS_TOKEN_ENV);
    expect(result.present).not.toContain(PARTNER_SIGNING_SECRETS_ENV);
    expect(result.errors).toContain(`Missing ${PARTNER_CREDENTIAL_ENV}.`);
  });

  it('warns about legacy standard price ids when a standard id is configured', () => {
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

    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
    expect(result.warnings.some((warning: string) => warning.includes(LEGACY_PRICE_ID_ENV))).toBe(true);
  });

  it('allows the legacy standard price id to provide the standard price', () => {
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

    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
    expect(result.keyModes[STANDARD_PRICE_ID_ENV]).toBe('missing');
    expect(result.keyModes[LEGACY_PRICE_ID_ENV]).toBe('configured');
  });

  it.each([
    [
      'standard price id',
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'not_a_price',
        [PARTNER_PRICE_ID_ENV]: 'price_partner123',
        [LEGACY_PRICE_ID_ENV]: 'price_legacy123',
        [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
      }),
      [`${STANDARD_PRICE_ID_ENV} must be a Stripe price_ id.`],
    ],
    [
      'partner price id',
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
        [PARTNER_PRICE_ID_ENV]: 'not_a_price',
        [ALLOWED_AMOUNT_CENTS_ENV]:
          `${DEFAULT_ALLOWED_AMOUNT_CENTS}, ${PARTNER_ALLOWED_AMOUNT_CENTS}`,
      }),
      [`${PARTNER_PRICE_ID_ENV} must be a Stripe price_ id.`],
    ],
    [
      'lookup-key standard id',
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'lookup_key_not_price',
        [PARTNER_PRICE_ID_ENV]: 'price_partner123',
        [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
      }),
      [`${STANDARD_PRICE_ID_ENV} must be a Stripe price_ id.`],
    ],
  ])('rejects invalid production %s', (_label, env, invalid) => {
    const result = validate(env, 'production');

    expect(result.ok).toBe(false);
    expect(result.invalid).toEqual(invalid);
  });

  it('accepts explicit extra allowed checkout amounts', () => {
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

    expect(result.ok).toBe(true);
    expect(result.present).toContain(ALLOWED_AMOUNT_CENTS_ENV);
    expect(result.keyModes[ALLOWED_AMOUNT_CENTS_ENV]).toBe('configured');
    expect(result.allowedAmountsCents).toEqual([
      DEFAULT_ALLOWED_AMOUNT_CENTS,
      PARTNER_ALLOWED_AMOUNT_CENTS,
      VARIANT_ALLOWED_AMOUNT_CENTS,
    ]);
  });

  it('requires the live partner amount when the partner price is configured', () => {
    const result = validate(
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
        [PARTNER_PRICE_ID_ENV]: 'price_partner123',
      }),
      'production',
    );

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([PARTNER_ALLOWED_AMOUNT_ERROR]);
    expect(result.keyModes[PARTNER_PRICE_ID_ENV]).toBe('configured');
    expect(result.allowedAmountsCents).toEqual([DEFAULT_ALLOWED_AMOUNT_CENTS]);
  });

  it('accepts configured standard and partner price amounts', () => {
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

    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
    expect(result.present).toEqual(expect.arrayContaining([
      STANDARD_AMOUNT_CENTS_ENV,
      PARTNER_AMOUNT_CENTS_ENV,
    ]));
    expect(result.keyModes[STANDARD_AMOUNT_CENTS_ENV]).toBe('env');
    expect(result.keyModes[PARTNER_AMOUNT_CENTS_ENV]).toBe('env');
    expect(result.configuredPriceAmountsCents).toEqual({
      standard: CUSTOM_STANDARD_AMOUNT_CENTS,
      partner: CUSTOM_PARTNER_AMOUNT_CENTS,
    });
    expect(result.allowedAmountsCents).toEqual([
      CUSTOM_STANDARD_AMOUNT_CENTS,
      CUSTOM_PARTNER_AMOUNT_CENTS,
    ]);
  });

  it.each([
    [
      'custom standard amount with default partner amount',
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [PARTNER_PRICE_ID_ENV]: 'price_partner123',
        [STANDARD_AMOUNT_CENTS_ENV]: String(CUSTOM_STANDARD_AMOUNT_CENTS),
        [ALLOWED_AMOUNT_CENTS_ENV]:
          `${CUSTOM_STANDARD_AMOUNT_CENTS}, ${PARTNER_ALLOWED_AMOUNT_CENTS}`,
      }),
      [CUSTOM_STANDARD_AMOUNT_CENTS, PARTNER_ALLOWED_AMOUNT_CENTS],
      {
        standard: CUSTOM_STANDARD_AMOUNT_CENTS,
        partner: PARTNER_ALLOWED_AMOUNT_CENTS,
      },
    ],
    [
      'standard custom amount with production allowed defaults',
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
        [PARTNER_PRICE_ID_ENV]: 'price_partner123',
        [STANDARD_AMOUNT_CENTS_ENV]: String(CUSTOM_STANDARD_AMOUNT_CENTS),
        [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
      }),
      [DEFAULT_ALLOWED_AMOUNT_CENTS, PARTNER_ALLOWED_AMOUNT_CENTS],
      {
        standard: CUSTOM_STANDARD_AMOUNT_CENTS,
        partner: PARTNER_ALLOWED_AMOUNT_CENTS,
      },
    ],
  ])('accepts %s', (_label, env, allowedAmounts, configuredPriceAmounts) => {
    const result = validate(env, 'production');

    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
    expect(result.allowedAmountsCents).toEqual(allowedAmounts);
    expect(result.configuredPriceAmountsCents).toEqual(configuredPriceAmounts);
  });

  it.each([
    [
      'standard amount',
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
        [PARTNER_PRICE_ID_ENV]: 'price_partner123',
        [STANDARD_AMOUNT_CENTS_ENV]: '1800.00',
        [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
      }),
      STANDARD_AMOUNT_CENTS_ENV,
    ],
    [
      'partner amount',
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
        [PARTNER_PRICE_ID_ENV]: 'price_partner123',
        [PARTNER_AMOUNT_CENTS_ENV]: '0',
        [ALLOWED_AMOUNT_CENTS_ENV]: PRODUCTION_ALLOWED_AMOUNTS,
      }),
      PARTNER_AMOUNT_CENTS_ENV,
    ],
  ])('rejects invalid %s cents env', (_label, env, envKey) => {
    const result = validate(env, 'production');

    expect(result.ok).toBe(false);
    expect(result.invalid).toEqual([
      `${envKey} must contain a positive integer cents value.`,
    ]);
    expect(result.keyModes[envKey]).toBe('invalid');
  });

  it('accepts partner-only allowed amounts for production partner checkout', () => {
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

    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
  });

  it.each([
    [
      'empty allowed amount token',
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
        [ALLOWED_AMOUNT_CENTS_ENV]: `${DEFAULT_ALLOWED_AMOUNT_CENTS},,${VARIANT_ALLOWED_AMOUNT_CENTS}`,
      }),
    ],
    [
      'zero allowed amount',
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
        [ALLOWED_AMOUNT_CENTS_ENV]: '0',
      }),
    ],
  ])('rejects %s', (_label, env) => {
    const result = validate(env, 'production');

    expect(result.ok).toBe(false);
    expect(result.invalid).toEqual([
      `${ALLOWED_AMOUNT_CENTS_ENV} must contain comma-separated positive integer cents.`,
    ]);
    expect(result.allowedAmountsCents).toEqual([]);
    expect(result.keyModes[ALLOWED_AMOUNT_CENTS_ENV]).toBe('invalid');
  });

  it('rejects production legacy secret-only config', () => {
    const result = validate(
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_legacy_only',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      }),
      'production',
    );

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(['ATLAS_SAAS_STRIPE_RAK', PARTNER_PRICE_ID_ENV]);
    expect(result.invalid).toEqual([]);
    expect(result.errors).toContain('Missing ATLAS_SAAS_STRIPE_RAK.');
    expect(result.keyModes.ATLAS_SAAS_STRIPE_SECRET_KEY).toBe('test_secret');
    expect(result.warnings).toContain('ATLAS_SAAS_STRIPE_SECRET_KEY is ignored by production checkout.');
  });

  it('rejects production test restricted keys', () => {
    const result = validate(
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      }),
      'production',
    );

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([PARTNER_PRICE_ID_ENV]);
    expect(result.invalid).toEqual(['ATLAS_SAAS_STRIPE_RAK must start with rk_live_ in production.']);
  });

  it('does not require a standard price id when the partner price is absent', () => {
    const result = validate(
      withProductionPartnerAccessToken({
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
      }),
      'production',
    );

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([PARTNER_PRICE_ID_ENV]);
    expect(result.errors.some((error: string) => error.includes(STANDARD_PRICE_ID_ENV))).toBe(false);
  });

  it.each([
    [
      'preview test restricted key',
      {
        ...ATLAS_AUTH_ENV,
        ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      },
      'preview',
      true,
      [],
      [],
      'test_restricted',
    ],
    [
      'preview live restricted key',
      {
        ...ATLAS_AUTH_ENV,
        ATLAS_SAAS_STRIPE_RAK: 'rk_live_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [STANDARD_PRICE_ID_ENV]: 'price_standard123',
      },
      'preview',
      false,
      [],
      ['Non-production checkout env must not use an rk_live_ key.'],
      'live_restricted',
    ],
    [
      'local test restricted key',
      {
        ...ATLAS_AUTH_ENV,
        ATLAS_SAAS_STRIPE_RAK: 'rk_test_unit_restricted',
        ATLAS_ACCOUNT_ID: 'acct_unit',
      },
      'local',
      true,
      [],
      [],
      'test_restricted',
    ],
    [
      'development test secret fallback',
      {
        ...ATLAS_AUTH_ENV,
        ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
        ATLAS_ACCOUNT_ID: 'acct_unit',
      },
      'development',
      true,
      [],
      [],
      'missing',
    ],
    [
      'preview live secret fallback',
      {
        ...ATLAS_AUTH_ENV,
        ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_live_unit_secret',
        ATLAS_ACCOUNT_ID: 'acct_unit',
      },
      'preview',
      false,
      [],
      ['ATLAS_SAAS_STRIPE_SECRET_KEY fallback must be sk_test_ outside production.'],
      'missing',
    ],
  ])(
    'validates non-production %s',
    (_label, env, environment, ok, missing, invalid, rakMode) => {
      const result = validate(env, environment);

      expect(result.ok).toBe(ok);
      expect(result.missing).toEqual(missing);
      expect(result.invalid).toEqual(invalid);
      expect(result.keyModes.ATLAS_SAAS_STRIPE_RAK).toBe(rakMode);
    },
  );

  it('accepts a preview test secret with extra allowed amounts', () => {
    const result = validate(
      {
        ...ATLAS_AUTH_ENV,
        ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
        ATLAS_ACCOUNT_ID: 'acct_unit',
        [ALLOWED_AMOUNT_CENTS_ENV]: String(VARIANT_ALLOWED_AMOUNT_CENTS),
      },
      'preview',
    );

    expect(result.ok).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.invalid).toEqual([]);
  });

  it('reports all missing required preview env values', () => {
    const result = validate({}, 'preview');

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual([
      'ATLAS_ACCOUNT_ID',
      'ATLAS_API_BASE_URL',
      'ATLAS_B2B_SERVICE_TOKEN',
      'ATLAS_SAAS_STRIPE_RAK or ATLAS_SAAS_STRIPE_SECRET_KEY',
    ]);
  });

  it('reports missing account id without adding invalid errors', () => {
    const result = validate(
      {
        ...ATLAS_AUTH_ENV,
        ATLAS_SAAS_STRIPE_SECRET_KEY: 'sk_test_unit_secret',
        ATLAS_ACCOUNT_ID: undefined,
      },
      'preview',
    );

    expect(result.ok).toBe(false);
    expect(result.missing).toEqual(['ATLAS_ACCOUNT_ID']);
    expect(result.invalid).toEqual([]);
  });

  it('accepts Stripe price ids with underscores', () => {
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

    expect(result.ok).toBe(true);
    expect(result.invalid).toEqual([]);
  });

  it('runs the real CLI against env files without shell env bleed-through', async () => {
    const webRoot = fileURLToPath(new URL('../..', import.meta.url));
    const cliPath = fileURLToPath(
      new URL('../../scripts/check-deflection-checkout-env.mjs', import.meta.url),
    );
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
        [cliPath, '--environment', 'production', '--env-file', envFile, '--json'],
        {
          cwd: webRoot,
          env: {
            PATH: process.env.PATH,
            ATLAS_SAAS_STRIPE_RAK: 'rk_live_shell_must_not_mask_file',
          },
          encoding: 'utf8',
        },
      );
      expect(run.status).toBe(1);
      const payload = JSON.parse(run.stdout);
      expect(payload.ok).toBe(false);
      expect(payload.missing).toEqual([
        'ATLAS_API_BASE_URL',
        'ATLAS_B2B_SERVICE_TOKEN',
        'ATLAS_SAAS_STRIPE_RAK',
        PARTNER_PRICE_ID_ENV,
        PARTNER_CREDENTIAL_ENV,
      ]);
      expect(payload.keyModes.ATLAS_SAAS_STRIPE_SECRET_KEY).toBe('test_secret');
      expect(run.stderr).toBe('');

      const validRun = spawnSync(
        process.execPath,
        [cliPath, '--environment', 'production', '--env-file', validEnvFile, '--json'],
        {
          cwd: webRoot,
          env: { PATH: process.env.PATH },
          encoding: 'utf8',
        },
      );
      expect(validRun.status).toBe(0);
      const validPayload = JSON.parse(validRun.stdout);
      expect(validPayload.ok).toBe(true);
      expect(validPayload.keyModes.ATLAS_SAAS_STRIPE_RAK).toBe('live_restricted');
      expect(validPayload.keyModes.ATLAS_ACCOUNT_ID).toBe('configured');
      expect(validPayload.keyModes[STANDARD_PRICE_ID_ENV]).toBe('configured');
      expect(validPayload.keyModes[PARTNER_PRICE_ID_ENV]).toBe('configured');
      expect(validPayload.keyModes[PARTNER_ACCESS_TOKEN_ENV]).toBe('missing');
      expect(validPayload.keyModes[PARTNER_SIGNING_SECRETS_ENV]).toBe('configured');
      expect(validPayload.keyModes[ALLOWED_AMOUNT_CENTS_ENV]).toBe('configured');
      expect(validPayload.allowedAmountsCents).toEqual([
        DEFAULT_ALLOWED_AMOUNT_CENTS,
        PARTNER_ALLOWED_AMOUNT_CENTS,
        VARIANT_ALLOWED_AMOUNT_CENTS,
      ]);
      expect(validRun.stderr).toBe('');
    } finally {
      await rm(testDir, { recursive: true, force: true });
    }
  });
});
