import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadCampaignSpec, repoRoot } from './ads-spec-io.mjs';
import { failCommand, parseArgs, readJsonArtifact, writeJsonArtifact } from './ads-cli-helpers.mjs';
import { artifactVersionFields, validateArtifactVersion } from './google-ads-artifact-contracts.mjs';
import {
  escapeGaqlString,
  googleAdsSearch,
  mutateGoogleAds,
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

function fail(message, outputJson, details = {}) {
  failCommand(message, outputJson, details, { sanitize: sanitizeGoogleAdsMessage });
}

// Pulls the trailing campaign ID from a Google Ads campaign resource name.
// Format: customers/<customer_id>/campaigns/<campaign_id>
// Returns '' when the input is missing or does not match.
function extractCampaignId(resourceName) {
  const match = String(resourceName || '').match(/\/campaigns\/(\d+)$/);
  return match ? match[1] : '';
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

function validatePreflightResult(payload, expectedCustomerId) {
  const errors = validateArtifactVersion(payload, 'preflight result');

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
    { includeMessage: true },
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
      // The operator-meaningful safety boundary is the CAMPAIGN status, which stays
      // PAUSED until ads:google:enable runs. Ad groups and ads are provisioned
      // ENABLED so that the moment the campaign flips, the hierarchy can actually
      // serve. Keeping the ads paused here would force an additional manual
      // ad-activation step the operator workflow does not currently encode, and
      // would leave the launch gate (status enableSafe) permanently red after every
      // fresh create-paused run.
      status: 'ENABLED',
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

async function main() {
  await loadLocalEnv();

  const { values: args, flags } = parseArgs(process.argv.slice(2));
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
      ...artifactVersionFields(),
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
      payload.outputPath = await writeJsonArtifact(outputPath, payload);
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
  const { payload: preflight, resolvedPath } = await readJsonArtifact(preflightPath);
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
    const accessToken = await refreshAccessToken({ includeMessage: true });
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
    const campaignId = extractCampaignId(campaignResourceName);
    if (!campaignId) {
      throw new Error(`Could not parse campaign id from resource name: ${maskResourceName(campaignResourceName)}`);
    }
    recordCreatedResource(createdResources, 'campaign', campaignResourceName);

    // Google Ads rejects mutate requests with zero operations. The spec may legitimately
    // omit geoTargets/languageTargets, so skip the call instead of forcing an API error.
    const criterionOperations = campaignCriterionOperations(campaignResourceName, campaign);
    if (criterionOperations.length > 0) {
      const criterionResults = await mutateGoogleAds(
        accessToken,
        apiVersion,
        customerId,
        'campaignCriteria',
        criterionOperations,
      );
      for (const item of criterionResults) {
        recordCreatedResource(createdResources, 'campaignCriterion', item.resourceName);
      }
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
      ...artifactVersionFields(),
      mode: 'CREATE_PAUSED',
      apiCalls: true,
      mutations: true,
      apiVersion,
      targetCustomerId: maskCustomerId(customerId),
      targetCustomerFingerprint: customerIdFingerprint(customerId),
      preflightResult: resolvedPath,
      campaign: {
        // Persisted so the readiness gate and the live enable command can resolve the
        // exact campaign by ID. Lookup-by-name with LIMIT 1 is unsafe when two campaigns
        // share a name — see the artifact contract v2 note.
        id: campaignId,
        name: campaign.campaignName,
        status: 'PAUSED',
        dailyBudgetUsd: campaign.dailyBudgetUsd,
        adGroups: adGroups.length,
      },
      createdResources,
    };
    if (outputPath) {
      summary.outputPath = await writeJsonArtifact(outputPath, summary);
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
      targetCustomerFingerprint: customerIdFingerprint(customerId),
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
