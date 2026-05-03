import { failCommand, parseArgs, readJsonArtifact, writeJsonArtifact } from './ads-cli-helpers.mjs';

function printUsage() {
  console.log(`Advertising funnel report combiner

Usage:
  npm run ads:report:combine -- --google-ads-report /tmp/google-ads-performance.json --ga4-report /tmp/ga4-performance.json
  npm run ads:report:combine -- --google-ads-report /tmp/google-ads-performance.json --ga4-report /tmp/ga4-performance.json --json
  npm run ads:report:combine -- --google-ads-report /tmp/google-ads-performance.json --ga4-report /tmp/ga4-performance.json --output /tmp/advertising-funnel.json

Safety:
  This command is offline. It reads existing report artifacts and writes a combined summary; it makes no API calls.`);
}

function fail(message, outputJson, details = {}) {
  failCommand(message, outputJson, details);
}

function numericValue(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function ratio(numerator, denominator) {
  return denominator > 0 ? numerator / denominator : 0;
}

function moneyRatio(numerator, denominator) {
  return Math.round(ratio(numerator, denominator) * 100) / 100;
}

function validateGoogleAdsReport(payload) {
  const errors = [];
  if (payload?.ok !== true) {
    errors.push('Google Ads report must have ok=true');
  }
  if (!['GOOGLE_ADS_PERFORMANCE_REPORT', 'GOOGLE_ADS_PERFORMANCE_DRY_RUN'].includes(payload?.mode)) {
    errors.push('Google Ads report mode must be GOOGLE_ADS_PERFORMANCE_REPORT or GOOGLE_ADS_PERFORMANCE_DRY_RUN');
  }
  if (!payload?.dateRange?.startDate || !payload?.dateRange?.endDate) {
    errors.push('Google Ads report must include dateRange.startDate and dateRange.endDate');
  }
  if (!payload?.totals || typeof payload.totals !== 'object') {
    errors.push('Google Ads report must include totals');
  }
  return errors;
}

function validateGa4Report(payload) {
  const errors = [];
  if (payload?.ok !== true) {
    errors.push('GA4 report must have ok=true');
  }
  if (!['GA4_PERFORMANCE_REPORT', 'GA4_PERFORMANCE_DRY_RUN'].includes(payload?.mode)) {
    errors.push('GA4 report mode must be GA4_PERFORMANCE_REPORT or GA4_PERFORMANCE_DRY_RUN');
  }
  if (!payload?.dateRange?.startDate || !payload?.dateRange?.endDate) {
    errors.push('GA4 report must include dateRange.startDate and dateRange.endDate');
  }
  if (!payload?.landingPageReport?.totals || !payload?.conversionEventReport?.totals) {
    errors.push('GA4 report must include landingPageReport.totals and conversionEventReport.totals');
  }
  return errors;
}

function buildCombinedReport(googleAds, ga4, paths) {
  const adTotals = googleAds.totals || {};
  const landingTotals = ga4.landingPageReport?.totals || {};
  const conversionTotals = ga4.conversionEventReport?.totals || {};
  const clicks = numericValue(adTotals.clicks);
  const sessions = numericValue(landingTotals.sessions);
  const auditRequests = numericValue(conversionTotals.eventCount);
  const costUsd = numericValue(adTotals.costUsd);

  return {
    ok: true,
    mode: 'ADVERTISING_FUNNEL_REPORT',
    apiCalls: false,
    mutations: false,
    sources: {
      googleAdsReport: paths.googleAdsReport,
      ga4Report: paths.ga4Report,
      googleAdsMode: googleAds.mode,
      ga4Mode: ga4.mode,
    },
    campaignName: googleAds.campaignName || '',
    landingPage: ga4.landingPage || '',
    conversionEvent: ga4.conversionEvent || '',
    dateRange: {
      googleAds: googleAds.dateRange,
      ga4: ga4.dateRange,
      aligned: googleAds.dateRange?.startDate === ga4.dateRange?.startDate && googleAds.dateRange?.endDate === ga4.dateRange?.endDate,
    },
    funnel: {
      impressions: numericValue(adTotals.impressions),
      clicks,
      costUsd,
      landingSessions: sessions,
      landingActiveUsers: numericValue(landingTotals.activeUsers),
      auditRequests,
      googleAdsConversions: numericValue(adTotals.conversions),
    },
    rates: {
      ctr: ratio(clicks, numericValue(adTotals.impressions)),
      clickToSessionRate: ratio(sessions, clicks),
      auditRequestRateFromSessions: ratio(auditRequests, sessions),
      auditRequestRateFromClicks: ratio(auditRequests, clicks),
      costPerClickUsd: moneyRatio(costUsd, clicks),
      costPerAuditRequestUsd: moneyRatio(costUsd, auditRequests),
    },
  };
}

function printTextReport(payload) {
  console.log('Advertising funnel report');
  console.log(`Campaign: ${payload.campaignName || '(not provided)'}`);
  console.log(`Landing page: ${payload.landingPage || '(not provided)'}`);
  console.log(`Date ranges aligned: ${payload.dateRange.aligned ? 'yes' : 'no'}`);
  console.log(`Impressions: ${payload.funnel.impressions}`);
  console.log(`Clicks: ${payload.funnel.clicks}`);
  console.log(`Cost: $${payload.funnel.costUsd}`);
  console.log(`Landing sessions: ${payload.funnel.landingSessions}`);
  console.log(`Audit requests: ${payload.funnel.auditRequests}`);
  console.log(`Cost per audit request: $${payload.rates.costPerAuditRequestUsd}`);
  if (payload.outputPath) {
    console.log(`Combined artifact: ${payload.outputPath}`);
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

  const googleAdsReportPath = values.get('--google-ads-report');
  const ga4ReportPath = values.get('--ga4-report');
  if (!googleAdsReportPath || !ga4ReportPath) {
    fail('Refusing to continue without --google-ads-report <path> and --ga4-report <path>.', outputJson);
  }

  try {
    const [{ payload: googleAds, resolvedPath: googleAdsPath }, { payload: ga4, resolvedPath: ga4Path }] = await Promise.all([
      readJsonArtifact(googleAdsReportPath),
      readJsonArtifact(ga4ReportPath),
    ]);
    const errors = [...validateGoogleAdsReport(googleAds), ...validateGa4Report(ga4)];
    if (errors.length > 0) {
      fail('Report artifacts are not valid for advertising funnel summary.', outputJson, { errors });
    }

    const payload = buildCombinedReport(googleAds, ga4, {
      googleAdsReport: googleAdsPath,
      ga4Report: ga4Path,
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
      mode: 'ADVERTISING_FUNNEL_REPORT',
      apiCalls: false,
      mutations: false,
    });
  }
}

main().catch((error) => {
  const outputJson = process.argv.includes('--json');
  fail(error.message || String(error), outputJson, {
    mode: 'ADVERTISING_FUNNEL_REPORT',
    apiCalls: false,
    mutations: false,
  });
});
