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
  return {
    ok: missing.length === 0,
    missing,
    present: [...REQUIRED_GOOGLE_ADS_ENV, ...OPTIONAL_GOOGLE_ADS_ENV].filter((name) => envValue(name)),
  };
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
