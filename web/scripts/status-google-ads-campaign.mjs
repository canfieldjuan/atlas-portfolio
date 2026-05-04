import { loadCampaignSpec } from './ads-spec-io.mjs';
import { failCommand, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';
import { artifactVersionFields } from './google-ads-artifact-contracts.mjs';
import {
  escapeGaqlString,
  googleAdsSearch,
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
  console.log(`Google Ads campaign status report

Usage:
  npm run ads:google:status
  npm run ads:google:status -- --dry-run
  npm run ads:google:status -- --json
  npm run ads:google:status -- --output /tmp/google-ads-status.json

Options:
  --campaign-name <name>  Override the source-controlled campaign name
  --output <path>         Write the status JSON artifact
  --json                  Print machine-readable JSON
  --dry-run               Build the query plan without credentials or API calls
  --debug-errors          Include sanitized upstream API error messages

Safety:
  This command is read-only. It refreshes OAuth and runs googleAds:search queries only.
  It does not create, pause, enable, update, or remove any Google Ads resources.`);
}

function fail(message, outputJson, details = {}) {
  failCommand(message, outputJson, details, { sanitize: sanitizeGoogleAdsMessage });
}

function microsToUsd(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? Math.round((parsed / 1_000_000) * 100) / 100 : 0;
}

function maskResourceName(value, customerId) {
  return String(value || '').replaceAll(`customers/${customerId}`, `customers/${maskCustomerId(customerId)}`);
}

function buildCampaignQuery(campaignName) {
  return `
SELECT
  campaign.id,
  campaign.name,
  campaign.resource_name,
  campaign.status,
  campaign.advertising_channel_type,
  campaign_budget.resource_name,
  campaign_budget.name,
  campaign_budget.status,
  campaign_budget.amount_micros
FROM campaign
WHERE campaign.name = '${escapeGaqlString(campaignName)}'
LIMIT 2
`.trim();
}

function buildAdGroupQuery(campaignResourceName) {
  return `
SELECT
  ad_group.id,
  ad_group.name,
  ad_group.status
FROM ad_group
WHERE ad_group.campaign = '${escapeGaqlString(campaignResourceName)}'
ORDER BY ad_group.name ASC
`.trim();
}

function buildAdQuery(campaignResourceName) {
  return `
SELECT
  ad_group.name,
  ad_group_ad.ad.id,
  ad_group_ad.ad.type,
  ad_group_ad.status
FROM ad_group_ad
WHERE ad_group.campaign = '${escapeGaqlString(campaignResourceName)}'
ORDER BY ad_group.name ASC
`.trim();
}

function statusBreakdown(rows, path) {
  return rows.reduce((accumulator, row) => {
    const status = path(row) || 'UNKNOWN';
    accumulator[status] = (accumulator[status] || 0) + 1;
    return accumulator;
  }, {});
}

function mapCampaignRow(row, customerId) {
  const campaign = row.campaign || {};
  const budget = row.campaignBudget || {};
  return {
    id: campaign.id || '',
    name: campaign.name || '',
    resourceName: maskResourceName(campaign.resourceName, customerId),
    rawResourceName: campaign.resourceName || '',
    status: campaign.status || '',
    channel: campaign.advertisingChannelType || '',
    budget: {
      name: budget.name || '',
      resourceName: maskResourceName(budget.resourceName, customerId),
      status: budget.status || '',
      amountMicros: Number(budget.amountMicros || 0),
      amountUsd: microsToUsd(budget.amountMicros),
    },
  };
}

function mapAdGroupRow(row) {
  return {
    id: row.adGroup?.id || '',
    name: row.adGroup?.name || '',
    status: row.adGroup?.status || '',
  };
}

function mapAdRow(row) {
  return {
    id: row.adGroupAd?.ad?.id || '',
    type: row.adGroupAd?.ad?.type || '',
    status: row.adGroupAd?.status || '',
    adGroupName: row.adGroup?.name || '',
  };
}

function buildNextSteps(campaign, adGroups = [], ads = []) {
  if (!campaign) {
    return {
      createPausedSafe: true,
      enableSafe: false,
      reason: 'campaign_not_found',
    };
  }

  if (campaign.status !== 'PAUSED') {
    return {
      createPausedSafe: false,
      enableSafe: false,
      reason: `campaign_${String(campaign.status || 'unknown').toLowerCase()}`,
    };
  }

  // A paused campaign cannot serve traffic if its ad groups or ads are also paused.
  // Flipping campaign.status to ENABLED in that state would leave the campaign live
  // but unable to deliver, which is the failure mode this gate must prevent.
  const hasEnabledAdGroup = adGroups.some((adGroup) => adGroup.status === 'ENABLED');
  const hasEnabledAd = ads.some((ad) => ad.status === 'ENABLED');

  if (!hasEnabledAdGroup) {
    return {
      createPausedSafe: false,
      enableSafe: false,
      reason: 'no_enabled_ad_group',
    };
  }

  if (!hasEnabledAd) {
    return {
      createPausedSafe: false,
      enableSafe: false,
      reason: 'no_enabled_ad',
    };
  }

  return {
    createPausedSafe: false,
    enableSafe: true,
    reason: 'campaign_paused',
  };
}

function buildDryRunPayload({ apiVersion, campaignName }) {
  const campaignResourcePlaceholder = 'customers/{customer_id}/campaigns/{campaign_id}';
  return {
    ok: true,
    ...artifactVersionFields(),
    mode: 'GOOGLE_ADS_CAMPAIGN_STATUS_DRY_RUN',
    apiCalls: false,
    mutations: false,
    apiVersion,
    campaignName,
    queries: {
      campaign: buildCampaignQuery(campaignName),
      adGroups: buildAdGroupQuery(campaignResourcePlaceholder),
      ads: buildAdQuery(campaignResourcePlaceholder),
    },
  };
}

function printTextReport(payload) {
  console.log('Google Ads campaign status');
  console.log(`Mode: ${payload.mode}`);
  console.log(`API calls: ${payload.apiCalls ? 'enabled' : 'disabled'}`);
  console.log('Mutations: disabled');
  console.log(`Campaign: ${payload.campaignName}`);
  if (payload.campaignFound) {
    console.log(`Status: ${payload.campaign.status || '(unknown)'}`);
    console.log(`Budget: $${payload.campaign.budget.amountUsd}/day`);
    console.log(`Ad groups: ${payload.adGroups.count}`);
    console.log(`Ads: ${payload.ads.count}`);
    console.log(`Enable safe: ${payload.nextSteps.enableSafe ? 'yes' : 'no'}`);
  } else if (payload.mode.endsWith('_DRY_RUN')) {
    console.log('Campaign status: not queried in dry-run');
  } else {
    console.log('Campaign found: no');
    console.log(`Create-paused safe: ${payload.nextSteps.createPausedSafe ? 'yes' : 'no'}`);
  }
  if (payload.outputPath) {
    console.log(`Status artifact: ${payload.outputPath}`);
  }
}

async function main() {
  await loadLocalEnv();

  const { values, flags } = parseArgs(process.argv.slice(2));
  const outputJson = flags.has('--json');
  const dryRun = flags.has('--dry-run');
  const debugErrors = flags.has('--debug-errors');
  const outputPath = values.get('--output');

  if (flags.has('--help') || flags.has('-h')) {
    printUsage();
    return;
  }
  if (flags.has('--execute')) {
    fail('Execution mode is not supported. This command is read-only.', outputJson);
  }
  if ((flags.has('--output') || values.has('--output')) && !outputPath) {
    fail('Refusing to continue without --output <path>.', outputJson);
  }

  const { campaign } = await loadCampaignSpec();
  const campaignName = values.get('--campaign-name') || campaign.campaignName;
  const apiVersion = googleAdsApiVersion();

  if (dryRun) {
    const payload = buildDryRunPayload({ apiVersion, campaignName });
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

  const envStatus = validateGoogleAdsEnv();
  if (!envStatus.ok) {
    fail('Google Ads environment is incomplete.', outputJson, {
      mode: 'GOOGLE_ADS_CAMPAIGN_STATUS_REPORT',
      apiCalls: false,
      mutations: false,
      missing: envStatus.missing,
      present: envStatus.present,
    });
  }

  const customerId = normalizeCustomerId(envValue('GOOGLE_ADS_CUSTOMER_ID'));
  if (!customerId) {
    fail('GOOGLE_ADS_CUSTOMER_ID must contain at least one digit.', outputJson);
  }

  try {
    const accessToken = await refreshAccessToken({ includeDebug: debugErrors });
    const campaignRows = await googleAdsSearch(accessToken, apiVersion, customerId, buildCampaignQuery(campaignName), {
      includeDebug: debugErrors,
      pageSize: 2,
      errorLabel: 'campaign status query',
    });
    if (campaignRows.length > 1) {
      fail('Multiple Google Ads campaigns matched the configured campaign name.', outputJson, {
        mode: 'GOOGLE_ADS_CAMPAIGN_STATUS_REPORT',
        apiCalls: true,
        mutations: false,
        apiVersion,
        targetCustomerId: maskCustomerId(customerId),
        targetCustomerFingerprint: customerIdFingerprint(customerId),
        campaignName,
        matchedCampaignCount: campaignRows.length,
      });
    }

    const campaignStatus = campaignRows[0] ? mapCampaignRow(campaignRows[0], customerId) : null;
    const adGroupRows = campaignStatus
      ? await googleAdsSearch(accessToken, apiVersion, customerId, buildAdGroupQuery(campaignStatus.rawResourceName), {
          includeDebug: debugErrors,
          pageSize: 1000,
          errorLabel: 'ad group status query',
        })
      : [];
    const adRows = campaignStatus
      ? await googleAdsSearch(accessToken, apiVersion, customerId, buildAdQuery(campaignStatus.rawResourceName), {
          includeDebug: debugErrors,
          pageSize: 1000,
          errorLabel: 'ad status query',
        })
      : [];
    const adGroups = adGroupRows.map(mapAdGroupRow);
    const ads = adRows.map(mapAdRow);
    const payload = {
      ok: true,
      ...artifactVersionFields(),
      mode: 'GOOGLE_ADS_CAMPAIGN_STATUS_REPORT',
      apiCalls: true,
      mutations: false,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
      targetCustomerFingerprint: customerIdFingerprint(customerId),
      campaignName,
      campaignFound: Boolean(campaignStatus),
      campaign: campaignStatus
        ? {
            ...campaignStatus,
            rawResourceName: undefined,
          }
        : null,
      adGroups: {
        count: adGroups.length,
        statusBreakdown: statusBreakdown(adGroups, (row) => row.status),
        rows: adGroups,
      },
      ads: {
        count: ads.length,
        statusBreakdown: statusBreakdown(ads, (row) => row.status),
        typeBreakdown: statusBreakdown(ads, (row) => row.type),
        rows: ads,
      },
      nextSteps: buildNextSteps(campaignStatus, adGroups, ads),
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
      mode: 'GOOGLE_ADS_CAMPAIGN_STATUS_REPORT',
      apiCalls: true,
      mutations: false,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
      targetCustomerFingerprint: customerIdFingerprint(customerId),
      campaignName,
    });
  }
}

main().catch((error) => {
  const outputJson = process.argv.includes('--json');
  fail(error.message || String(error), outputJson, {
    mode: 'GOOGLE_ADS_CAMPAIGN_STATUS_REPORT',
    apiCalls: false,
    mutations: false,
  });
});
