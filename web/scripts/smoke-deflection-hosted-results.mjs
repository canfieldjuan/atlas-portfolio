import { pathToFileURL } from 'node:url';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const DEFAULT_BASE_URL = 'https://juancanfield.com';
const RESULTS_PATH = '/systems/support-ticket-deflection/results';
const EXPECTED_RENDER_STATES = new Set(['snapshot', 'full-report', 'model-full-report']);
const DEFAULT_EXPECTED_STATE = 'snapshot';
const REQUIRED_SNAPSHOT_MARKERS = [
  { key: 'snapshotBadge', label: 'YOUR RESOLUTION AUDIT SNAPSHOT' },
  { key: 'headline', label: 'We found' },
  { key: 'supportTax', label: 'Support Tax projection' },
  { key: 'keywordReframe', label: 'Help-desk SEO targeting list' },
  { key: 'runRateComparison', label: 'This backlog at current pace' },
  { key: 'unlockCta', label: 'Unlock your full Resolution Audit' },
];
const REQUIRED_MODEL_FULL_REPORT_MARKERS = [
  { key: 'paidReportBadge', labels: ['FULL RESOLUTION AUDIT', 'FULL DEFLECTION REPORT'] },
  { key: 'paidHeadline', labels: ['Your Resolution Audit is ready.', 'Your Deflection Report is ready.'] },
  { key: 'reportContents', labels: ['Full audit dashboard', 'Full report dashboard'] },
  { key: 'priorityFixQueue', labels: ['Priority Fix Queue'] },
  { key: 'topUnresolvedRepeats', labels: ['Top Unresolved Repeats'] },
  { key: 'draftedResolutions', labels: ['Drafted Resolutions'] },
  { key: 'coveredRecurring', labels: ['Already Covered but Still Recurring'] },
  { key: 'backlogTable', labels: ['Backlog Table'] },
  { key: 'seoTargeting', labels: ['Help-desk SEO targeting list'] },
  { key: 'rankedQuestions', labels: ['Ranked question opportunities'] },
  { key: 'reviewerGuidance', labels: ['Top publishable answers and gaps'] },
];
const REQUIRED_LEGACY_FULL_REPORT_MARKERS = [
  { key: 'paidReportBadge', labels: ['FULL RESOLUTION AUDIT', 'FULL DEFLECTION REPORT'] },
  { key: 'paidHeadline', labels: ['Your Resolution Audit is ready.', 'Your Deflection Report is ready.'] },
  { key: 'reportContents', labels: ['Full audit contents', 'Full report contents'] },
  { key: 'seoTargeting', labels: ['Your Help-Desk SEO Targeting List', 'Help-desk SEO targeting list'] },
  { key: 'rankedQuestions', labels: ['Publishable Help-Center Copy', 'Ranked question opportunities'] },
  { key: 'reviewerGuidance', labels: ['Reviewer guidance', 'Top publishable answers and gaps'] },
];
const LOCKED_FULL_REPORT_MARKERS = ['Unlock your full Resolution Audit'];
const TEASER_ANSWER_LABEL = 'One drafted answer you can inspect before paying';
const ZERO_DRAFTED_SUMMARY_RE =
  /(?:^|[>\s])0(?:\s|<[^>]*>|<!--.*?-->)*of them already have a publishable answer drafted/;
const NO_DRAFTED_REPORT_COPY = 'built from your team';
const ERROR_MARKERS = [
  'Application error',
  'This page could not be found',
  '404: This page could not be found',
  'SNAPSHOT TEMPORARILY UNAVAILABLE',
];

function printUsage() {
  console.log(`Deflection hosted results smoke

Usage:
  npm --prefix web run smoke:deflection-hosted-results -- \\
    --request-id content-ops-...

Options:
  --base-url <url>   Hosted portfolio base URL (default: ${DEFAULT_BASE_URL})
  --expect <state>   Expected render state: snapshot, full-report, or model-full-report (default: snapshot)
  --json             Print machine-readable JSON
  --output <path>    Write the smoke artifact JSON

Safety:
  This fetches the public portfolio results page only. It does not call ATLAS,
  Stripe, or any private API.`);
}

function fail(message, outputJson, details = {}) {
  failCommand(message, outputJson, details, {
    sanitize: (value) => String(value || 'Unknown error.').slice(0, 300),
  });
}

function normalizeBaseUrl(value) {
  const raw = String(value || DEFAULT_BASE_URL).trim().replace(/\/$/, '');
  try {
    const url = new URL(raw);
    if (url.protocol !== 'https:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
      return null;
    }
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function resultUrl(baseUrl, requestId) {
  return `${baseUrl}${RESULTS_PATH}/${encodeURIComponent(requestId)}`;
}

function normalizeExpectedState(value) {
  const state = String(value || DEFAULT_EXPECTED_STATE).trim();
  return EXPECTED_RENDER_STATES.has(state) ? state : null;
}

function missingSnapshotMarkers(html) {
  const missing = REQUIRED_SNAPSHOT_MARKERS.filter((marker) => !html.includes(marker.label)).map(
    (marker) => marker.key,
  );
  if (!hasSnapshotAnswerState(html)) {
    missing.push('snapshotAnswerState');
  }
  return missing;
}

function hasSnapshotAnswerState(html) {
  if (html.includes(TEASER_ANSWER_LABEL)) return true;
  return ZERO_DRAFTED_SUMMARY_RE.test(html) && html.includes(NO_DRAFTED_REPORT_COPY);
}

function fullReportMarkersForExpectedState(expectedState, html) {
  if (expectedState === 'model-full-report') return REQUIRED_MODEL_FULL_REPORT_MARKERS;
  return fullReportMarkers(html);
}

function missingFullReportMarkers(expectedState, html) {
  return fullReportMarkersForExpectedState(expectedState, html).filter((marker) => !marker.labels.some((label) => html.includes(label))).map(
    (marker) => marker.key,
  );
}

function fullReportMarkers(html) {
  if (
    html.includes('Full audit dashboard') ||
    html.includes('Full report dashboard')
  ) {
    return REQUIRED_MODEL_FULL_REPORT_MARKERS;
  }
  return REQUIRED_LEGACY_FULL_REPORT_MARKERS;
}

function lockedFullReportMarkers(html) {
  return LOCKED_FULL_REPORT_MARKERS.filter((marker) => html.includes(marker));
}

function markerResult(expectedState, html = '') {
  if (expectedState === 'full-report' || expectedState === 'model-full-report') {
    return Object.fromEntries(fullReportMarkersForExpectedState(expectedState, html).map((marker) => [marker.key, true]));
  }
  return {
    ...Object.fromEntries(REQUIRED_SNAPSHOT_MARKERS.map((marker) => [marker.key, true])),
    snapshotAnswerState: true,
  };
}

function renderedErrorMarker(html, missing) {
  if (missing.length === 0) return undefined;
  const pageShellMissing = missing.includes('snapshotBadge') || missing.includes('headline');
  if (!pageShellMissing) return undefined;
  return ERROR_MARKERS.find((marker) => html.includes(marker));
}

export async function runDeflectionHostedResultsSmoke(options, deps = {}) {
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const now = deps.now || (() => new Date().toISOString());
  const requestId = String(options.requestId || '').trim();
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const expectedState = normalizeExpectedState(options.expect || options.expectedState);

  if (!REQUEST_ID_RE.test(requestId)) {
    return {
      ok: false,
      error: 'Hosted results smoke request id is invalid.',
      apiCalls: false,
      requestId,
    };
  }
  if (!expectedState) {
    return {
      ok: false,
      error: 'Hosted results smoke expected state is invalid.',
      apiCalls: false,
      requestId,
    };
  }
  if (!baseUrl) {
    return {
      ok: false,
      error: 'Hosted results smoke base URL is invalid.',
      apiCalls: false,
      requestId,
    };
  }

  const url = resultUrl(baseUrl, requestId);
  let response;
  try {
    response = await fetchImpl(url, { cache: 'no-store' });
  } catch {
    return {
      ok: false,
      error: 'Hosted results page fetch failed before an HTTP response.',
      stage: 'fetch',
      apiCalls: true,
      requestId,
      url,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `Hosted results page failed with HTTP ${response.status}.`,
      stage: 'fetch',
      apiCalls: true,
      requestId,
      url,
    };
  }

  const html = await response.text();
  const expectsFullReport = expectedState === 'full-report' || expectedState === 'model-full-report';
  const missing = expectsFullReport ? missingFullReportMarkers(expectedState, html) : missingSnapshotMarkers(html);
  const lockedMarkers = expectsFullReport ? lockedFullReportMarkers(html) : [];
  if (missing.length > 0) {
    const errorMarker = renderedErrorMarker(html, missing);
    return {
      ok: false,
      error: errorMarker
        ? `Hosted results page rendered an error marker: ${errorMarker}.`
        : 'Hosted results page is missing required render markers.',
      stage: 'render',
      apiCalls: true,
      requestId,
      url,
      expectedState,
      missing,
    };
  }
  if (lockedMarkers.length > 0) {
    return {
      ok: false,
      error: 'Hosted results page rendered the locked snapshot instead of the full report.',
      stage: 'render',
      apiCalls: true,
      requestId,
      url,
      expectedState,
      missing,
      lockedMarkers,
    };
  }

  return {
    ok: true,
    mode: 'DEFLECTION_HOSTED_RESULTS_SMOKE',
    expectedState,
    apiCalls: true,
    checkedAt: now(),
    requestId,
    url,
    markers: markerResult(expectedState, html),
  };
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const outputJson = parsed.flags.has('--json');
  const outputPath = parsed.values.get('--output');

  if (parsed.flags.has('--help') || parsed.flags.has('-h')) {
    printUsage();
    return;
  }
  if (isBareFlag(parsed, '--output')) {
    fail('Refusing to continue without --output <path>.', outputJson);
  }
  if (isBareFlag(parsed, '--request-id') || !parsed.values.get('--request-id')?.trim()) {
    fail('Deflection hosted results smoke is missing --request-id.', outputJson, {
      apiCalls: false,
    });
  }
  if (isBareFlag(parsed, '--expect')) {
    fail('Refusing to continue without --expect <state>.', outputJson, {
      apiCalls: false,
    });
  }

  const result = await runDeflectionHostedResultsSmoke({
    requestId: parsed.values.get('--request-id'),
    baseUrl: parsed.values.get('--base-url') || DEFAULT_BASE_URL,
    expect: parsed.values.get('--expect') || DEFAULT_EXPECTED_STATE,
  });
  const artifactPath = outputPath
    ? await writeJsonArtifact(outputPath, result, { includeOutputPath: false })
    : '';

  if (!result.ok) {
    fail(result.error, outputJson, result);
  }
  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Deflection hosted results smoke passed.');
  console.log(`Results URL: ${result.url}`);
  if (artifactPath) {
    console.log(`Smoke artifact: ${artifactPath}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    fail(error.message || String(error), false, {
      apiCalls: false,
    });
  });
}
