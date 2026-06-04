import { pathToFileURL } from 'node:url';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';

const DEFAULT_BASE_URL = 'https://juancanfield.com';
const SNAPSHOT_PATH = '/systems/support-ticket-deflection/snapshot';
const INTAKE_PATH = '/systems/support-ticket-deflection/intake';
const INTAKE_HREF = `href="${INTAKE_PATH}"`;
const ERROR_MARKERS = ['Application error', 'This page could not be found', '404: This page could not be found'];
const REQUIRED_MARKERS = [
  ['snapshotBadge', 'Free Deflection Snapshot'],
  ['promiseHeadline', 'Turn repeat support tickets into help-center answers your team can publish.'],
  ['beforeAfterProof', 'BEFORE / AFTER SNAPSHOT PROOF'],
  ['snapshotAction', 'Snapshot action'],
  ['snapshotFirst', 'Snapshot comes before any paid report'],
  ['finalSnapshotAsk', 'The only ask on this page is the CSV upload'],
  ['ctaLabel', 'Get my free Deflection Snapshot'],
];
const FORBIDDEN_MARKERS = [
  ['fullReportUnlockMetric', 'Full report unlock'],
  ['paidReportPurchase', 'paid report purchase'],
  ['paidUnlockClaim', 'the full report is the paid unlock'],
  ['vagueRoiClaim', 'vague ROI claim'],
];

function printUsage() {
  console.log(`Deflection Snapshot landing smoke

Usage: npm --prefix web run smoke:deflection-snapshot-landing -- --base-url https://juancanfield.com
Options: --base-url <url> (default: ${DEFAULT_BASE_URL}); --json; --output <path>
Safety: fetches the public Snapshot landing page only; no ATLAS, Stripe, or private API calls.`);
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

function validateSnapshotLandingHtml(html, url) {
  const missing = REQUIRED_MARKERS.filter(([, label]) => !html.includes(label)).map(([key]) => key);
  if (!html.includes(INTAKE_HREF)) missing.push('intakeHref');

  const forbidden = FORBIDDEN_MARKERS.filter(([, label]) => html.includes(label)).map(([key]) => key);

  if (missing.length === 0 && forbidden.length === 0) {
    return {
      ok: true,
      markers: Object.fromEntries([...REQUIRED_MARKERS.map(([key]) => [key, true]), ['intakeHref', true]]),
    };
  }

  const errorMarker = ERROR_MARKERS.find((marker) => html.includes(marker));
  return {
    ok: false,
    error: errorMarker
      ? `Snapshot landing page rendered an error marker: ${errorMarker}.`
      : forbidden.length > 0
        ? 'Snapshot landing page rendered forbidden paid-report-first copy.'
        : 'Snapshot landing page is missing required render markers.',
    stage: 'render',
    url,
    missing,
    forbidden,
  };
}

export async function runDeflectionSnapshotLandingSmoke(options = {}, deps = {}) {
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const now = deps.now || (() => new Date().toISOString());
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  if (!baseUrl) {
    return {
      ok: false,
      error: 'Deflection Snapshot landing smoke base URL is invalid.',
      apiCalls: false,
    };
  }

  const url = `${baseUrl}${SNAPSHOT_PATH}`;
  let response;
  try {
    response = await fetchImpl(url, { cache: 'no-store' });
  } catch {
    return {
      ok: false,
      error: 'Snapshot landing page fetch failed before an HTTP response.',
      stage: 'fetch',
      apiCalls: true,
      url,
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      error: `Snapshot landing page failed with HTTP ${response.status}.`,
      stage: 'fetch',
      apiCalls: true,
      url,
    };
  }

  const html = await response.text();
  const rendered = validateSnapshotLandingHtml(html, url);
  if (!rendered.ok) {
    return { ...rendered, apiCalls: true };
  }

  return {
    ok: true,
    mode: 'DEFLECTION_SNAPSHOT_LANDING_SMOKE',
    apiCalls: true,
    checkedAt: now(),
    baseUrl,
    url,
    markers: rendered.markers,
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

  const result = await runDeflectionSnapshotLandingSmoke({ baseUrl: parsed.values.get('--base-url') || DEFAULT_BASE_URL });
  const artifactPath = outputPath ? await writeJsonArtifact(outputPath, result, { includeOutputPath: false }) : '';

  if (!result.ok) fail(result.error, outputJson, result);
  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Deflection Snapshot landing smoke passed.');
  console.log(`Snapshot URL: ${result.url}`);
  if (artifactPath) console.log(`Smoke artifact: ${artifactPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    fail(error.message || String(error), false, { apiCalls: false });
  });
}
