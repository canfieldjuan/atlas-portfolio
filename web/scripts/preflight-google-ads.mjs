import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';
import { artifactVersionFields, GOOGLE_ADS_ARTIFACT_TYPES } from './google-ads-artifact-contracts.mjs';
import {
  googleAdsHeaders,
  parseGoogleError,
  refreshAccessToken as refreshGoogleAdsAccessToken,
  sanitizeGoogleAdsMessage,
} from './google-ads-api.mjs';
import {
  customerIdFingerprint,
  envValue,
  googleAdsApiVersion,
  invalidGoogleAdsEnvErrors,
  maskCustomerId,
  normalizeCustomerId,
  validateGoogleAdsEnv,
} from './google-ads-env.mjs';
import { loadLocalEnv } from './local-env.mjs';

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
  npm run ads:google:preflight -- --output /tmp/google-ads-preflight.json
  npm run ads:google:preflight -- --debug-errors

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
  It does not create campaigns, budgets, ad groups, keywords, or ads.
  Upstream error bodies are summarized by default. Use --debug-errors only in a trusted shell.`);
}

function fail(message, outputJson, details = {}) {
  failCommand(message, outputJson, details, { sanitize: sanitizeGoogleAdsMessage });
}

async function refreshAccessToken(options = {}) {
  callState.oauthCallAttempted = true;
  return refreshGoogleAdsAccessToken({ includeDebug: options.debugErrors });
}

async function listAccessibleCustomers(accessToken, apiVersion, options = {}) {
  callState.googleAdsCallAttempted = true;
  const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/customers:listAccessibleCustomers`, {
    method: 'GET',
    headers: googleAdsHeaders(accessToken),
  });

  if (!response.ok) {
    throw new Error(`listAccessibleCustomers failed (${response.status}): ${await parseGoogleError(response, { includeDebug: options.debugErrors })}`);
  }

  const payload = await response.json();
  return payload.resourceNames || [];
}

async function queryTargetCustomer(accessToken, apiVersion, customerId, options = {}) {
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
    throw new Error(`target customer query failed (${response.status}): ${await parseGoogleError(response, { includeDebug: options.debugErrors })}`);
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
  await loadLocalEnv();

  const { values, flags } = parseArgs(process.argv.slice(2));
  const outputJson = flags.has('--json');
  const debugErrors = flags.has('--debug-errors');
  const outputPath = values.get('--output');

  if (flags.has('--help') || flags.has('-h')) {
    printUsage();
    return;
  }

  if (flags.has('--execute')) {
    fail('Execution is intentionally not implemented. This command is read-only.', outputJson);
  }

  if (isBareFlag({ values, flags }, '--output')) {
    fail('Refusing to continue without --output <path>.', outputJson);
  }

  const envStatus = validateGoogleAdsEnv();
  if (!envStatus.ok) {
    fail('Google Ads environment is incomplete.', outputJson, {
      mode: 'READ_ONLY_PREFLIGHT',
      apiCalls: false,
      missing: envStatus.missing,
      invalid: envStatus.invalid,
      present: envStatus.present,
      errors: invalidGoogleAdsEnvErrors(envStatus),
    });
  }

  const apiVersion = googleAdsApiVersion();
  const customerId = normalizeCustomerId(envValue('GOOGLE_ADS_CUSTOMER_ID'));
  if (!customerId) {
    fail('GOOGLE_ADS_CUSTOMER_ID must contain at least one digit.', outputJson);
  }

  try {
    const accessToken = await refreshAccessToken({ debugErrors });
    const accessibleResourceNames = await listAccessibleCustomers(accessToken, apiVersion, { debugErrors });
    const customer = await queryTargetCustomer(accessToken, apiVersion, customerId, { debugErrors });
    const targetResourceName = `customers/${customerId}`;
    const payload = {
      ok: true,
      ...artifactVersionFields(GOOGLE_ADS_ARTIFACT_TYPES.PREFLIGHT),
      mode: 'READ_ONLY_PREFLIGHT',
      apiCalls: true,
      oauthCallAttempted: callState.oauthCallAttempted,
      googleAdsCallAttempted: callState.googleAdsCallAttempted,
      mutations: false,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
      targetCustomerFingerprint: customerIdFingerprint(customerId),
      loginCustomerId: envValue('GOOGLE_ADS_LOGIN_CUSTOMER_ID')
        ? maskCustomerId(envValue('GOOGLE_ADS_LOGIN_CUSTOMER_ID'))
        : null,
      accessibleCustomerCount: accessibleResourceNames.length,
      accessibleResourceNameMatched: accessibleResourceNames.includes(targetResourceName),
      targetCustomer: summarizeCustomer(customer),
    };

    const artifactPath = outputPath ? await writeJsonArtifact(outputPath, payload, { includeOutputPath: false }) : '';

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
    if (artifactPath) {
      console.log(`Preflight artifact: ${artifactPath}`);
    }
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
