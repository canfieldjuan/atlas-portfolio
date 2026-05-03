import { envValue, maskCustomerId, normalizeCustomerId } from './google-ads-env.mjs';

export const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';

export function formatDashedCustomerId(value) {
  const normalized = normalizeCustomerId(value);
  if (normalized.length !== 10) {
    return normalized;
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
}

export function sanitizeGoogleAdsMessage(message) {
  let safe = String(message || 'Unknown error.');
  for (const value of [envValue('GOOGLE_ADS_CUSTOMER_ID'), envValue('GOOGLE_ADS_LOGIN_CUSTOMER_ID')]) {
    const normalized = normalizeCustomerId(value);
    if (!normalized) {
      continue;
    }

    safe = safe.replaceAll(normalized, maskCustomerId(normalized));
    safe = safe.replaceAll(formatDashedCustomerId(normalized), maskCustomerId(normalized));
    safe = safe.replaceAll(`customers/${normalized}`, `customers/${maskCustomerId(normalized)}`);
  }
  return safe;
}

export function escapeGaqlString(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function googleAdsHeaders(accessToken, includeJson = false) {
  const headers = {
    authorization: `Bearer ${accessToken}`,
    'developer-token': envValue('GOOGLE_ADS_DEVELOPER_TOKEN'),
  };
  const loginCustomerId = normalizeCustomerId(envValue('GOOGLE_ADS_LOGIN_CUSTOMER_ID'));
  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId;
  }
  if (includeJson) {
    headers['content-type'] = 'application/json';
  }
  return headers;
}

export async function parseGoogleError(response, options = {}) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    const status = parsed.error?.status || parsed.error || parsed.error_description;
    const message = parsed.error?.message || parsed.error_description || 'Google API request failed.';
    if (options.includeMessage) {
      return status ? `Google API request failed with ${status}: ${sanitizeGoogleAdsMessage(message)}` : sanitizeGoogleAdsMessage(message);
    }
    if (!options.includeDebug) {
      return status ? `Google API request failed with ${status}.` : sanitizeGoogleAdsMessage(message);
    }

    return status
      ? `Google API request failed with ${status}. Debug: ${sanitizeGoogleAdsMessage(message || text)}`
      : sanitizeGoogleAdsMessage(message || text);
  } catch {
    return `Google API request failed with non-JSON response (${response.status}).`;
  }
}

export async function refreshAccessToken(options = {}) {
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: envValue('GOOGLE_ADS_CLIENT_ID'),
      client_secret: envValue('GOOGLE_ADS_CLIENT_SECRET'),
      refresh_token: envValue('GOOGLE_ADS_REFRESH_TOKEN'),
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw new Error(`OAuth refresh failed (${response.status}): ${await parseGoogleError(response, options)}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error('OAuth refresh response did not include access_token.');
  }
  return payload.access_token;
}

export async function googleAdsSearch(accessToken, apiVersion, customerId, query, options = {}) {
  const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: googleAdsHeaders(accessToken, true),
    body: JSON.stringify({
      query,
      pageSize: options.pageSize || 1,
    }),
  });

  if (!response.ok) {
    const label = options.errorLabel || 'Google Ads search';
    throw new Error(`${label} failed (${response.status}): ${await parseGoogleError(response, options)}`);
  }

  const payload = await response.json();
  return payload.results || [];
}

export async function mutateGoogleAds(accessToken, apiVersion, customerId, collection, operations) {
  const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/customers/${customerId}/${collection}:mutate`, {
    method: 'POST',
    headers: googleAdsHeaders(accessToken, true),
    body: JSON.stringify({ operations }),
  });

  if (!response.ok) {
    throw new Error(`${collection}:mutate failed (${response.status}): ${await parseGoogleError(response, { includeMessage: true })}`);
  }

  const payload = await response.json();
  return payload.results || [];
}

export async function mutateCampaignStatus(accessToken, apiVersion, customerId, resourceName, status) {
  const results = await mutateGoogleAds(accessToken, apiVersion, customerId, 'campaigns', [
    {
      update: {
        resourceName,
        status,
      },
      updateMask: 'status',
    },
  ]);

  return results?.[0]?.resourceName || resourceName;
}
