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

// Shared error parser for both Google Ads API responses and OAuth token endpoint
// responses. The token endpoint commonly returns `{ error, error_description }`,
// the Ads API returns `{ error: { status, message } }`; this helper handles both
// so OAuth refresh failures and Ads API failures yield consistently formatted
// summaries. `options.sanitize` defaults to `sanitizeGoogleAdsMessage` (masks
// Google Ads customer ids) but can be overridden — e.g., the GA4 reporter passes
// a property-id masker so it can reuse this helper without leaking GA4 ids.
export async function parseGoogleError(response, options = {}) {
  const sanitize = options.sanitize || sanitizeGoogleAdsMessage;
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    const status = parsed.error?.status || parsed.error || parsed.error_description;
    const message = parsed.error?.message || parsed.error_description || 'Google API request failed.';
    if (options.includeMessage) {
      return status ? `Google API request failed with ${status}: ${sanitize(message)}` : sanitize(message);
    }
    if (!options.includeDebug) {
      return status ? `Google API request failed with ${status}.` : sanitize(message);
    }

    return status
      ? `Google API request failed with ${status}. Debug: ${sanitize(message || text)}`
      : sanitize(message || text);
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

// Hard upper bound on pages followed for a single googleAdsSearch call. v22 fixes page
// size at 10000 server-side, so this covers up to ten million rows per call — far above
// any realistic Google Ads resource count for a single campaign. The cap prevents an
// infinite loop if the API returned the same token repeatedly.
const GOOGLE_ADS_SEARCH_MAX_PAGES = 1000;

export async function googleAdsSearch(accessToken, apiVersion, customerId, query, options = {}) {
  const label = options.errorLabel || 'Google Ads search';
  // v22 dropped support for the pageSize request field; page size is now fixed at 10000
  // server-side. We accept the option for backwards compatibility but no longer send it.
  const maxPages = Math.max(1, Math.min(options.maxPages || GOOGLE_ADS_SEARCH_MAX_PAGES, GOOGLE_ADS_SEARCH_MAX_PAGES));
  const aggregated = [];
  let pageToken = '';
  let pagesFetched = 0;

  while (true) {
    pagesFetched += 1;
    const requestBody = pageToken ? { query, pageToken } : { query };
    const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/customers/${customerId}/googleAds:search`, {
      method: 'POST',
      headers: googleAdsHeaders(accessToken, true),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`${label} failed (${response.status}): ${await parseGoogleError(response, options)}`);
    }

    const payload = await response.json();
    if (Array.isArray(payload.results)) {
      aggregated.push(...payload.results);
    }

    const nextPageToken = payload.nextPageToken || '';
    if (!nextPageToken) {
      return aggregated;
    }
    if (nextPageToken === pageToken) {
      // The API returned the same nextPageToken it just received. That is either an
      // API quirk or a malformed response, but in both cases continuing or returning
      // would silently truncate results. Fail closed — silent data loss is the failure
      // mode this pagination loop exists to eliminate.
      throw new Error(
        `${label} returned the same nextPageToken twice in a row; refusing to risk silent truncation.`,
      );
    }
    if (pagesFetched >= maxPages) {
      throw new Error(`${label} exceeded the ${maxPages}-page safety cap; refusing to follow more pages.`);
    }
    pageToken = nextPageToken;
  }
}

// Keyword Planner ideas + search volume. Read-only: POSTs a seed to
// KeywordPlanIdeaService.generateKeywordIdeas and returns the result rows
// (`text` + `keywordIdeaMetrics`). Same fail-closed pagination contract as
// googleAdsSearch — refuse to silently truncate.
export async function generateKeywordIdeas(accessToken, apiVersion, customerId, requestBody, options = {}) {
  const label = options.errorLabel || 'Google Ads keyword ideas';
  const maxPages = Math.max(1, Math.min(options.maxPages || GOOGLE_ADS_SEARCH_MAX_PAGES, GOOGLE_ADS_SEARCH_MAX_PAGES));
  const aggregated = [];
  let pageToken = '';
  let pagesFetched = 0;

  while (true) {
    pagesFetched += 1;
    const body = pageToken ? { ...requestBody, pageToken } : requestBody;
    const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/customers/${customerId}:generateKeywordIdeas`, {
      method: 'POST',
      headers: googleAdsHeaders(accessToken, true),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`${label} failed (${response.status}): ${await parseGoogleError(response, options)}`);
    }

    const payload = await response.json();
    if (Array.isArray(payload.results)) {
      aggregated.push(...payload.results);
    }

    const nextPageToken = payload.nextPageToken || '';
    if (!nextPageToken) {
      return aggregated;
    }
    if (nextPageToken === pageToken) {
      throw new Error(
        `${label} returned the same nextPageToken twice in a row; refusing to risk silent truncation.`,
      );
    }
    if (pagesFetched >= maxPages) {
      throw new Error(`${label} exceeded the ${maxPages}-page safety cap; refusing to follow more pages.`);
    }
    pageToken = nextPageToken;
  }
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
