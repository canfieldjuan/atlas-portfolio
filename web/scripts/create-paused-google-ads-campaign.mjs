import { readFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { loadCampaignSpec, repoRoot } from './ads-spec-io.mjs';
import { googleAdsApiVersion, maskCustomerId, normalizeCustomerId, validateGoogleAdsEnv } from './google-ads-env.mjs';
import { loadLocalEnv } from './local-env.mjs';

function printUsage() {
  console.log(`Google Ads create-paused guard

Usage:
  npm run ads:google:create-paused -- --preflight-result <path> --confirm-create-paused
  npm run ads:google:create-paused -- --help

Required gates:
  1. ad spec must validate through ads:validate before this command is run
  2. Google Ads env must be complete
  3. --preflight-result must point at a successful ads:google:preflight -- --json output
  4. --confirm-create-paused must be present

Safety:
  This command is still a guard/skeleton. Google Ads mutation calls are intentionally not implemented yet.`);
}

function parseArgs(argv) {
  const args = new Map();
  const flags = new Set();

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith('--')) {
      continue;
    }

    const [name, inlineValue] = item.split('=', 2);
    if (inlineValue !== undefined) {
      args.set(name, inlineValue);
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      args.set(name, next);
      index += 1;
      continue;
    }

    flags.add(name);
  }

  return { args, flags };
}

function fail(message, outputJson, details = {}) {
  if (outputJson) {
    console.log(JSON.stringify({ ok: false, error: message, ...details }, null, 2));
  } else {
    console.error(message);
    if (details.missing?.length) {
      for (const name of details.missing) {
        console.error(`- ${name}`);
      }
    }
  }
  process.exit(1);
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
  if (payload?.targetCustomerId !== maskCustomerId(expectedCustomerId)) {
    errors.push('preflight target customer must match GOOGLE_ADS_CUSTOMER_ID');
  }

  return errors;
}

async function main() {
  await loadLocalEnv();

  const { args, flags } = parseArgs(process.argv.slice(2));
  const outputJson = flags.has('--json');

  if (flags.has('--help') || flags.has('-h')) {
    printUsage();
    return;
  }

  if (!flags.has('--confirm-create-paused')) {
    fail('Refusing to continue without --confirm-create-paused.', outputJson);
  }

  const preflightPath = args.get('--preflight-result');
  if (!preflightPath) {
    fail('Refusing to continue without --preflight-result <path>.', outputJson);
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

  const { campaign, adGroups } = await loadCampaignSpec();
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

  const summary = {
    ok: false,
    mode: 'CREATE_PAUSED_GUARD',
    apiCalls: false,
    mutations: false,
    mutationImplementation: 'not_implemented',
    apiVersion: googleAdsApiVersion(),
    targetCustomerId: maskCustomerId(customerId),
    preflightResult: resolvedPath,
    campaign: {
      name: campaign.campaignName,
      status: campaign.status,
      dailyBudgetUsd: campaign.dailyBudgetUsd,
      adGroups: adGroups.length,
    },
  };

  if (outputJson) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log('Create-paused guard passed, but mutation implementation is not present yet.');
    console.log('API calls: disabled');
    console.log('Mutations: disabled');
    console.log(`Target customer: ${summary.targetCustomerId}`);
    console.log(`Campaign: ${summary.campaign.name}`);
    console.log(`Ad groups: ${summary.campaign.adGroups}`);
    console.log(`Preflight result: ${summary.preflightResult}`);
  }

  process.exit(1);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
