import { failCommand, parseArgs, readJsonArtifact, writeJsonArtifact } from './ads-cli-helpers.mjs';
import {
  escapeGaqlString,
  googleAdsSearch,
  mutateCampaignStatus,
  refreshAccessToken,
  sanitizeGoogleAdsMessage,
} from './google-ads-api.mjs';
import {
  customerIdFingerprint,
  envValue,
  googleAdsApiVersion,
  maskCustomerId,
  normalizeCustomerId,
  validateGoogleAdsEnv,
} from './google-ads-env.mjs';
import { loadLocalEnv } from './local-env.mjs';

function printUsage() {
  console.log(`Google Ads campaign enable command

Usage:
  npm run ads:google:enable -- --dry-run --readiness-result /tmp/google-ads-enable-readiness.json
  npm run ads:google:enable -- --readiness-result /tmp/google-ads-enable-readiness.json --preflight-result /tmp/google-ads-preflight.json --confirm-enable-live-campaign

Optional:
  --output <path>  Write the enablement result artifact
  --json           Print machine-readable JSON

Safety:
  This command is the live enablement mutation. It refuses to run without a readiness artifact,
  a successful preflight artifact for the configured customer, and --confirm-enable-live-campaign.
  It queries Google Ads first and only updates campaign.status when the current campaign is PAUSED.`);
}

function fail(message, outputJson, details = {}) {
  failCommand(message, outputJson, details, { sanitize: sanitizeGoogleAdsMessage });
}

function validateReadinessResult(payload) {
  const errors = [];
  if (payload?.ok !== true) {
    errors.push('Readiness result must have ok=true');
  }
  if (payload?.mode !== 'GOOGLE_ADS_ENABLEMENT_READINESS') {
    errors.push('Readiness result must have mode=GOOGLE_ADS_ENABLEMENT_READINESS');
  }
  if (payload?.readyForEnablement !== true) {
    errors.push('Readiness result must have readyForEnablement=true');
  }
  if (payload?.apiCalls !== false || payload?.mutations !== false) {
    errors.push('Readiness result must be offline with apiCalls=false and mutations=false');
  }
  if (!payload?.createResult?.campaignName) {
    errors.push('Readiness result must include createResult.campaignName');
  }
  if (payload?.createResult?.campaignStatus !== 'PAUSED') {
    errors.push('Readiness result must record the created campaign as PAUSED');
  }

  for (const [key, value] of Object.entries(payload?.confirmations || {})) {
    if (value !== true) {
      errors.push(`Readiness confirmation must be true: ${key}`);
    }
  }

  for (const key of ['assetsReviewed', 'budgetReviewed', 'conversionTrackingReviewed', 'negativeKeywordsReviewed']) {
    if (payload?.confirmations?.[key] !== true) {
      errors.push(`Readiness result missing required confirmation: ${key}`);
    }
  }
  return errors;
}

function validatePreflightResult(payload, expectedCustomerId) {
  const errors = [];
  if (payload?.ok !== true) {
    errors.push('Preflight result must have ok=true');
  }
  if (payload?.mode !== 'READ_ONLY_PREFLIGHT') {
    errors.push('Preflight result must have mode=READ_ONLY_PREFLIGHT');
  }
  if (payload?.mutations !== false) {
    errors.push('Preflight result must have mutations=false');
  }
  if (payload?.googleAdsCallAttempted !== true) {
    errors.push('Preflight result must show googleAdsCallAttempted=true');
  }
  if (payload?.targetCustomerFingerprint !== customerIdFingerprint(expectedCustomerId)) {
    errors.push('Preflight target customer fingerprint must match GOOGLE_ADS_CUSTOMER_ID');
  }
  return errors;
}

async function findPausedCampaign(accessToken, apiVersion, customerId, campaignName) {
  const rows = await googleAdsSearch(
    accessToken,
    apiVersion,
    customerId,
    `
SELECT
  campaign.id,
  campaign.name,
  campaign.resource_name,
  campaign.status
FROM campaign
WHERE campaign.name = '${escapeGaqlString(campaignName)}'
LIMIT 1
`.trim(),
    { includeMessage: true },
  );
  const campaign = rows[0]?.campaign;
  if (!campaign) {
    throw new Error(`Campaign not found in Google Ads: ${campaignName}`);
  }
  if (campaign.status !== 'PAUSED') {
    throw new Error(`Campaign is not PAUSED in Google Ads. Current status: ${campaign.status || 'unknown'}`);
  }
  if (!campaign.resourceName) {
    throw new Error(`Campaign query returned no resourceName for ${campaignName}.`);
  }
  return campaign;
}

function buildDryRunPlan(readiness) {
  return {
    campaignName: readiness.createResult.campaignName,
    currentRequiredStatus: 'PAUSED',
    targetStatus: 'ENABLED',
    operation: {
      update: {
        resourceName: 'customers/{customer_id}/campaigns/{campaign_id}',
        status: 'ENABLED',
      },
      updateMask: 'status',
    },
  };
}

function maskResourceName(value, customerId) {
  return String(value || '').replaceAll(`customers/${customerId}`, `customers/${maskCustomerId(customerId)}`);
}

function printTextReport(payload) {
  console.log('Google Ads campaign enablement');
  console.log(`Mode: ${payload.mode}`);
  console.log(`Campaign: ${payload.campaignName}`);
  console.log(`API calls: ${payload.apiCalls ? 'enabled' : 'disabled'}`);
  console.log(`Mutations: ${payload.mutations ? 'enabled' : 'disabled'}`);
  if (payload.previousStatus) {
    console.log(`Status: ${payload.previousStatus} -> ${payload.currentStatus}`);
  }
  if (payload.outputPath) {
    console.log(`Enablement artifact: ${payload.outputPath}`);
  }
}

async function main() {
  await loadLocalEnv();

  const { values, flags } = parseArgs(process.argv.slice(2));
  const outputJson = flags.has('--json');
  const dryRun = flags.has('--dry-run');
  const outputPath = values.get('--output');

  if (flags.has('--help') || flags.has('-h')) {
    printUsage();
    return;
  }
  if ((flags.has('--output') || values.has('--output')) && !outputPath) {
    fail('Refusing to continue without --output <path>.', outputJson);
  }

  const readinessPath = values.get('--readiness-result');
  if (!readinessPath) {
    fail('Refusing to continue without --readiness-result <path>.', outputJson);
  }

  const { payload: readiness, resolvedPath: resolvedReadinessPath } = await readJsonArtifact(readinessPath);
  const readinessErrors = validateReadinessResult(readiness);
  if (readinessErrors.length > 0) {
    fail('Readiness result is not valid for campaign enablement.', outputJson, {
      mode: 'GOOGLE_ADS_ENABLE',
      apiCalls: false,
      mutations: false,
      errors: readinessErrors,
    });
  }

  if (dryRun) {
    const payload = {
      ok: true,
      mode: 'GOOGLE_ADS_ENABLE_DRY_RUN',
      apiCalls: false,
      mutations: false,
      readinessResult: resolvedReadinessPath,
      campaignName: readiness.createResult.campaignName,
      enablePlan: buildDryRunPlan(readiness),
    };
    if (outputPath) {
      payload.outputPath = await writeJsonArtifact(outputPath, payload);
    }
    if (outputJson) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }
    printTextReport(payload);
    return;
  }

  if (!flags.has('--confirm-enable-live-campaign')) {
    fail('Refusing to enable without --confirm-enable-live-campaign.', outputJson);
  }

  const preflightPath = values.get('--preflight-result');
  if (!preflightPath) {
    fail('Refusing to enable without --preflight-result <path>.', outputJson);
  }

  const envStatus = validateGoogleAdsEnv();
  if (!envStatus.ok) {
    fail('Google Ads environment is incomplete.', outputJson, {
      mode: 'GOOGLE_ADS_ENABLE',
      apiCalls: false,
      mutations: false,
      missing: envStatus.missing,
      present: envStatus.present,
    });
  }

  const customerId = normalizeCustomerId(envValue('GOOGLE_ADS_CUSTOMER_ID'));
  const apiVersion = googleAdsApiVersion();
  const { payload: preflight, resolvedPath: resolvedPreflightPath } = await readJsonArtifact(preflightPath);
  const preflightErrors = validatePreflightResult(preflight, customerId);
  if (preflightErrors.length > 0) {
    fail('Preflight result is not valid for campaign enablement.', outputJson, {
      mode: 'GOOGLE_ADS_ENABLE',
      apiCalls: false,
      mutations: false,
      errors: preflightErrors,
    });
  }

  try {
    const accessToken = await refreshAccessToken({ includeMessage: true });
    const campaign = await findPausedCampaign(accessToken, apiVersion, customerId, readiness.createResult.campaignName);
    const enabledResourceName = await mutateCampaignStatus(accessToken, apiVersion, customerId, campaign.resourceName, 'ENABLED');
    const payload = {
      ok: true,
      mode: 'GOOGLE_ADS_ENABLE',
      apiCalls: true,
      mutations: true,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
      readinessResult: resolvedReadinessPath,
      preflightResult: resolvedPreflightPath,
      campaignName: campaign.name,
      previousStatus: 'PAUSED',
      currentStatus: 'ENABLED',
      resourceName: maskResourceName(enabledResourceName, customerId),
    };
    if (outputPath) {
      payload.outputPath = await writeJsonArtifact(outputPath, payload);
    }
    if (outputJson) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }
    printTextReport(payload);
  } catch (error) {
    fail(error.message || String(error), outputJson, {
      mode: 'GOOGLE_ADS_ENABLE',
      apiCalls: true,
      mutations: false,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
      readinessResult: resolvedReadinessPath,
      preflightResult: resolvedPreflightPath,
    });
  }
}

main().catch((error) => {
  const outputJson = process.argv.includes('--json');
  fail(error.message || String(error), outputJson, {
    mode: 'GOOGLE_ADS_ENABLE',
    apiCalls: false,
    mutations: false,
  });
});
