import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, resolve } from 'node:path';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCampaignSpec, repoRoot } from './ads-spec-io.mjs';
import {
  customerIdFingerprint,
  envValue,
  googleAdsApiVersion,
  maskCustomerId,
  normalizeCustomerId,
  validateGoogleAdsEnv,
} from './google-ads-env.mjs';
import { loadLocalEnv } from './local-env.mjs';

const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GEO_TARGET_CONSTANTS = {
  US: 'geoTargetConstants/2840',
};
const LANGUAGE_CONSTANTS = {
  en: 'languageConstants/1000',
};

function printUsage() {
  console.log(`Google Ads create-paused guard

Usage:
  npm run ads:google:create-paused -- --preflight-result <path> --confirm-create-paused
  npm run ads:google:create-paused -- --dry-run --json
  npm run ads:google:create-paused -- --preflight-result <path> --confirm-create-paused --output /tmp/google-ads-create-paused.json
  npm run ads:google:create-paused -- --help

Required gates:
  1. ad spec must validate through ads:validate before this command is run
  2. Google Ads env must be complete
  3. --preflight-result must point at a successful ads:google:preflight -- --json output
  4. --confirm-create-paused must be present

Safety:
  This command creates the campaign in PAUSED state only. It refuses to run mutations without a successful
  read-only preflight artifact and --confirm-create-paused. Use --dry-run to inspect the mutation plan.`);
}

function parseArgs(argv) {
  const args = new Map();
  const flags = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('-')) {
      continue;
    }

    const [name, inlineValue] = item.split('=', 2);
    if (inlineValue !== undefined) {
      args.set(name, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith('-')) {
      args.set(name, next);
      index += 1;
      continue;
    }

    flags.add(name);
  }

  return { args, flags };
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
    if (details.errors?.length) {
      for (const error of details.errors) {
        console.error(`- ${error}`);
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
    safe = safe.replaceAll(`customers/${normalized}`, `customers/${maskCustomerId(normalized)}`);
  }
  return safe;
}

function maskResourceName(value) {
  const customerId = normalizeCustomerId(envValue('GOOGLE_ADS_CUSTOMER_ID'));
  if (!customerId) {
    return value;
  }
  return String(value || '').replaceAll(`customers/${customerId}`, `customers/${maskCustomerId(customerId)}`);
}

function recordCreatedResource(resources, type, resourceName) {
  resources.push({ type, resourceName: maskResourceName(resourceName) });
}

function runSpecValidator() {
  const result = spawnSync(process.execPath, [join(repoRoot, 'scripts', 'validate-ads-spec.mjs')], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return {
      ok: false,
      output: `${result.stdout || ''}${result.stderr || ''}`.trim(),
      status: result.status || 1,
    };
  }

  return { ok: true };
}

async function readPreflightResult(path) {
  const resolvedPath = isAbsolute(path) ? path : resolve(repoRoot, path);
  const payload = JSON.parse(await readFile(resolvedPath, 'utf8'));
  return { payload, resolvedPath };
}

function validatePreflightResult(payload, expectedCustomerId) {
  const errors = [];

  if (payload?.ok !== true) {
    errors.push('preflight result must have ok=true');
  }
  if (payload?.mode !== 'READ_ONLY_PREFLIGHT') {
    errors.push('preflight result must have mode=READ_ONLY_PREFLIGHT');
  }
  if (payload?.mutations !== false) {
    errors.push('preflight result must have mutations=false');
  }
  if (payload?.googleAdsCallAttempted !== true) {
    errors.push('preflight result must show googleAdsCallAttempted=true');
  }
  if (payload?.targetCustomerFingerprint !== customerIdFingerprint(expectedCustomerId)) {
    errors.push('preflight target customer fingerprint must match GOOGLE_ADS_CUSTOMER_ID');
  }

  return errors;
}

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function microsFromUsd(value) {
  return Math.round(Number(value || 0) * 1_000_000);
}

function keywordMatchType(value) {
  return String(value || '').toUpperCase();
}

function escapeGaqlString(value) {
  return String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
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

async function parseGoogleError(response) {
  const text = await response.text();
  try {
    const parsed = JSON.parse(text);
    const status = parsed.error?.status || parsed.error;
    const message = parsed.error?.message || 'Google API request failed.';
    return status ? `Google API request failed with ${status}: ${message}` : message;
  } catch {
    return `Google API request failed with non-JSON response (${response.status}).`;
  }
}

async function refreshAccessToken() {
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
    throw new Error(`OAuth refresh failed (${response.status}): ${await parseGoogleError(response)}`);
  }

  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error('OAuth refresh response did not include access_token.');
  }
  return payload.access_token;
}

async function googleAdsSearch(accessToken, apiVersion, customerId, query) {
  const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/customers/${customerId}/googleAds:search`, {
    method: 'POST',
    headers: googleAdsHeaders(accessToken, true),
    body: JSON.stringify({
      query,
      pageSize: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Ads search failed (${response.status}): ${await parseGoogleError(response)}`);
  }

  const payload = await response.json();
  return payload.results || [];
}

async function mutateGoogleAds(accessToken, apiVersion, customerId, collection, operations) {
  const response = await fetch(`https://googleads.googleapis.com/${apiVersion}/customers/${customerId}/${collection}:mutate`, {
    method: 'POST',
    headers: googleAdsHeaders(accessToken, true),
    body: JSON.stringify({ operations }),
  });

  if (!response.ok) {
    throw new Error(`${collection}:mutate failed (${response.status}): ${await parseGoogleError(response)}`);
  }

  const payload = await response.json();
  return payload.results || [];
}

async function assertCampaignDoesNotExist(accessToken, apiVersion, customerId, campaignName) {
  const rows = await googleAdsSearch(
    accessToken,
    apiVersion,
    customerId,
    `
SELECT
  campaign.id,
  campaign.name,
  campaign.status
FROM campaign
WHERE campaign.name = '${escapeGaqlString(campaignName)}'
LIMIT 1
`.trim(),
  );
  if (rows.length > 0) {
    throw new Error(`Campaign already exists in Google Ads: ${campaignName}`);
  }
}

function campaignBudgetOperation(campaign) {
  return {
    create: {
      name: `${campaign.campaignName} Budget`,
      amountMicros: microsFromUsd(campaign.dailyBudgetUsd),
      deliveryMethod: 'STANDARD',
      explicitlyShared: false,
    },
  };
}

function campaignOperation(campaign, campaignBudgetResourceName) {
  return {
    create: {
      name: campaign.campaignName,
      status: 'PAUSED',
      advertisingChannelType: 'SEARCH',
      campaignBudget: campaignBudgetResourceName,
      manualCpc: {},
      containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
      networkSettings: {
        targetGoogleSearch: true,
        targetSearchNetwork: true,
        targetContentNetwork: false,
        targetPartnerSearchNetwork: false,
      },
    },
  };
}

function campaignCriterionOperations(campaignResourceName, campaign) {
  const operations = [];
  for (const geo of campaign.geoTargets || []) {
    const geoTargetConstant = GEO_TARGET_CONSTANTS[geo];
    if (!geoTargetConstant) {
      throw new Error(`Unsupported geo target for create-paused: ${geo}`);
    }
    operations.push({
      create: {
        campaign: campaignResourceName,
        location: {
          geoTargetConstant,
        },
      },
    });
  }

  for (const language of campaign.languageTargets || []) {
    const languageConstant = LANGUAGE_CONSTANTS[language];
    if (!languageConstant) {
      throw new Error(`Unsupported language target for create-paused: ${language}`);
    }
    operations.push({
      create: {
        campaign: campaignResourceName,
        language: {
          languageConstant,
        },
      },
    });
  }

  return operations;
}

function adGroupOperation(campaignResourceName, adGroup) {
  return {
    create: {
      name: adGroup.name,
      campaign: campaignResourceName,
      status: 'ENABLED',
      type: 'SEARCH_STANDARD',
      cpcBidMicros: microsFromUsd(adGroup.defaultMaxCpcUsd),
    },
  };
}

function keywordOperations(adGroupResourceName, keywords) {
  return keywords.map((row) => ({
    create: {
      adGroup: adGroupResourceName,
      status: 'ENABLED',
      keyword: {
        text: row.keyword,
        matchType: keywordMatchType(row.match_type),
      },
    },
  }));
}

function negativeKeywordOperations(adGroupResourceName, negatives) {
  return negatives.map((row) => ({
    create: {
      adGroup: adGroupResourceName,
      negative: true,
      keyword: {
        text: row.keyword,
        matchType: keywordMatchType(row.match_type),
      },
    },
  }));
}

function responsiveSearchAdOperation(adGroupResourceName, rsaAssets) {
  return {
    create: {
      adGroup: adGroupResourceName,
      status: 'PAUSED',
      ad: {
        finalUrls: [rsaAssets.finalUrl],
        responsiveSearchAd: {
          headlines: rsaAssets.headlines.map((text) => ({ text })),
          descriptions: rsaAssets.descriptions.map((text) => ({ text })),
        },
      },
    },
  };
}

function buildDryRunPlan(campaign, adGroups) {
  const budgetPlaceholder = `customers/{customer_id}/campaignBudgets/${slug(campaign.campaignName)}-budget`;
  const campaignPlaceholder = `customers/{customer_id}/campaigns/${slug(campaign.campaignName)}`;

  return {
    budget: campaignBudgetOperation(campaign),
    campaign: campaignOperation(campaign, budgetPlaceholder),
    campaignCriteria: campaignCriterionOperations(campaignPlaceholder, campaign),
    adGroups: adGroups.map(({ adGroup, keywords, negatives, rsaAssets }) => {
      const adGroupPlaceholder = `customers/{customer_id}/adGroups/${slug(adGroup.name)}`;
      return {
        adGroup: adGroupOperation(campaignPlaceholder, adGroup),
        keywords: keywordOperations(adGroupPlaceholder, keywords),
        negativeKeywords: negativeKeywordOperations(adGroupPlaceholder, negatives),
        responsiveSearchAd: responsiveSearchAdOperation(adGroupPlaceholder, rsaAssets),
      };
    }),
  };
}

async function writeResultArtifact(outputPath, payload) {
  const resolvedPath = isAbsolute(outputPath) ? outputPath : resolve(repoRoot, outputPath);
  await mkdir(dirname(resolvedPath), { recursive: true });
  await writeFile(resolvedPath, `${JSON.stringify({ ...payload, outputPath: resolvedPath }, null, 2)}\n`, 'utf8');
  return resolvedPath;
}

async function main() {
  await loadLocalEnv();

  const { args, flags } = parseArgs(process.argv.slice(2));
  const outputJson = flags.has('--json');
  const dryRun = flags.has('--dry-run');
  const outputPath = args.get('--output');

  if (flags.has('--help') || flags.has('-h')) {
    printUsage();
    return;
  }

  if ((flags.has('--output') || args.has('--output')) && !outputPath) {
    fail('Refusing to continue without --output <path>.', outputJson);
  }

  if (!dryRun && !flags.has('--confirm-create-paused')) {
    fail('Refusing to continue without --confirm-create-paused.', outputJson);
  }

  const preflightPath = args.get('--preflight-result');
  if (!dryRun && !preflightPath) {
    fail('Refusing to continue without --preflight-result <path>.', outputJson);
  }

  const specValidation = runSpecValidator();
  if (!specValidation.ok) {
    fail('Ad spec validation failed.', outputJson, {
      mode: 'CREATE_PAUSED_GUARD',
      apiCalls: false,
      mutations: false,
      validatorOutput: specValidation.output,
    });
  }

  const { campaign, adGroups } = await loadCampaignSpec();
  if (dryRun) {
    const payload = {
      ok: true,
      mode: 'CREATE_PAUSED_DRY_RUN',
      apiCalls: false,
      mutations: false,
      mutationImplementation: 'planned',
      apiVersion: googleAdsApiVersion(),
      campaign: {
        name: campaign.campaignName,
        status: campaign.status,
        dailyBudgetUsd: campaign.dailyBudgetUsd,
        adGroups: adGroups.length,
      },
      mutationPlan: buildDryRunPlan(campaign, adGroups),
    };
    if (outputPath) {
      payload.outputPath = await writeResultArtifact(outputPath, payload);
    }
    if (outputJson) {
      console.log(JSON.stringify(payload, null, 2));
      return;
    }

    console.log('Create-paused dry-run passed.');
    console.log('API calls: disabled');
    console.log('Mutations: disabled');
    console.log(`Campaign: ${payload.campaign.name}`);
    console.log(`Ad groups: ${payload.campaign.adGroups}`);
    if (payload.outputPath) {
      console.log(`Mutation plan artifact: ${payload.outputPath}`);
    }
    return;
  }

  const envStatus = validateGoogleAdsEnv();
  if (!envStatus.ok) {
    fail('Google Ads environment is incomplete.', outputJson, {
      mode: 'CREATE_PAUSED_GUARD',
      apiCalls: false,
      mutations: false,
      missing: envStatus.missing,
      present: envStatus.present,
    });
  }

  const customerId = normalizeCustomerId(process.env.GOOGLE_ADS_CUSTOMER_ID);
  const { payload: preflight, resolvedPath } = await readPreflightResult(preflightPath);
  const preflightErrors = validatePreflightResult(preflight, customerId);

  if (preflightErrors.length > 0) {
    fail('Preflight result is not valid for create-paused.', outputJson, {
      mode: 'CREATE_PAUSED_GUARD',
      apiCalls: false,
      mutations: false,
      preflightResult: resolvedPath,
      errors: preflightErrors,
    });
  }

  const apiVersion = googleAdsApiVersion();
  const createdResources = [];
  try {
    const accessToken = await refreshAccessToken();
    await assertCampaignDoesNotExist(accessToken, apiVersion, customerId, campaign.campaignName);

    const [budgetResult] = await mutateGoogleAds(accessToken, apiVersion, customerId, 'campaignBudgets', [
      campaignBudgetOperation(campaign),
    ]);
    const budgetResourceName = budgetResult?.resourceName;
    if (!budgetResourceName) {
      throw new Error('Google Ads did not return a campaign budget resource name.');
    }
    recordCreatedResource(createdResources, 'campaignBudget', budgetResourceName);

    const [campaignResult] = await mutateGoogleAds(accessToken, apiVersion, customerId, 'campaigns', [
      campaignOperation(campaign, budgetResourceName),
    ]);
    const campaignResourceName = campaignResult?.resourceName;
    if (!campaignResourceName) {
      throw new Error('Google Ads did not return a campaign resource name.');
    }
    recordCreatedResource(createdResources, 'campaign', campaignResourceName);

    const criterionResults = await mutateGoogleAds(
      accessToken,
      apiVersion,
      customerId,
      'campaignCriteria',
      campaignCriterionOperations(campaignResourceName, campaign),
    );
    for (const item of criterionResults) {
      recordCreatedResource(createdResources, 'campaignCriterion', item.resourceName);
    }

    for (const { adGroup, keywords, negatives, rsaAssets } of adGroups) {
      const [adGroupResult] = await mutateGoogleAds(accessToken, apiVersion, customerId, 'adGroups', [
        adGroupOperation(campaignResourceName, adGroup),
      ]);
      const adGroupResourceName = adGroupResult?.resourceName;
      if (!adGroupResourceName) {
        throw new Error(`Google Ads did not return an ad group resource name for ${adGroup.name}.`);
      }
      recordCreatedResource(createdResources, 'adGroup', adGroupResourceName);

      const keywordResults = await mutateGoogleAds(
        accessToken,
        apiVersion,
        customerId,
        'adGroupCriteria',
        keywordOperations(adGroupResourceName, keywords),
      );
      for (const item of keywordResults) {
        recordCreatedResource(createdResources, 'keyword', item.resourceName);
      }

      const negativeResults = await mutateGoogleAds(
        accessToken,
        apiVersion,
        customerId,
        'adGroupCriteria',
        negativeKeywordOperations(adGroupResourceName, negatives),
      );
      for (const item of negativeResults) {
        recordCreatedResource(createdResources, 'negativeKeyword', item.resourceName);
      }

      const adResults = await mutateGoogleAds(accessToken, apiVersion, customerId, 'adGroupAds', [
        responsiveSearchAdOperation(adGroupResourceName, rsaAssets),
      ]);
      for (const item of adResults) {
        recordCreatedResource(createdResources, 'responsiveSearchAd', item.resourceName);
      }
    }

    const summary = {
      ok: true,
      mode: 'CREATE_PAUSED',
      apiCalls: true,
      mutations: true,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
      preflightResult: resolvedPath,
      campaign: {
        name: campaign.campaignName,
        status: 'PAUSED',
        dailyBudgetUsd: campaign.dailyBudgetUsd,
        adGroups: adGroups.length,
      },
      createdResources,
    };
    if (outputPath) {
      summary.outputPath = await writeResultArtifact(outputPath, summary);
    }

    if (outputJson) {
      console.log(JSON.stringify(summary, null, 2));
      return;
    }

    console.log('Create-paused completed.');
    console.log('API calls: enabled');
    console.log('Mutations: enabled');
    console.log(`Target customer: ${summary.targetCustomerId}`);
    console.log(`Campaign: ${summary.campaign.name}`);
    console.log(`Created resources: ${summary.createdResources.length}`);
    if (summary.outputPath) {
      console.log(`Result artifact: ${summary.outputPath}`);
    }
  } catch (error) {
    fail(error.message || String(error), outputJson, {
      mode: 'CREATE_PAUSED',
      apiCalls: true,
      mutations: createdResources.length > 0,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
      preflightResult: resolvedPath,
      createdResources,
    });
  }
}

main().catch((error) => {
  const outputJson = process.argv.includes('--json');
  fail(error.message || String(error), outputJson, {
    mode: 'CREATE_PAUSED_GUARD',
    apiCalls: false,
    mutations: false,
  });
});
