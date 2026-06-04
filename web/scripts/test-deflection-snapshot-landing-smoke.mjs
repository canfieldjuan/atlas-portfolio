import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { runDeflectionSnapshotLandingSmoke } from './smoke-deflection-snapshot-landing.mjs';

const SNAPSHOT_URL = 'https://portfolio.example.com/systems/support-ticket-deflection/snapshot';
const MARKER_KEYS = [
  'snapshotBadge',
  'promiseHeadline',
  'beforeAfterProof',
  'snapshotAction',
  'snapshotFirst',
  'finalSnapshotAsk',
  'ctaLabel',
  'intakeHref',
];
const GOOD_HTML = [
  '<main>',
  '<span>Free Deflection Snapshot</span>',
  '<h1>Get the free Snapshot that shows which support tickets to deflect first.</h1>',
  '<p>BEFORE / AFTER SNAPSHOT PROOF</p>',
  '<p>Snapshot action</p>',
  '<p>Snapshot comes before any paid report</p>',
  '<p>The only ask on this page is the CSV upload</p>',
  '<a href="/systems/support-ticket-deflection/intake">Get my free Deflection Snapshot</a>',
  '</main>',
].join('');

function makeFetchMock(response) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (response.reject) throw new Error(response.reject);
    return new Response(response.body ?? '', { status: response.status ?? 200 });
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

async function run({ baseUrl = 'https://portfolio.example.com/', response = {} } = {}) {
  const fetchImpl = makeFetchMock({ body: GOOD_HTML, ...response });
  const result = await runDeflectionSnapshotLandingSmoke(
    { baseUrl },
    { fetchImpl, now: () => '2026-06-04T00:30:00.000Z' },
  );
  return { result, calls: fetchImpl.calls };
}

async function runCli(args) {
  const child = spawn(
    process.execPath,
    [new URL('./smoke-deflection-snapshot-landing.mjs', import.meta.url).pathname, ...args],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  );
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => {
    stdout += chunk;
  });
  child.stderr.on('data', (chunk) => {
    stderr += chunk;
  });
  const code = await new Promise((resolve) => {
    child.on('close', resolve);
  });
  return { code, stdout, stderr };
}

function assertResultFields(result, expected, name) {
  for (const [field, value] of Object.entries(expected)) {
    assert.deepEqual(result[field], value, name);
  }
}

{
  const { result, calls } = await run({
    response: {
      body: `${GOOD_HTML}<template>This page could not be found</template>`,
    },
  });
  assert.equal(result.ok, true);
  assert.equal(result.mode, 'DEFLECTION_SNAPSHOT_LANDING_SMOKE');
  assert.equal(result.baseUrl, 'https://portfolio.example.com');
  assert.equal(result.url, SNAPSHOT_URL);
  assert.deepEqual(result.markers, Object.fromEntries(MARKER_KEYS.map((key) => [key, true])));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, SNAPSHOT_URL);
  assert.equal(calls[0].init.cache, 'no-store');
}

const failureCases = [
  ['invalid base URL', { baseUrl: 'http://evil.example.com' }, 0, {
    ok: false,
    error: 'Deflection Snapshot landing smoke base URL is invalid.',
    apiCalls: false,
  }],
  ['HTTP failure', { response: { status: 404, body: 'not found' } }, 1, {
    ok: false,
    stage: 'fetch',
    error: 'Snapshot landing page failed with HTTP 404.',
    apiCalls: true,
  }],
  ['network failure', { response: { reject: 'network reset' } }, 1, {
    ok: false,
    stage: 'fetch',
    error: 'Snapshot landing page fetch failed before an HTTP response.',
    apiCalls: true,
  }],
  ['missing proof marker', { response: { body: GOOD_HTML.replace('BEFORE / AFTER SNAPSHOT PROOF', '') } }, undefined, {
    ok: false,
    stage: 'render',
    error: 'Snapshot landing page is missing required render markers.',
    missing: ['beforeAfterProof'],
    forbidden: [],
  }],
  ['missing intake target', {
    response: { body: GOOD_HTML.replace('href="/systems/support-ticket-deflection/intake"', '') },
  }, undefined, {
    ok: false,
    stage: 'render',
    error: 'Snapshot landing page is missing required render markers.',
    missing: ['intakeHref'],
    forbidden: [],
  }],
  ['paid-report-first copy', { response: { body: `${GOOD_HTML}<p>Full report unlock</p>` } }, undefined, {
    ok: false,
    stage: 'render',
    error: 'Snapshot landing page rendered forbidden paid-report-first copy.',
    missing: [],
    forbidden: ['fullReportUnlockMetric'],
  }],
  ['rendered error marker', { response: { body: 'Application error' } }, undefined, {
    ok: false,
    stage: 'render',
    error: 'Snapshot landing page rendered an error marker: Application error.',
    missing: MARKER_KEYS,
  }],
];

for (const [name, options, calls, expected] of failureCases) {
  const result = await run(options);
  assertResultFields(result.result, expected, name);
  if (calls !== undefined) assert.equal(result.calls.length, calls, name);
}

{
  const result = await runCli(['--output', '--json']);
  assert.equal(result.code, 1);
  assert.equal(result.stderr, '');
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.equal(payload.error, 'Refusing to continue without --output <path>.');
}

console.log('Deflection Snapshot landing smoke tests passed.');
