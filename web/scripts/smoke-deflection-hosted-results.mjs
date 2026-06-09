import { pathToFileURL } from 'node:url';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';

const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const DEFAULT_BASE_URL = 'https://juancanfield.com';
const RESULTS_PATH = '/systems/support-ticket-deflection/results';
const REQUIRED_MARKERS = [
  { key: 'snapshotBadge', label: 'YOUR DEFLECTION SNAPSHOT' },
  { key: 'headline', label: 'We found' },
  { key: 'supportTax', label: 'Support Tax projection' },
  { key: 'keywordReframe', label: 'Help-desk SEO targeting list' },
  { key: 'runRateComparison', label: 'This backlog at current pace' },
  { key: 'unlockCta', label: 'Unlock your full Backlog Report' },
];
const SNAPSHOT_ANSWER_STATE_MARKERS = [
  { key: 'teaserAnswer', label: 'One drafted answer you can inspect before paying' },
  { key: 'noProvenAnswer', label: 'no proven answer yet' },
];
const ERROR_MARKERS = ['Application error', 'This page could not be found', '404: This page could not be found'];

function printUsage() {
  console.log(`Deflection hosted results smoke

Usage:
  npm --prefix web run smoke:deflection-hosted-results -- \\
    --request-id content-ops-...

Options:
  --base-url <url>   Hosted portfolio base URL (default: ${DEFAULT_BASE_URL})
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

function missingMarkers(html) {
  const missing = REQUIRED_MARKERS.filter((marker) => !html.includes(marker.label)).map((marker) => marker.key);
  if (!SNAPSHOT_ANSWER_STATE_MARKERS.some((marker) => html.includes(marker.label))) {
    missing.push('snapshotAnswerState');
  }
  return missing;
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

  if (!REQUEST_ID_RE.test(requestId)) {
    return {
      ok: false,
      error: 'Hosted results smoke request id is invalid.',
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
  const missing = missingMarkers(html);
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
      missing,
    };
  }

  return {
    ok: true,
    mode: 'DEFLECTION_HOSTED_RESULTS_SMOKE',
    apiCalls: true,
    checkedAt: now(),
    requestId,
    url,
    markers: {
      ...Object.fromEntries(REQUIRED_MARKERS.map((marker) => [marker.key, true])),
      snapshotAnswerState: true,
    },
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

  const result = await runDeflectionHostedResultsSmoke({
    requestId: parsed.values.get('--request-id'),
    baseUrl: parsed.values.get('--base-url') || DEFAULT_BASE_URL,
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
