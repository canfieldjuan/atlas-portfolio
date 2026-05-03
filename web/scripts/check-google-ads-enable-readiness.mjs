import { failCommand, parseArgs, readJsonArtifact, writeJsonArtifact } from './ads-cli-helpers.mjs';

const REQUIRED_CONFIRMATIONS = [
  {
    flag: '--confirm-assets-reviewed',
    key: 'assetsReviewed',
    label: 'Google Ads assets, keywords, and final URL were reviewed in the Google Ads UI',
  },
  {
    flag: '--confirm-budget-reviewed',
    key: 'budgetReviewed',
    label: 'Daily budget and CPC bids were reviewed against the approved launch budget',
  },
  {
    flag: '--confirm-conversion-tracking-reviewed',
    key: 'conversionTrackingReviewed',
    label: 'GA4 / audit_request_submitted conversion tracking was reviewed',
  },
  {
    flag: '--confirm-negative-keywords-reviewed',
    key: 'negativeKeywordsReviewed',
    label: 'Negative keywords were reviewed for obvious waste and brand-risk terms',
  },
];

function printUsage() {
  console.log(`Google Ads enablement readiness gate

Usage:
  npm run ads:google:enable-check -- --create-result /tmp/google-ads-create-paused-result.json \\
    --confirm-assets-reviewed \\
    --confirm-budget-reviewed \\
    --confirm-conversion-tracking-reviewed \\
    --confirm-negative-keywords-reviewed

Optional:
  --funnel-report <path>  Include a combined Google Ads + GA4 funnel artifact for context
  --output <path>         Write the readiness artifact
  --json                  Print machine-readable JSON

Safety:
  This command is offline. It reads artifacts and records human approval state; it does not enable campaigns or call Google Ads APIs.`);
}

function fail(message, outputJson, details = {}) {
  failCommand(message, outputJson, details);
}

function requiredResourceTypes(resources) {
  return new Set((resources || []).map((item) => item?.type).filter(Boolean));
}

function validateCreateResult(payload) {
  const errors = [];
  if (payload?.ok !== true) {
    errors.push('Create result must have ok=true');
  }
  if (payload?.mode !== 'CREATE_PAUSED') {
    errors.push('Create result must have mode=CREATE_PAUSED; dry-run plans are not launch-ready artifacts');
  }
  if (payload?.mutations !== true || payload?.apiCalls !== true) {
    errors.push('Create result must show apiCalls=true and mutations=true');
  }
  if (payload?.campaign?.status !== 'PAUSED') {
    errors.push('Created campaign must still be recorded as PAUSED');
  }

  const resourceTypes = requiredResourceTypes(payload?.createdResources);
  for (const type of ['campaignBudget', 'campaign', 'adGroup', 'keyword', 'negativeKeyword', 'responsiveSearchAd']) {
    if (!resourceTypes.has(type)) {
      errors.push(`Create result missing created resource type: ${type}`);
    }
  }
  return errors;
}

function validateFunnelReport(payload) {
  const errors = [];
  if (payload?.ok !== true) {
    errors.push('Funnel report must have ok=true');
  }
  if (payload?.mode !== 'ADVERTISING_FUNNEL_REPORT') {
    errors.push('Funnel report must have mode=ADVERTISING_FUNNEL_REPORT');
  }
  if (payload?.apiCalls !== false || payload?.mutations !== false) {
    errors.push('Funnel report must be an offline artifact with apiCalls=false and mutations=false');
  }
  if (payload?.dateRange?.aligned !== true) {
    errors.push('Funnel report must have aligned Google Ads and GA4 date ranges');
  }
  return errors;
}

function confirmationState(flags) {
  return Object.fromEntries(REQUIRED_CONFIRMATIONS.map((item) => [item.key, flags.has(item.flag)]));
}

function missingConfirmations(flags) {
  return REQUIRED_CONFIRMATIONS.filter((item) => !flags.has(item.flag)).map((item) => `${item.flag}: ${item.label}`);
}

function buildReadinessPayload({ createResult, createResultPath, funnelReport, funnelReportPath, confirmations }) {
  return {
    ok: true,
    mode: 'GOOGLE_ADS_ENABLEMENT_READINESS',
    apiCalls: false,
    mutations: false,
    readyForEnablement: true,
    createResult: {
      path: createResultPath,
      campaignName: createResult.campaign?.name || '',
      campaignStatus: createResult.campaign?.status || '',
      dailyBudgetUsd: createResult.campaign?.dailyBudgetUsd ?? null,
      createdResourceCount: createResult.createdResources?.length || 0,
    },
    funnelReport: funnelReport
      ? {
          path: funnelReportPath,
          dateRange: funnelReport.dateRange,
          funnel: funnelReport.funnel,
          rates: funnelReport.rates,
        }
      : null,
    confirmations,
  };
}

function printTextReport(payload) {
  console.log('Google Ads enablement readiness');
  console.log(`Ready for enablement: ${payload.readyForEnablement ? 'yes' : 'no'}`);
  console.log(`Campaign: ${payload.createResult.campaignName}`);
  console.log(`Campaign status: ${payload.createResult.campaignStatus}`);
  console.log(`Created resources: ${payload.createResult.createdResourceCount}`);
  console.log(`Funnel report attached: ${payload.funnelReport ? 'yes' : 'no'}`);
  if (payload.outputPath) {
    console.log(`Readiness artifact: ${payload.outputPath}`);
  }
}

async function main() {
  const { values, flags } = parseArgs(process.argv.slice(2));
  const outputJson = flags.has('--json');
  const outputPath = values.get('--output');

  if (flags.has('--help') || flags.has('-h')) {
    printUsage();
    return;
  }
  if ((flags.has('--output') || values.has('--output')) && !outputPath) {
    fail('Refusing to continue without --output <path>.', outputJson);
  }

  const createResultPath = values.get('--create-result');
  if (!createResultPath) {
    fail('Refusing to continue without --create-result <path>.', outputJson);
  }

  try {
    const [{ payload: createResult, resolvedPath }] = await Promise.all([readJsonArtifact(createResultPath)]);
    const errors = [...validateCreateResult(createResult), ...missingConfirmations(flags)];
    let funnelReport = null;
    let funnelReportPath = '';

    if (values.has('--funnel-report')) {
      const { payload, resolvedPath: resolvedFunnelPath } = await readJsonArtifact(values.get('--funnel-report'));
      funnelReport = payload;
      funnelReportPath = resolvedFunnelPath;
      errors.push(...validateFunnelReport(payload));
    }

    if (errors.length > 0) {
      fail('Google Ads campaign is not ready for enablement.', outputJson, {
        mode: 'GOOGLE_ADS_ENABLEMENT_READINESS',
        apiCalls: false,
        mutations: false,
        readyForEnablement: false,
        errors,
      });
    }

    const payload = buildReadinessPayload({
      createResult,
      createResultPath: resolvedPath,
      funnelReport,
      funnelReportPath,
      confirmations: confirmationState(flags),
    });

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
      mode: 'GOOGLE_ADS_ENABLEMENT_READINESS',
      apiCalls: false,
      mutations: false,
      readyForEnablement: false,
    });
  }
}

main().catch((error) => {
  const outputJson = process.argv.includes('--json');
  fail(error.message || String(error), outputJson, {
    mode: 'GOOGLE_ADS_ENABLEMENT_READINESS',
    apiCalls: false,
    mutations: false,
    readyForEnablement: false,
  });
});
