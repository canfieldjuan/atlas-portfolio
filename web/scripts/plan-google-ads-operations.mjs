import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..');
const specDir = join(repoRoot, 'ads', 'content-workflow-audit');

const REQUIRED_GOOGLE_ADS_ENV = [
  'GOOGLE_ADS_DEVELOPER_TOKEN',
  'GOOGLE_ADS_CLIENT_ID',
  'GOOGLE_ADS_CLIENT_SECRET',
  'GOOGLE_ADS_REFRESH_TOKEN',
  'GOOGLE_ADS_CUSTOMER_ID',
];

const OPTIONAL_GOOGLE_ADS_ENV = ['GOOGLE_ADS_LOGIN_CUSTOMER_ID'];

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function readCsv(path) {
  const text = await readFile(path, 'utf8');
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((item) => item.trim());
  return lines
    .filter(Boolean)
    .map((line) => {
      const values = line.split(',').map((item) => item.trim());
      return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
    });
}

function runSpecValidator() {
  const result = spawnSync(process.execPath, [join(repoRoot, 'scripts', 'validate-ads-spec.mjs')], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exit(result.status || 1);
  }
}

function envValue(name) {
  return process.env[name]?.trim() || '';
}

function validateGoogleAdsEnv() {
  const missing = REQUIRED_GOOGLE_ADS_ENV.filter((name) => !envValue(name));
  return {
    ok: missing.length === 0,
    missing,
    present: [...REQUIRED_GOOGLE_ADS_ENV, ...OPTIONAL_GOOGLE_ADS_ENV].filter((name) => envValue(name)),
  };
}

function printEnvCheck(envStatus, outputJson) {
  const payload = {
    mode: 'ENV_CHECK',
    apiCalls: false,
    env: {
      checked: true,
      ok: envStatus.ok,
      present: envStatus.present,
      missing: envStatus.missing,
    },
  };

  if (outputJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log('Google Ads environment check');
  console.log('API calls: disabled');
  console.log('Spec validation: skipped');
  console.log(`Env ready: ${envStatus.ok ? 'yes' : 'no'}`);
  if (!envStatus.ok) {
    console.log(`Missing env: ${envStatus.missing.join(', ')}`);
  }
}

function plannedResourceName(prefix, name) {
  return `${prefix}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

async function buildPlan() {
  const campaign = await readJson(join(specDir, 'campaign.json'));
  const operations = [
    {
      operation: 'create_campaign_budget',
      status: 'ENABLED',
      name: plannedResourceName('budget', campaign.campaignName),
      amountMicros: Math.round(campaign.dailyBudgetUsd * 1_000_000),
    },
    {
      operation: 'create_campaign',
      status: campaign.status,
      name: campaign.campaignName,
      channel: campaign.channel,
      geoTargets: campaign.geoTargets,
      languageTargets: campaign.languageTargets,
      conversionGoal: campaign.conversionGoal,
      landingPage: campaign.landingPage,
    },
  ];

  for (const adGroup of campaign.adGroups) {
    const keywords = await readCsv(join(specDir, adGroup.keywordFile));
    const negatives = await readCsv(join(specDir, adGroup.negativeKeywordFile));
    const rsaAssets = await readJson(join(specDir, adGroup.responsiveSearchAdFile));

    operations.push({
      operation: 'create_ad_group',
      status: 'ENABLED',
      name: adGroup.name,
      campaignName: campaign.campaignName,
      defaultMaxCpcMicros: Math.round(adGroup.defaultMaxCpcUsd * 1_000_000),
    });

    operations.push({
      operation: 'create_keywords',
      adGroupName: adGroup.name,
      count: keywords.length,
      matchTypes: [...new Set(keywords.map((row) => row.match_type))].sort(),
      keywords,
    });

    operations.push({
      operation: 'create_negative_keywords',
      campaignName: campaign.campaignName,
      count: negatives.length,
      matchTypes: [...new Set(negatives.map((row) => row.match_type))].sort(),
      negativeKeywords: negatives,
    });

    operations.push({
      operation: 'create_responsive_search_ad',
      status: 'PAUSED',
      adGroupName: adGroup.name,
      finalUrl: rsaAssets.finalUrl,
      headlineCount: rsaAssets.headlines.length,
      descriptionCount: rsaAssets.descriptions.length,
      headlines: rsaAssets.headlines,
      descriptions: rsaAssets.descriptions,
    });
  }

  return { campaign, operations };
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const requireEnv = args.has('--check-env');
  const outputJson = args.has('--json');

  if (args.has('--execute')) {
    console.error('Execution is intentionally not implemented in this scaffold. This command is dry-run only.');
    process.exit(1);
  }

  const envStatus = validateGoogleAdsEnv();

  if (requireEnv) {
    printEnvCheck(envStatus, outputJson);
    process.exit(envStatus.ok ? 0 : 1);
  }

  runSpecValidator();

  const plan = await buildPlan();
  const payload = {
    mode: 'DRY_RUN',
    apiCalls: false,
    env: {
      checked: requireEnv,
      ok: envStatus.ok,
      present: envStatus.present,
      missing: envStatus.missing,
    },
    campaign: {
      name: plan.campaign.campaignName,
      status: plan.campaign.status,
      dailyBudgetUsd: plan.campaign.dailyBudgetUsd,
      maxInitialDailyBudgetUsd: plan.campaign.maxInitialDailyBudgetUsd,
    },
    operations: plan.operations,
  };

  if (outputJson) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log('Google Ads operation plan');
  console.log('Mode: DRY_RUN');
  console.log('API calls: disabled');
  console.log(`Campaign: ${payload.campaign.name}`);
  console.log(`Status: ${payload.campaign.status}`);
  console.log(`Budget: $${payload.campaign.dailyBudgetUsd}/day`);
  console.log(`Env checked: ${requireEnv ? 'yes' : 'no'}`);
  if (requireEnv || envStatus.present.length > 0) {
    console.log(`Env ready: ${envStatus.ok ? 'yes' : 'no'}`);
    if (!envStatus.ok) {
      console.log(`Missing env: ${envStatus.missing.join(', ')}`);
    }
  }
  console.log('');

  for (const [index, operation] of payload.operations.entries()) {
    console.log(`${index + 1}. ${operation.operation}`);
    if (operation.name) {
      console.log(`   name: ${operation.name}`);
    }
    if (operation.status) {
      console.log(`   status: ${operation.status}`);
    }
    if (typeof operation.count === 'number') {
      console.log(`   count: ${operation.count}`);
    }
    if (operation.finalUrl) {
      console.log(`   finalUrl: ${operation.finalUrl}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
