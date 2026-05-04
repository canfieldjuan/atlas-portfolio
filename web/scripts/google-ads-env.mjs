import { createHmac } from 'node:crypto';

export const DEFAULT_GOOGLE_ADS_API_VERSION = 'v22';

export const REQUIRED_GOOGLE_ADS_ENV = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
];

export const OPTIONAL_GOOGLE_ADS_ENV = [
  'GOOGLE_ADS_LOGIN_CUSTOMER_ID',
  'GOOGLE_ADS_API_VERSION',
];

export function envValue(name) {
  return process.env[name]?.trim() || '';
}

export function validateGoogleAdsEnv() {
  const missing = REQUIRED_GOOGLE_ADS_ENV.filter((name) => !envValue(name));
  const invalid = [];
  for (const name of ['GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_LOGIN_CUSTOMER_ID']) {
    if (envValue(name) && !normalizeCustomerId(envValue(name))) {
      invalid.push(name);
    }
  }
  return {
    ok: missing.length === 0 && invalid.length === 0,
    missing,
    invalid,
    present: [...REQUIRED_GOOGLE_ADS_ENV, ...OPTIONAL_GOOGLE_ADS_ENV].filter((name) => envValue(name)),
  };
}

export function invalidGoogleAdsEnvErrors(envStatus) {
  const messages = {
    GOOGLE_ADS_CUSTOMER_ID: 'GOOGLE_ADS_CUSTOMER_ID must contain at least one digit.',
    GOOGLE_ADS_LOGIN_CUSTOMER_ID: 'GOOGLE_ADS_LOGIN_CUSTOMER_ID must contain at least one digit when set.',
  };
  return (envStatus.invalid || []).map((name) => messages[name] || `${name} is invalid.`);
}

export function googleAdsApiVersion() {
  return envValue('GOOGLE_ADS_API_VERSION') || DEFAULT_GOOGLE_ADS_API_VERSION;
}

export function normalizeCustomerId(value) {
  return String(value || '').replace(/[^0-9]/g, '');
}

export function maskCustomerId(value) {
  const normalized = normalizeCustomerId(value);
  if (normalized.length <= 4) {
    return normalized || '';
  }

  return `${'*'.repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}`;
}

export function customerIdFingerprint(value) {
  const normalized = normalizeCustomerId(value);
  const secret = envValue('GOOGLE_ADS_REFRESH_TOKEN');
  if (!normalized || !secret) {
    return '';
  }

  return createHmac('sha256', secret).update(normalized).digest('hex');
}

// Mask the `customers/<id>` prefix inside a Google Ads resource name (e.g.
// `customers/1234567890/campaigns/9876543210` becomes
// `customers/******7890/campaigns/9876543210`) so error output and emitted
// artifacts don't echo the raw customer id. Three operator scripts had
// near-identical local copies of this; centralized here so future masking
// rules only need to change in one place.
export function maskResourceName(value, customerId) {
  const normalized = normalizeCustomerId(customerId);
  if (!normalized) {
    return String(value || '');
  }
  return String(value || '').replaceAll(`customers/${normalized}`, `customers/${maskCustomerId(normalized)}`);
}
