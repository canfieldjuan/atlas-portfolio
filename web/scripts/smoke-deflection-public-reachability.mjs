import { pathToFileURL } from 'node:url';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';

const DEFAULT_BASE_URL = 'https://juancanfield.com';
const LANDING_PATH = '/systems/support-ticket-deflection';
const INTAKE_PATH = '/systems/support-ticket-deflection/intake';
const INTAKE_HREF = `href="${INTAKE_PATH}"`;
const ERROR_MARKERS = ['Application error', 'This page could not be found', '404: This page could not be found'];
const LANDING_MARKERS = [
  ['productEyebrow', 'SUPPORT TICKET DEFLECTION'],
  ['snapshotCta', 'Upload your tickets, get a free Deflection Snapshot'],
  ['pricing', 'PRICING'],
];
const INTAKE_MARKERS = [
  ['uploadEyebrow', 'UPLOAD YOUR CSV'],
  ['headline', 'Upload your tickets. Get the repeat-question snapshot in 24 hours.'],
  ['workEmail', 'Work email'],
  ['submitCta', 'Upload CSV, get your free Deflection Snapshot'],
];

function printUsage() {
  console.log(`Deflection public reachability smoke

Usage:
  npm --prefix web run smoke:deflection-public-reachability -- \\
    --base-url https://juancanfield.com

  --base-url <url>   Hosted portfolio base URL (default: ${DEFAULT_BASE_URL})
  --json             Print machine-readable JSON
  --output <path>    Write the smoke artifact JSON`);
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

function markerMap(markers) {
  return Object.fromEntries(markers.map(([key]) => [key, true]));
}
async function fetchHtml(fetchImpl, url, stage) {
  let response;
  try {
    response = await fetchImpl(url, { cache: 'no-store' });
  } catch {
    return {
      ok: false,
      error: `Deflection public ${stage} page fetch failed before an HTTP response.`,
      stage,
      url,
    };
  }
  if (!response.ok) {
    return {
      ok: false,
      error: `Deflection public ${stage} page failed with HTTP ${response.status}.`,
      stage,
      url,
    };
  }
  return { ok: true, html: await response.text(), url };
}
function validateHtml(html, markers, stage, url) {
  const missing = markers.filter(([, label]) => !html.includes(label)).map(([key]) => key);
  if (missing.length === 0) {
    return { ok: true, markers: markerMap(markers) };
  }
  const errorMarker = ERROR_MARKERS.find((marker) => html.includes(marker));
  return {
    ok: false,
    error: errorMarker
      ? `Deflection public ${stage} page rendered an error marker: ${errorMarker}.`
      : `Deflection public ${stage} page is missing required render markers.`,
    stage,
    url,
    missing,
  };
}

async function checkPage(fetchImpl, url, stage, markers) {
  const fetched = await fetchHtml(fetchImpl, url, stage);
  if (!fetched.ok) return fetched;
  const rendered = validateHtml(fetched.html, markers, stage, url);
  return rendered.ok ? { ...rendered, html: fetched.html } : rendered;
}

export async function runDeflectionPublicReachabilitySmoke(options = {}, deps = {}) {
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const now = deps.now || (() => new Date().toISOString());
  const baseUrl = normalizeBaseUrl(options.baseUrl);

  if (!baseUrl) {
    return {
      ok: false,
      error: 'Deflection public reachability smoke base URL is invalid.',
      apiCalls: false,
    };
  }

  const landingUrl = `${baseUrl}${LANDING_PATH}`;
  const intakeUrl = `${baseUrl}${INTAKE_PATH}`;
  const landing = await checkPage(fetchImpl, landingUrl, 'landing', LANDING_MARKERS);
  if (!landing.ok) return { ...landing, apiCalls: true };
  if (!landing.html.includes(INTAKE_HREF)) {
    return {
      ok: false,
      error: 'Deflection public landing page is missing the CSV intake CTA href.',
      stage: 'landing',
      apiCalls: true,
      url: landingUrl,
      missing: ['intakeHref'],
    };
  }

  const intake = await checkPage(fetchImpl, intakeUrl, 'intake', INTAKE_MARKERS);
  if (!intake.ok) return { ...intake, apiCalls: true };

  return {
    ok: true,
    mode: 'DEFLECTION_PUBLIC_REACHABILITY_SMOKE',
    apiCalls: true,
    checkedAt: now(),
    baseUrl,
    landingUrl,
    intakeUrl,
    landingMarkers: { ...landing.markers, intakeHref: true },
    intakeMarkers: intake.markers,
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

  const result = await runDeflectionPublicReachabilitySmoke({
    baseUrl: parsed.values.get('--base-url') || DEFAULT_BASE_URL,
  });
  const artifactPath = outputPath
    ? await writeJsonArtifact(outputPath, result, { includeOutputPath: false })
    : '';

  if (!result.ok) fail(result.error, outputJson, result);
  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Deflection public reachability smoke passed.');
  console.log(`Landing URL: ${result.landingUrl}`);
  console.log(`Intake URL: ${result.intakeUrl}`);
  if (artifactPath) console.log(`Smoke artifact: ${artifactPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    fail(error.message || String(error), false, { apiCalls: false });
  });
}
