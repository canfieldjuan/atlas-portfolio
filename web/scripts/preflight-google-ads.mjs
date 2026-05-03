import {
  envValue,
  googleAdsApiVersion,
  maskCustomerId,
  normalizeCustomerId,
  validateGoogleAdsEnv,
} from './google-ads-env.mjs';

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const READ_ONLY_CUSTOMER_QUERY = `
  SELECT
    customer.id,
    customer.descriptive_name,
    customer.currency_code,
    customer.time_zone,
    customer.manager,
    customer.test_account
  FROM customer
  LIMIT 1
`;
const callState = {
  oauthCallAttempted: false,
  googleAdsCallAttempted: false,
};

function printUsage() {
  console.log(`Google Ads read-only preflight

Usage:
  npm run ads:google:preflight
  npm run ads:google:preflight -- --json

Required env:
  GOOGLE_ADS_DEVELOPER_TOKEN
  GOOGLE_ADS_CLIENT_ID
  GOOGLE_ADS_CLIENT_SECRET
  GOOGLE_ADS_REFRESH_TOKEN
  GOOGLE_ADS_CUSTOMER_ID

Optional env:
  GOOGLE_ADS_LOGIN_CUSTOMER_ID
  GOOGLE_ADS_API_VERSION (defaults to v22)

Safety:
  This script only refreshes OAuth, lists accessible customers, and runs a read-only customer query.
  It does not create campaigns, budgets, ad groups, keywords, or ads.`);
}

function fail(message, outputJson, details = {}) {
  const safeMessage = sanitizeMessage(message);
  if (outputJson) {
    console.log(JSON.stringify({ ok: false, error: safeMessage, ...details }, null, 2));
  } else {
    console.error(safeMessage);
    if (details.missing?.length) {
      for (const name of details.missing) {
        console.error(`- ${name}`);
      }
    }
  }
  process.exit(1);
}

function sanitizeMessage(message) {
  let safe = String(message || 'Unknown error.');
  for (const value of [envValue('GOOGLE_ADS_CUSTOMER_ID'), envValue('GOOGLE_ADS_LOGIN_CUSTOMER_ID')]) {
    const normalized = normalizeCustomerId(value);
    if (!normalized) {
      continue;
    }

    safe = safe.replaceAll(normalized, maskCustomerId(normalized));
    safe = safe.replaceAll(formatDashedCustomerId(normalized), maskCustomerId(normalized));
  }
  return safe;
}

function formatDashedCustomerId(value) {
  const normalized = normalizeCustomerId(value);
  if (normalized.length !== 10) {
    return normalized;
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
}

async function parseGoogleError(response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    return parsed.error?.message || parsed.error_description || parsed.error || 'Google API request failed.';
  } catch {
    return `Google API request failed with non-JSON response (${response.status}).`;
  }
}

async function refreshAccessToken() {
  callState.oauthCallAttempted = true;
  const body = new URLSearchParams({
    client_id: envValue('GOOGLE_ADS_CLIENT_ID'),
    client_secret: envValue('GOOGLE_ADS_CLIENT_SECRET'),
    refresh_token: envValue('GOOGLE_ADS_REFRESH_TOKEN'),
    grant_type: 'refresh_token',
  });

  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`OAuth refresh failed (${response.status}): ${await parseGoogleError(response)}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error('OAuth refresh response did not include access_token.');
  }

  return payload.access_token;
}

function googleAdsHeaders(accessToken, includeJson = false) {
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

async function listAccessibleCustomers(accessToken, apiVersion) {
  callState.googleAdsCallAttempted = true;
  const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/customers:listAccessibleCustomers`, {
    method: 'GET',
    headers: googleAdsHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error(`listAccessibleCustomers failed (${response.status}): ${await parseGoogleError(response)}`);
  }

  const payload = await response.json();
  return payload.resourceNames || [];
}

async function queryTargetCustomer(accessToken, apiVersion, customerId) {
  callState.googleAdsCallAttempted = true;
  const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: googleAdsHeaders(accessToken, true),
    body: JSON.stringify({
      query: READ_ONLY_CUSTOMER_QUERY,
      pageSize: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`target customer query failed (${response.status}): ${await parseGoogleError(response)}`);
  }

  const payload = await response.json();
  const customer = payload.results?.[0]?.customer;
  if (!customer) {
    throw new Error('Target customer query succeeded but returned no customer row.');
  }

  return customer;
}

function summarizeCustomer(customer) {
  return {
    id: maskCustomerId(customer.id),
    descriptiveName: customer.descriptiveName || '',
    currencyCode: customer.currencyCode || '',
    timeZone: customer.timeZone || '',
    manager: Boolean(customer.manager),
    testAccount: Boolean(customer.testAccount),
  };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const outputJson = args.has('--json');

  if (args.has('--help') || args.has('-h')) {
    printUsage();
    return;
  }

  if (args.has('--execute')) {
    fail('Execution is intentionally not implemented. This command is read-only.', outputJson);
  }

  const envStatus = validateGoogleAdsEnv();
  if (!envStatus.ok) {
    fail('Google Ads environment is incomplete.', outputJson, {
      mode: 'READ_ONLY_PREFLIGHT',
      apiCalls: false,
      missing: envStatus.missing,
      present: envStatus.present,
    });
  }

  const apiVersion = googleAdsApiVersion();
  const customerId = normalizeCustomerId(envValue('GOOGLE_ADS_CUSTOMER_ID'));
  if (!customerId) {
    fail('GOOGLE_ADS_CUSTOMER_ID must contain at least one digit.', outputJson);
  }

  try {
    const accessToken = await refreshAccessToken();
    const accessibleResourceNames = await listAccessibleCustomers(accessToken, apiVersion);
    const customer = await queryTargetCustomer(accessToken, apiVersion, customerId);
    const targetResourceName = `customers/${customerId}`;
    const payload = {
      ok: true,
      mode: 'READ_ONLY_PREFLIGHT',
      apiCalls: true,
      oauthCallAttempted: callState.oauthCallAttempted,
      googleAdsCallAttempted: callState.googleAdsCallAttempted,
      mutations: false,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
      loginCustomerId: envValue('GOOGLE_ADS_LOGIN_CUSTOMER_ID')
        ? maskCustomerId(envValue('GOOGLE_ADS_LOGIN_CUSTOMER_ID'))
        : null,
      accessibleCustomerCount: accessibleResourceNames.length,
      accessibleResourceNameMatched: accessibleResourceNames.includes(targetResourceName),
      targetCustomer: summarizeCustomer(customer),
    };

    if (outputJson) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }

    console.log('Google Ads read-only preflight passed.');
    console.log('Mutations: disabled');
    console.log(`API version: ${payload.apiVersion}`);
    console.log(`Target customer: ${payload.targetCustomerId}`);
    console.log(`Login customer: ${payload.loginCustomerId || 'not set'}`);
    console.log(`Accessible customers: ${payload.accessibleCustomerCount}`);
    console.log(`Accessible list contains target: ${payload.accessibleResourceNameMatched ? 'yes' : 'no'}`);
    console.log(`Customer name: ${payload.targetCustomer.descriptiveName || '(not provided)'}`);
    console.log(`Currency: ${payload.targetCustomer.currencyCode || '(not provided)'}`);
    console.log(`Time zone: ${payload.targetCustomer.timeZone || '(not provided)'}`);
    console.log(`Manager: ${payload.targetCustomer.manager ? 'yes' : 'no'}`);
    console.log(`Test account: ${payload.targetCustomer.testAccount ? 'yes' : 'no'}`);
  } catch (error) {
    fail(error.message || String(error), outputJson, {
      mode: 'READ_ONLY_PREFLIGHT',
      apiCalls: callState.googleAdsCallAttempted,
      oauthCallAttempted: callState.oauthCallAttempted,
      googleAdsCallAttempted: callState.googleAdsCallAttempted,
      mutations: false,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
    });
  }
}

main().catch((error) => {
  fail(error.message || String(error), false, {
    mode: 'READ_ONLY_PREFLIGHT',
    apiCalls: callState.googleAdsCallAttempted,
    oauthCallAttempted: callState.oauthCallAttempted,
    googleAdsCallAttempted: callState.googleAdsCallAttempted,
    mutations: false,
  });
});
