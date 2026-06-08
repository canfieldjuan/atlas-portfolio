/* eslint-disable @typescript-eslint/no-require-imports */

const DEFLECTION_CHECKOUT_DEFAULT_ENVIRONMENT = 'local';
const DEFLECTION_CHECKOUT_PRICE_ID_RE = /^price_[A-Za-z0-9_]{8,}$/;
const DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV =
  'STRIPE_DEFLECTION_REPORT_PRICE_ID_STANDARD';
const DEFLECTION_CHECKOUT_PARTNER_PRICE_ID_ENV =
  'STRIPE_DEFLECTION_REPORT_PRICE_ID_PARTNER';
const DEFLECTION_CHECKOUT_PARTNER_ACCESS_TOKEN_ENV =
  'DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN';
const DEFLECTION_CHECKOUT_PARTNER_SIGNING_SECRETS_ENV =
  'DEFLECTION_PARTNER_PRICE_SIGNING_SECRETS';
const DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV =
  'STRIPE_DEFLECTION_REPORT_PRICE_ID';
const DEFLECTION_CHECKOUT_ATLAS_API_BASE_URL_ENV = 'ATLAS_API_BASE_URL';
const DEFLECTION_CHECKOUT_ATLAS_SERVICE_TOKEN_ENV = 'ATLAS_B2B_SERVICE_TOKEN';
const DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV =
  'ATLAS_SAAS_STRIPE_CONTENT_OPS_DEFLECTION_REPORT_ALLOWED_AMOUNT_CENTS';
const DEFLECTION_CHECKOUT_PRICE_ID_MISSING_NAME =
  `${DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV} or ${DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV}`;
// This file is a CommonJS module because Node preflight scripts import it
// directly; keep the shared token parser in that same module boundary.
const {
  configuredDeflectionPartnerAccessTokens,
  configuredDeflectionPartnerSigningSecrets,
} = require('./deflection-partner-token');
const pricingCatalog = require('./deflection-pricing-catalog');

const DEFLECTION_CHECKOUT_DEFAULT_AMOUNT_CENTS =
  pricingCatalog.DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_DEFAULT;
const DEFLECTION_CHECKOUT_PARTNER_AMOUNT_CENTS =
  pricingCatalog.DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_DEFAULT;

const DEFLECTION_CHECKOUT_ENV_KEYS = [
  'ATLAS_SAAS_STRIPE_RAK',
  'ATLAS_SAAS_STRIPE_SECRET_KEY',
  'ATLAS_ACCOUNT_ID',
  DEFLECTION_CHECKOUT_ATLAS_API_BASE_URL_ENV,
  DEFLECTION_CHECKOUT_ATLAS_SERVICE_TOKEN_ENV,
  DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV,
  DEFLECTION_CHECKOUT_PARTNER_PRICE_ID_ENV,
  DEFLECTION_CHECKOUT_PARTNER_ACCESS_TOKEN_ENV,
  DEFLECTION_CHECKOUT_PARTNER_SIGNING_SECRETS_ENV,
  DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV,
  DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV,
  pricingCatalog.DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_ENV,
  pricingCatalog.DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_ENV,
  'VERCEL_ENV',
];

function clean(value) {
  return String(value || '').trim();
}

function normalizeEnvironment(value) {
  const environment = clean(value || DEFLECTION_CHECKOUT_DEFAULT_ENVIRONMENT).toLowerCase();
  return environment || DEFLECTION_CHECKOUT_DEFAULT_ENVIRONMENT;
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

function parseAllowedAmounts(rawValue) {
  const raw = clean(rawValue);
  if (!raw) {
    return {
      ok: true,
      amounts: [DEFLECTION_CHECKOUT_DEFAULT_AMOUNT_CENTS],
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
        error:
          `${DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV} must contain ` +
          'comma-separated positive integer cents.',
      };
    }
    const amount = Number(token);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return {
        ok: false,
        amounts: [],
        mode: 'invalid',
        error:
          `${DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV} must contain ` +
          'comma-separated positive integer cents.',
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

function priceIdStatus(env, envKey) {
  const priceId = clean(env[envKey]);
  if (!priceId) return { status: 'missing', envKey, priceId: '' };
  if (!DEFLECTION_CHECKOUT_PRICE_ID_RE.test(priceId)) {
    return { status: 'invalid', envKey, priceId };
  }
  return { status: 'configured', envKey, priceId };
}

function addMissing(missing, name) {
  if (!missing.includes(name)) missing.push(name);
}

function addInvalid(invalid, message) {
  if (!invalid.includes(message)) invalid.push(message);
}

function addInvalidPriceId(invalid, key, value) {
  if (value && !DEFLECTION_CHECKOUT_PRICE_ID_RE.test(value)) {
    addInvalid(invalid, `${key} must be a Stripe price_ id.`);
  }
}

function amountRequiredError(amountCents, reason) {
  return `${DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV} must include ${amountCents} when ${reason}.`;
}

const DEFLECTION_CHECKOUT_LEGACY_INLINE_AMOUNT_ERROR = amountRequiredError(
  DEFLECTION_CHECKOUT_DEFAULT_AMOUNT_CENTS,
  'ATLAS_SAAS_STRIPE_SECRET_KEY fallback uses inline test price_data',
);
const DEFLECTION_CHECKOUT_STANDARD_ALLOWED_AMOUNT_ERROR = amountRequiredError(
  DEFLECTION_CHECKOUT_DEFAULT_AMOUNT_CENTS,
  `${DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV} or ${DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV} is configured`,
);
const DEFLECTION_CHECKOUT_PARTNER_ALLOWED_AMOUNT_ERROR = amountRequiredError(
  DEFLECTION_CHECKOUT_PARTNER_AMOUNT_CENTS,
  `${DEFLECTION_CHECKOUT_PARTNER_PRICE_ID_ENV} is configured`,
);

function classifyEnv(env) {
  const rak = clean(env.ATLAS_SAAS_STRIPE_RAK);
  const legacySecret = clean(env.ATLAS_SAAS_STRIPE_SECRET_KEY);
  const accountId = clean(env.ATLAS_ACCOUNT_ID);
  const atlasApiBaseUrl = clean(env[DEFLECTION_CHECKOUT_ATLAS_API_BASE_URL_ENV]);
  const atlasServiceToken = clean(env[DEFLECTION_CHECKOUT_ATLAS_SERVICE_TOKEN_ENV]);
  const standardPriceId = clean(env[DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV]);
  const partnerPriceId = clean(env[DEFLECTION_CHECKOUT_PARTNER_PRICE_ID_ENV]);
  const partnerAccessTokens = configuredDeflectionPartnerAccessTokens(env);
  const partnerSigningSecrets = configuredDeflectionPartnerSigningSecrets(env);
  const legacyPriceId = clean(env[DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV]);
  const priceId = standardPriceId || legacyPriceId;
  const allowedAmounts = parseAllowedAmounts(
    env[DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV],
  );
  const priceAmounts = pricingCatalog.configuredDeflectionPriceAmounts(env);

  return {
    present: [
      rak ? 'ATLAS_SAAS_STRIPE_RAK' : '',
      legacySecret ? 'ATLAS_SAAS_STRIPE_SECRET_KEY' : '',
      accountId ? 'ATLAS_ACCOUNT_ID' : '',
      atlasApiBaseUrl ? DEFLECTION_CHECKOUT_ATLAS_API_BASE_URL_ENV : '',
      atlasServiceToken ? DEFLECTION_CHECKOUT_ATLAS_SERVICE_TOKEN_ENV : '',
      standardPriceId ? DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV : '',
      partnerPriceId ? DEFLECTION_CHECKOUT_PARTNER_PRICE_ID_ENV : '',
      partnerAccessTokens.length ? DEFLECTION_CHECKOUT_PARTNER_ACCESS_TOKEN_ENV : '',
      partnerSigningSecrets.length ? DEFLECTION_CHECKOUT_PARTNER_SIGNING_SECRETS_ENV : '',
      legacyPriceId ? DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV : '',
      clean(env[DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV])
        ? DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV
        : '',
      clean(env[pricingCatalog.DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_ENV])
        ? pricingCatalog.DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_ENV
        : '',
      clean(env[pricingCatalog.DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_ENV])
        ? pricingCatalog.DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_ENV
        : '',
    ].filter(Boolean),
    keyModes: {
      ATLAS_SAAS_STRIPE_RAK: modeForKey(rak),
      ATLAS_SAAS_STRIPE_SECRET_KEY: modeForKey(legacySecret),
      ATLAS_ACCOUNT_ID: accountId ? 'configured' : 'missing',
      [DEFLECTION_CHECKOUT_ATLAS_API_BASE_URL_ENV]: atlasApiBaseUrl
        ? 'configured'
        : 'missing',
      [DEFLECTION_CHECKOUT_ATLAS_SERVICE_TOKEN_ENV]: atlasServiceToken
        ? 'configured'
        : 'missing',
      [DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV]: standardPriceId
        ? 'configured'
        : 'missing',
      [DEFLECTION_CHECKOUT_PARTNER_PRICE_ID_ENV]: partnerPriceId
        ? 'configured'
        : 'missing',
      [DEFLECTION_CHECKOUT_PARTNER_ACCESS_TOKEN_ENV]: partnerAccessTokens.length
        ? 'configured'
        : 'missing',
      [DEFLECTION_CHECKOUT_PARTNER_SIGNING_SECRETS_ENV]: partnerSigningSecrets.length
        ? 'configured'
        : 'missing',
      [DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV]: legacyPriceId
        ? 'configured'
        : 'missing',
      [DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV]: allowedAmounts.mode,
      [pricingCatalog.DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_ENV]:
        priceAmounts.sources.standard,
      [pricingCatalog.DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_ENV]:
        priceAmounts.sources.partner,
    },
    rak,
    legacySecret,
    accountId,
    atlasApiBaseUrl,
    atlasServiceToken,
    standardPriceId,
    partnerPriceId,
    partnerAccessTokens,
    partnerSigningSecrets,
    legacyPriceId,
    priceId,
    allowedAmounts,
    priceAmounts,
  };
}

function configuredPriceIdForVariant(env, priceVariant) {
  const variantPriceId = priceIdStatus(env, priceVariant.stripePriceIdEnvKey);
  if (variantPriceId.status === 'configured') {
    return { ok: true, priceId: variantPriceId.priceId, message: '' };
  }
  if (variantPriceId.status === 'invalid') {
    return {
      ok: false,
      priceId: null,
      message: `configured price id is invalid for ${variantPriceId.envKey}`,
    };
  }
  if (priceVariant.legacyStripePriceIdEnvKey) {
    const legacyPriceId = priceIdStatus(env, priceVariant.legacyStripePriceIdEnvKey);
    if (legacyPriceId.status === 'configured') {
      return { ok: true, priceId: legacyPriceId.priceId, message: '' };
    }
    if (legacyPriceId.status === 'invalid') {
      return {
        ok: false,
        priceId: null,
        message: `configured price id is invalid for ${legacyPriceId.envKey}`,
      };
    }
  }
  return { ok: true, priceId: null, message: '' };
}

function validateDeflectionCheckoutEnv(env, options = {}) {
  const deploymentEnvironment = normalizeEnvironment(
    options.environment || env.VERCEL_ENV,
  );
  const classified = classifyEnv(env);
  const missing = [];
  const invalid = [];
  const warnings = [];
  const isProduction = deploymentEnvironment === 'production';

  if (!classified.accountId) {
    addMissing(missing, 'ATLAS_ACCOUNT_ID');
  }
  if (!classified.atlasApiBaseUrl) {
    addMissing(missing, DEFLECTION_CHECKOUT_ATLAS_API_BASE_URL_ENV);
  }
  if (!classified.atlasServiceToken) {
    addMissing(missing, DEFLECTION_CHECKOUT_ATLAS_SERVICE_TOKEN_ENV);
  }
  if (!classified.allowedAmounts.ok) {
    addInvalid(invalid, classified.allowedAmounts.error);
  }
  for (const error of classified.priceAmounts.errors) {
    addInvalid(invalid, error);
  }
  const standardAmountCents = classified.priceAmounts.amounts.standard;
  const partnerAmountCents = classified.priceAmounts.amounts.partner;
  addInvalidPriceId(
    invalid,
    DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV,
    classified.standardPriceId,
  );
  addInvalidPriceId(
    invalid,
    DEFLECTION_CHECKOUT_PARTNER_PRICE_ID_ENV,
    classified.partnerPriceId,
  );
  if (!classified.standardPriceId) {
    addInvalidPriceId(
      invalid,
      DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV,
      classified.legacyPriceId,
    );
  }
  if (
    classified.priceId &&
    DEFLECTION_CHECKOUT_PRICE_ID_RE.test(classified.priceId) &&
    classified.allowedAmounts.ok &&
    classified.priceAmounts.ok &&
    !classified.allowedAmounts.amounts.includes(standardAmountCents)
  ) {
    addInvalid(
      invalid,
      amountRequiredError(
        standardAmountCents,
        `${DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV} or ${DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV} is configured`,
      ),
    );
  }
  if (
    classified.partnerPriceId &&
    DEFLECTION_CHECKOUT_PRICE_ID_RE.test(classified.partnerPriceId) &&
    classified.allowedAmounts.ok &&
    classified.priceAmounts.ok &&
    !classified.allowedAmounts.amounts.includes(partnerAmountCents)
  ) {
    addInvalid(
      invalid,
      amountRequiredError(
        partnerAmountCents,
        `${DEFLECTION_CHECKOUT_PARTNER_PRICE_ID_ENV} is configured`,
      ),
    );
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
      addMissing(missing, DEFLECTION_CHECKOUT_PRICE_ID_MISSING_NAME);
    }
    if (!classified.partnerPriceId) {
      addMissing(missing, DEFLECTION_CHECKOUT_PARTNER_PRICE_ID_ENV);
    }
    if (!classified.partnerAccessTokens.length && !classified.partnerSigningSecrets.length) {
      addMissing(
        missing,
        `${DEFLECTION_CHECKOUT_PARTNER_ACCESS_TOKEN_ENV} or ` +
          DEFLECTION_CHECKOUT_PARTNER_SIGNING_SECRETS_ENV,
      );
    }

    if (classified.legacySecret && classified.rak) {
      warnings.push(
        'ATLAS_SAAS_STRIPE_SECRET_KEY is present but ignored while ' +
          'ATLAS_SAAS_STRIPE_RAK is configured.',
      );
    }
    if (classified.standardPriceId && classified.legacyPriceId) {
      warnings.push(
        `${DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV} is present but ignored ` +
          `while ${DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV} is configured.`,
      );
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
        addMissing(missing, DEFLECTION_CHECKOUT_PRICE_ID_MISSING_NAME);
      }
    } else if (classified.legacySecret) {
      if (!classified.legacySecret.startsWith('sk_test_')) {
        addInvalid(
          invalid,
          'ATLAS_SAAS_STRIPE_SECRET_KEY fallback must be sk_test_ outside production.',
        );
      }
      if (
        !classified.priceId &&
        classified.allowedAmounts.ok &&
        classified.priceAmounts.ok &&
        !classified.allowedAmounts.amounts.includes(
          standardAmountCents,
        )
      ) {
        addInvalid(
          invalid,
          amountRequiredError(
            standardAmountCents,
            'ATLAS_SAAS_STRIPE_SECRET_KEY fallback uses inline test price_data',
          ),
        );
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
    configuredPriceAmountsCents: classified.priceAmounts.amounts,
  };
}

function resolveDeflectionCheckoutRuntimeConfig(env, priceVariant, options = {}) {
  const restrictedKey = clean(env.ATLAS_SAAS_STRIPE_RAK);
  const legacyTestSecretKey = clean(env.ATLAS_SAAS_STRIPE_SECRET_KEY);
  const accountId = clean(env.ATLAS_ACCOUNT_ID);
  const environment = normalizeEnvironment(options.environment || env.VERCEL_ENV);
  const isProduction = environment === 'production';
  if (!accountId) {
    return { ok: false, message: '' };
  }

  const allowedAmounts = parseAllowedAmounts(
    env[DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV],
  );
  if (!allowedAmounts.ok) {
    return { ok: false, message: 'configured allowed amount list is invalid' };
  }
  const priceAmounts = pricingCatalog.configuredDeflectionPriceAmounts(env);
  if (!priceAmounts.ok) {
    return { ok: false, message: 'configured price amount is invalid' };
  }
  const allowedAmountsCents = new Set(allowedAmounts.amounts);

  if (restrictedKey) {
    if (!restrictedKey.startsWith('rk_')) {
      return { ok: false, message: 'restricted key must start with rk_' };
    }
    if (isProduction && !restrictedKey.startsWith('rk_live_')) {
      return {
        ok: false,
        message: 'live restricted key is required in production',
      };
    }
    const priceId = configuredPriceIdForVariant(env, priceVariant);
    if (!priceId.ok) {
      return { ok: false, message: priceId.message };
    }
    if (!priceId.priceId) {
      return {
        ok: false,
        message: 'configured price id is required for selected variant',
      };
    }
    if (!allowedAmountsCents.has(priceVariant.amountCents)) {
      return { ok: false, message: 'selected variant amount is not allowed' };
    }
    return {
      ok: true,
      config: {
        apiKey: restrictedKey,
        accountId,
        priceId: priceId.priceId,
        allowedAmountsCents,
      },
    };
  }

  if (!legacyTestSecretKey) {
    return { ok: false, message: '' };
  }
  if (isProduction) {
    return { ok: false, message: 'restricted key is required in production' };
  }
  if (legacyTestSecretKey.startsWith('sk_live_')) {
    return { ok: false, message: 'full live secret key is not accepted' };
  }
  if (!legacyTestSecretKey.startsWith('sk_test_')) {
    return { ok: false, message: 'fallback secret key must be test-mode' };
  }

  const fallbackPriceId = configuredPriceIdForVariant(env, priceVariant);
  if (!fallbackPriceId.ok) {
    return { ok: false, message: fallbackPriceId.message };
  }
  if (!allowedAmountsCents.has(priceVariant.amountCents)) {
    return { ok: false, message: 'selected variant amount is not allowed' };
  }

  return {
    ok: true,
    config: {
      apiKey: legacyTestSecretKey,
      accountId,
      priceId: fallbackPriceId.priceId,
      allowedAmountsCents,
    },
  };
}

module.exports = {
  DEFLECTION_CHECKOUT_ALLOWED_AMOUNT_CENTS_ENV,
  DEFLECTION_CHECKOUT_ATLAS_API_BASE_URL_ENV,
  DEFLECTION_CHECKOUT_ATLAS_SERVICE_TOKEN_ENV,
  DEFLECTION_CHECKOUT_DEFAULT_AMOUNT_CENTS,
  DEFLECTION_CHECKOUT_DEFAULT_ENVIRONMENT,
  DEFLECTION_CHECKOUT_ENV_KEYS,
  DEFLECTION_CHECKOUT_LEGACY_INLINE_AMOUNT_ERROR,
  DEFLECTION_CHECKOUT_LEGACY_PRICE_ID_ENV,
  DEFLECTION_CHECKOUT_PARTNER_ACCESS_TOKEN_ENV,
  DEFLECTION_CHECKOUT_PARTNER_SIGNING_SECRETS_ENV,
  DEFLECTION_CHECKOUT_PARTNER_ALLOWED_AMOUNT_ERROR,
  DEFLECTION_CHECKOUT_PARTNER_AMOUNT_CENTS,
  DEFLECTION_CHECKOUT_PARTNER_PRICE_ID_ENV,
  DEFLECTION_CHECKOUT_PRICE_ID_MISSING_NAME,
  DEFLECTION_CHECKOUT_PRICE_ID_RE,
  DEFLECTION_CHECKOUT_STANDARD_ALLOWED_AMOUNT_ERROR,
  DEFLECTION_CHECKOUT_STANDARD_PRICE_ID_ENV,
  DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_ENV:
    pricingCatalog.DEFLECTION_PARTNER_PRICE_AMOUNT_CENTS_ENV,
  DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_ENV:
    pricingCatalog.DEFLECTION_STANDARD_PRICE_AMOUNT_CENTS_ENV,
  configuredDeflectionPartnerAccessTokens,
  configuredDeflectionPartnerSigningSecrets,
  resolveDeflectionCheckoutRuntimeConfig,
  validateDeflectionCheckoutEnv,
};
