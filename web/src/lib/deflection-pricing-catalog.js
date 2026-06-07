const DEFLECTION_DEFAULT_PRICE_VARIANT_ID = 'standard';
const DEFLECTION_PARTNER_PRICE_VARIANT_ID = 'partner';
const DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_DEFAULT = 1500 * 100;
const DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_DEFAULT = 1000 * 100;
const DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_ENV =
  'NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_STANDARD_AMOUNT_CENTS';
const DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_ENV =
  'NEXT_PUBLIC_DEFLECTION_REPORT_PRICE_PARTNER_AMOUNT_CENTS';

const priceLabelFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

function clean(value) {
  return String(value || '').trim();
}

function parseConfiguredAmountCents(env, envKey, fallbackAmountCents) {
  const raw = clean(env[envKey]);
  if (!raw) {
    return {
      ok: true,
      amountCents: fallbackAmountCents,
      source: 'default',
      error: '',
    };
  }
  if (!/^\d+$/.test(raw)) {
    return {
      ok: false,
      amountCents: fallbackAmountCents,
      source: 'invalid',
      error: `${envKey} must contain a positive integer cents value.`,
    };
  }

  const amountCents = Number(raw);
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
    return {
      ok: false,
      amountCents: fallbackAmountCents,
      source: 'invalid',
      error: `${envKey} must contain a positive integer cents value.`,
    };
  }
  return {
    ok: true,
    amountCents,
    source: 'env',
    error: '',
  };
}

function configuredDeflectionPriceAmounts(env = process.env) {
  const standard = parseConfiguredAmountCents(
    env,
    DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_ENV,
    DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_DEFAULT,
  );
  const partner = parseConfiguredAmountCents(
    env,
    DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_ENV,
    DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_DEFAULT,
  );
  const errors = [standard.error, partner.error].filter(Boolean);
  return {
    ok: errors.length === 0,
    errors,
    amounts: {
      [DEFLECTION_DEFAULT_PRICE_VARIANT_ID]: standard.amountCents,
      [DEFLECTION_PARTNER_PRICE_VARIANT_ID]: partner.amountCents,
    },
    sources: {
      [DEFLECTION_DEFAULT_PRICE_VARIANT_ID]: standard.source,
      [DEFLECTION_PARTNER_PRICE_VARIANT_ID]: partner.source,
    },
  };
}

function formatPriceLabel(amountCents) {
  return priceLabelFormatter.format(amountCents / 100);
}

function buildDeflectionPriceVariants(env = process.env) {
  const configured = configuredDeflectionPriceAmounts(env);
  if (!configured.ok) {
    throw new Error(configured.errors.join(' '));
  }
  const standardAmountCents = configured.amounts[DEFLECTION_DEFAULT_PRICE_VARIANT_ID];
  const partnerAmountCents = configured.amounts[DEFLECTION_PARTNER_PRICE_VARIANT_ID];
  return [
    {
      id: DEFLECTION_DEFAULT_PRICE_VARIANT_ID,
      metadataValue: DEFLECTION_DEFAULT_PRICE_VARIANT_ID,
      title: 'Full Deflection Report',
      stripeProductName: 'Support Ticket Deflection: Backlog Report',
      stripePriceIdEnvKey: 'STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD',
      legacyStripePriceIdEnvKey: 'STRIPE_DEFLECTION_REPORT_PRICE_ID',
      amountUsd: standardAmountCents / 100,
      amountCents: standardAmountCents,
      priceLabel: formatPriceLabel(standardAmountCents),
    },
    {
      id: DEFLECTION_PARTNER_PRICE_VARIANT_ID,
      metadataValue: DEFLECTION_PARTNER_PRICE_VARIANT_ID,
      title: 'Full Deflection Report',
      stripeProductName: 'Support Ticket Deflection: Partner Backlog Report',
      stripePriceIdEnvKey: 'STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER',
      amountUsd: partnerAmountCents / 100,
      amountCents: partnerAmountCents,
      priceLabel: formatPriceLabel(partnerAmountCents),
    },
  ];
}

function resolveDeflectionPriceVariant(value, env = process.env) {
  if (value === undefined || value === null) {
    return buildDeflectionPriceVariants(env)[0];
  }
  if (typeof value !== 'string') return null;
  const id = value.trim();
  if (!id) return null;
  return buildDeflectionPriceVariants(env).find((variant) => variant.id === id) || null;
}

module.exports = {
  DEFLECTION_DEFAULT_PRICE_VARIANT_ID,
  DEFLECTION_PARTNER_PRICE_VARIANT_ID,
  DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_DEFAULT,
  DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_DEFAULT,
  DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_ENV,
  DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_ENV,
  buildDeflectionPriceVariants,
  configuredDeflectionPriceAmounts,
  resolveDeflectionPriceVariant,
};
