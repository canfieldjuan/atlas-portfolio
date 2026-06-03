import { randomUUID } from 'node:crypto';
import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { failCommand, isBareFlag, parseArgs, writeJsonArtifact } from './ads-cli-helpers.mjs';

const execFile = promisify(execFileCallback);
const REQUEST_ID_RE = /^[A-Za-z0-9._-]{1,128}$/;
const ATTEMPT_ID_RE = /^[A-Za-z0-9._:-]{8,160}$/;
const DEFAULT_BASE_URL = 'https://juancanfield.com';
const CHECKOUT_PATH = '/api/deflection-checkout';
const STATUS_PATH = '/api/deflection-report-status';
const RESULTS_PATH = '/systems/support-ticket-deflection/results';
const DEFAULT_MAX_WAIT_MS = 120_000;
const DEFAULT_POLL_MS = 5_000;
const VERCEL_CURL_STATUS_MARKER = '__ATLAS_HTTP_STATUS__:';
const REQUIRED_PAID_MARKERS = [
  { key: 'fullReportBadge', label: 'FULL BACKLOG REPORT' },
  { key: 'paidHeadline', label: 'Your complete Support Tax report is ready.' },
  { key: 'reportContents', label: 'Paid report contents' },
  { key: 'seoTargeting', label: 'Your Help-Desk SEO Targeting List' },
  { key: 'publishableCopy', label: 'Publishable Help-Center Copy' },
  { key: 'reviewerGuidance', label: 'Reviewer guidance' },
];
const LOCKED_MARKERS = ['Unlock your full Backlog Report'];

function printUsage() {
  console.log(`Deflection paid unlock smoke

Usage:
  npm --prefix web run smoke:deflection-paid-unlock -- \\
    --request-id content-ops-...

Options:
  --attempt-id <id>           Explicit Checkout attempt id (default: generated)
  --base-url <url>            Hosted portfolio base URL (default: ${DEFAULT_BASE_URL})
  --max-wait-ms <ms>          Unlock polling timeout (default: ${DEFAULT_MAX_WAIT_MS})
  --poll-ms <ms>              Unlock polling interval (default: ${DEFAULT_POLL_MS})
  --vercel-curl               Route hosted requests through "vercel curl"
  --vercel-deployment <id|url> Deployment for vercel curl (default: --base-url)
  --allow-live-checkout       Do not fail closed on cs_live_ Checkout URLs
  --require-unlocked          Fail if the report is locked instead of creating Checkout
  --json                      Print machine-readable JSON
  --output <path>             Write the smoke artifact JSON

Safety:
  This smoke does not use Stripe secrets, fake webhooks, or call privileged ATLAS
  paid routes. It waits for the real Stripe webhook unlock and refuses live-mode
  Checkout URLs unless --allow-live-checkout is passed explicitly.`);
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

function headerPairs(headers) {
  if (!headers) return [];
  if (headers instanceof Headers) return [...headers.entries()];
  if (Array.isArray(headers)) {
    return headers.map(([name, value]) => [String(name), String(value)]);
  }
  return Object.entries(headers).map(([name, value]) => [String(name), String(value)]);
}

function parseVercelCurlOutput(stdout) {
  const raw = String(stdout ?? '');
  const markerIndex = raw.lastIndexOf(VERCEL_CURL_STATUS_MARKER);
  if (markerIndex < 0) {
    throw new Error('vercel curl did not return an HTTP status marker.');
  }
  const body = raw.slice(0, markerIndex).replace(/\n$/, '');
  const status = Number(raw.slice(markerIndex + VERCEL_CURL_STATUS_MARKER.length).trim());
  if (!Number.isInteger(status) || status < 100 || status > 599) {
    throw new Error('vercel curl returned an invalid HTTP status.');
  }
  return { body, status };
}

export function makeVercelCurlFetch({ deployment, execFileImpl = execFile, cwd = process.cwd() } = {}) {
  const targetDeployment = String(deployment || '').trim();
  if (!targetDeployment) {
    throw new Error('vercel curl transport requires a deployment id or URL.');
  }

  return async function vercelCurlFetch(url, init = {}) {
    const parsed = new URL(String(url));
    const method = String(init.method || 'GET').toUpperCase();
    const args = [
      'curl',
      `${parsed.pathname}${parsed.search}`,
      '--deployment',
      targetDeployment,
      '--',
      '--request',
      method,
      '--silent',
      '--show-error',
      '--write-out',
      `\n${VERCEL_CURL_STATUS_MARKER}%{http_code}`,
    ];

    for (const [name, value] of headerPairs(init.headers)) {
      args.push('--header', `${name}: ${value}`);
    }
    if (init.body !== undefined && init.body !== null) {
      args.push('--data-binary', String(init.body));
    }

    const { stdout } = await execFileImpl('vercel', args, { cwd, maxBuffer: 8 * 1024 * 1024 });
    const result = parseVercelCurlOutput(stdout);
    return new Response(result.body, { status: result.status });
  };
}

function parsePositiveInteger(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function statusUrl(baseUrl, requestId) {
  return `${baseUrl}${STATUS_PATH}?requestId=${encodeURIComponent(requestId)}`;
}

function resultUrl(baseUrl, requestId) {
  return `${baseUrl}${RESULTS_PATH}/${encodeURIComponent(requestId)}`;
}

async function jsonOrNull(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function readStatus(fetchImpl, baseUrl, requestId) {
  const url = statusUrl(baseUrl, requestId);
  let response;
  try {
    response = await fetchImpl(url, { cache: 'no-store' });
  } catch {
    return { ok: false, error: 'Report status failed before an HTTP response.', url };
  }
  const body = await jsonOrNull(response);
  if (!response.ok) {
    return {
      ok: false,
      error: `Report status failed with HTTP ${response.status}.`,
      url,
      statusCode: response.status,
    };
  }
  if (body?.status !== 'locked' && body?.status !== 'unlocked') {
    return { ok: false, error: 'Report status returned an invalid envelope.', url };
  }
  return { ok: true, status: body.status, url };
}

function classifyCheckoutUrl(value) {
  if (typeof value !== 'string' || !value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'checkout.stripe.com') return null;
    const sessionMatch = decodeURIComponent(url.pathname).match(/\bcs_(test|live)_[A-Za-z0-9]+/);
    if (!sessionMatch) return { url: value, mode: 'unknown' };
    return { url: value, mode: sessionMatch[1] };
  } catch {
    return null;
  }
}

async function createCheckout(fetchImpl, baseUrl, requestId, attemptId) {
  const url = `${baseUrl}${CHECKOUT_PATH}`;
  let response;
  try {
    response = await fetchImpl(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, attemptId }),
      cache: 'no-store',
    });
  } catch {
    return { ok: false, error: 'Checkout route failed before an HTTP response.', url };
  }
  const body = await jsonOrNull(response);
  if (!response.ok) {
    return { ok: false, error: `Checkout route failed with HTTP ${response.status}.`, url };
  }
  if (body?.alreadyPaid === true) {
    return { ok: true, alreadyPaid: true, url };
  }
  const checkout = classifyCheckoutUrl(body?.url);
  if (!checkout) {
    return { ok: false, error: 'Checkout route did not return a Stripe Checkout URL.', url };
  }
  return {
    ok: true,
    alreadyPaid: false,
    url,
    checkoutUrl: checkout.url,
    checkoutMode: checkout.mode,
  };
}

async function waitForUnlock({
  fetchImpl,
  baseUrl,
  requestId,
  maxWaitMs,
  pollMs,
  sleepImpl,
  nowMs,
}) {
  const deadline = nowMs() + maxWaitMs;
  let polls = 0;
  while (true) {
    const status = await readStatus(fetchImpl, baseUrl, requestId);
    polls += 1;
    if (!status.ok) return { ...status, polls };
    if (status.status === 'unlocked') return { ok: true, polls };
    if (nowMs() >= deadline) {
      return { ok: false, error: 'Timed out waiting for paid report unlock.', polls };
    }
    await sleepImpl(Math.min(pollMs, Math.max(1, deadline - nowMs())));
  }
}

function missingPaidMarkers(html) {
  return REQUIRED_PAID_MARKERS.filter((marker) => !html.includes(marker.label)).map(
    (marker) => marker.key,
  );
}

function lockedMarkers(html) {
  return LOCKED_MARKERS.filter((marker) => html.includes(marker));
}

async function verifyPaidRender(fetchImpl, baseUrl, requestId) {
  const url = resultUrl(baseUrl, requestId);
  let response;
  try {
    response = await fetchImpl(url, { cache: 'no-store' });
  } catch {
    return { ok: false, error: 'Paid results page failed before an HTTP response.', url };
  }
  if (!response.ok) {
    return { ok: false, error: `Paid results page failed with HTTP ${response.status}.`, url };
  }
  const html = await response.text();
  const missing = missingPaidMarkers(html);
  const locked = lockedMarkers(html);
  if (missing.length > 0 || locked.length > 0) {
    return {
      ok: false,
      error: 'Paid results page did not render the unlocked report.',
      url,
      missing,
      lockedMarkers: locked,
    };
  }
  return {
    ok: true,
    url,
    markers: Object.fromEntries(REQUIRED_PAID_MARKERS.map((marker) => [marker.key, true])),
  };
}

export async function runDeflectionPaidUnlockSmoke(options, deps = {}) {
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const now = deps.now || (() => new Date().toISOString());
  const nowMs = deps.nowMs || (() => Date.now());
  const sleepImpl = deps.sleepImpl || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const makeAttemptId = deps.makeAttemptId || (() => randomUUID());
  const onAwaitingPayment = deps.onAwaitingPayment || (async () => {});

  const requestId = String(options.requestId || '').trim();
  const attemptId = String(options.attemptId || makeAttemptId()).trim();
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const maxWaitMs = parsePositiveInteger(options.maxWaitMs, DEFAULT_MAX_WAIT_MS);
  const pollMs = parsePositiveInteger(options.pollMs, DEFAULT_POLL_MS);
  const allowLiveCheckout = options.allowLiveCheckout === true;
  const requireUnlocked = options.requireUnlocked === true;

  if (!REQUEST_ID_RE.test(requestId)) {
    return { ok: false, error: 'Paid unlock smoke request id is invalid.', apiCalls: false };
  }
  if (!ATTEMPT_ID_RE.test(attemptId)) {
    return { ok: false, error: 'Paid unlock smoke attempt id is invalid.', apiCalls: false };
  }
  if (!baseUrl) {
    return { ok: false, error: 'Paid unlock smoke base URL is invalid.', apiCalls: false };
  }
  if (!maxWaitMs || !pollMs) {
    return { ok: false, error: 'Paid unlock smoke wait options are invalid.', apiCalls: false };
  }

  const firstStatus = await readStatus(fetchImpl, baseUrl, requestId);
  if (!firstStatus.ok) {
    return { ...firstStatus, ok: false, stage: 'status', apiCalls: true, requestId, attemptId };
  }

  let checkout = null;
  let unlockPolls = 0;
  if (firstStatus.status === 'locked') {
    if (requireUnlocked) {
      return {
        ok: false,
        error: 'Paid unlock smoke requires an already-unlocked report.',
        stage: 'status',
        apiCalls: true,
        requestId,
        attemptId,
        initialStatus: firstStatus.status,
        requireUnlocked,
      };
    }
    checkout = await createCheckout(fetchImpl, baseUrl, requestId, attemptId);
    if (!checkout.ok) {
      return { ...checkout, ok: false, stage: 'checkout', apiCalls: true, requestId, attemptId };
    }
    if (checkout.checkoutMode === 'live' && !allowLiveCheckout) {
      return {
        ok: false,
        error: 'Refusing to wait on a live-mode Stripe Checkout Session.',
        stage: 'checkout_mode',
        apiCalls: true,
        requestId,
        attemptId,
        checkoutUrl: checkout.checkoutUrl,
        checkoutMode: checkout.checkoutMode,
      };
    }
    if (!checkout.alreadyPaid) {
      await onAwaitingPayment({
        ok: true,
        mode: 'DEFLECTION_PAID_UNLOCK_SMOKE',
        stage: 'awaiting_payment',
        apiCalls: true,
        checkedAt: now(),
        requestId,
        attemptId,
        checkoutUrl: checkout.checkoutUrl,
        checkoutMode: checkout.checkoutMode,
      });
      const unlocked = await waitForUnlock({
        fetchImpl,
        baseUrl,
        requestId,
        maxWaitMs,
        pollMs,
        sleepImpl,
        nowMs,
      });
      unlockPolls = unlocked.polls || 0;
      if (!unlocked.ok) {
        return {
          ...unlocked,
          ok: false,
          stage: 'unlock',
          apiCalls: true,
          requestId,
          attemptId,
          checkoutUrl: checkout.checkoutUrl,
          checkoutMode: checkout.checkoutMode,
        };
      }
    }
  }

  const render = await verifyPaidRender(fetchImpl, baseUrl, requestId);
  if (!render.ok) {
    return { ...render, ok: false, stage: 'render', apiCalls: true, requestId, attemptId };
  }

  return {
    ok: true,
    mode: 'DEFLECTION_PAID_UNLOCK_SMOKE',
    status: 'paid_rendered',
    apiCalls: true,
    checkedAt: now(),
    requestId,
    attemptId,
    initialStatus: firstStatus.status,
    checkoutMode: checkout?.checkoutMode,
    checkoutUrl: checkout?.checkoutUrl,
    requireUnlocked,
    unlockPolls,
    resultsUrl: render.url,
    markers: render.markers,
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
    fail('Deflection paid unlock smoke is missing --request-id.', outputJson, { apiCalls: false });
  }
  if (isBareFlag(parsed, '--base-url')) {
    fail('Refusing to continue without --base-url <url>.', outputJson, { apiCalls: false });
  }
  if (isBareFlag(parsed, '--vercel-deployment')) {
    fail('Refusing to continue without --vercel-deployment <id|url>.', outputJson, {
      apiCalls: false,
    });
  }

  const baseUrl = parsed.values.get('--base-url') || DEFAULT_BASE_URL;
  const useVercelCurl = parsed.flags.has('--vercel-curl');
  const fetchImpl = useVercelCurl
    ? makeVercelCurlFetch({
      deployment: parsed.values.get('--vercel-deployment') || baseUrl,
    })
    : undefined;
  const result = await runDeflectionPaidUnlockSmoke({
    requestId: parsed.values.get('--request-id'),
    attemptId: parsed.values.get('--attempt-id'),
    baseUrl,
    maxWaitMs: parsed.values.get('--max-wait-ms'),
    pollMs: parsed.values.get('--poll-ms'),
    allowLiveCheckout: parsed.flags.has('--allow-live-checkout'),
    requireUnlocked: parsed.flags.has('--require-unlocked'),
  }, {
    ...(fetchImpl ? { fetchImpl } : {}),
    onAwaitingPayment: async (artifact) => {
      console.log(`Test-mode Checkout URL: ${artifact.checkoutUrl}`);
      console.log('Complete payment in another window; polling for unlock...');
      if (outputPath) {
        await writeJsonArtifact(outputPath, artifact, { includeOutputPath: false });
      }
    },
  });
  const artifactPath = outputPath
    ? await writeJsonArtifact(outputPath, result, { includeOutputPath: false })
    : '';

  if (!result.ok) fail(result.error, outputJson, result);
  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('Deflection paid unlock smoke passed.');
  console.log(`Results URL: ${result.resultsUrl}`);
  if (result.checkoutMode) console.log(`Checkout mode: ${result.checkoutMode}`);
  if (artifactPath) console.log(`Smoke artifact: ${artifactPath}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch((error) => {
    fail(error.message || String(error), false, { apiCalls: false });
  });
}
