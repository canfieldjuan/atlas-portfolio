import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { runDeflectionBrowserUploadSmoke } from './smoke-deflection-browser-upload.mjs';

const baseOptions = {
  csvPath: '/tmp/support-export.csv',
  companyName: 'Effingham Office Maids',
  email: 'ops@example.com',
  platform: 'helpscout',
  name: 'Ops Lead',
  baseUrl: 'https://portfolio.example.com/',
};
const LOCKED_RESULTS_HTML = [
  '<main>',
  '<span>YOUR DEFLECTION SNAPSHOT</span>',
  '<h1>We found 12 deflection opportunities</h1>',
  '<p>One drafted answer you can inspect before paying</p>',
  '<a>Unlock your full Backlog Report</a>',
  '</main>',
].join('');

function csvReader() {
  return Buffer.from('ticket_id,subject,body\n1,Export reports,How do I export reports?\n');
}

function makeUploadMock(response = {}) {
  const calls = [];
  const uploadImpl = async (pathname, body, options) => {
    calls.push({ pathname, body, options });
    if (response.reject) throw new Error(response.reject);
    return {
      url:
        response.url ||
        `https://store.private.blob.vercel-storage.com/${pathname}`,
      pathname: response.pathname || pathname,
    };
  };
  uploadImpl.calls = calls;
  return uploadImpl;
}

function makeFetchMock(responses) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const next = responses.shift();
    if (!next) throw new Error(`unexpected fetch: ${url}`);
    if (next.reject) throw new Error(next.reject);
    if (next.kind === 'html') {
      return new Response(next.body ?? '', { status: next.status });
    }
    return Response.json(next.body ?? null, { status: next.status });
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

async function runCli(args) {
  const child = spawn(process.execPath, [new URL('./smoke-deflection-browser-upload.mjs', import.meta.url).pathname, ...args], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
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

async function run(options, uploadResponse, recordResponses, extra = {}) {
  const uploadImpl = makeUploadMock(uploadResponse);
  const fetchImpl = makeFetchMock(recordResponses);
  const result = await runDeflectionBrowserUploadSmoke(options, {
    uploadImpl,
    fetchImpl,
    readFileImpl: extra.readFileImpl || csvReader,
    now: () => '2026-05-31T17:00:00.000Z',
  });
  return { result, uploadImpl, fetchImpl };
}

{
  const { result, uploadImpl, fetchImpl } = await run(
    baseOptions,
    {},
    [
      {
        status: 200,
        body: {
          ok: true,
          requestId: '11111111-1111-4111-8111-111111111111',
          reportRequestId: 'content-ops-unit-123',
          warnings: [],
        },
      },
    ],
  );
  assert.equal(result.ok, true);
  assert.equal(result.reportRequestId, 'content-ops-unit-123');
  assert.equal(
    result.resultsUrl,
    'https://portfolio.example.com/systems/support-ticket-deflection/results/content-ops-unit-123',
  );
  assert.equal(result.blobHost, 'store.private.blob.vercel-storage.com');
  assert.equal(uploadImpl.calls.length, 1);
  assert.ok(uploadImpl.calls[0].pathname.startsWith('gap-report-csvs/'));
  assert.equal(uploadImpl.calls[0].options.access, 'private');
  assert.equal(uploadImpl.calls[0].options.contentType, 'text/csv');
  assert.equal(
    uploadImpl.calls[0].options.handleUploadUrl,
    'https://portfolio.example.com/api/gap-report-intake/upload',
  );
  const clientPayload = JSON.parse(uploadImpl.calls[0].options.clientPayload);
  assert.equal(clientPayload.companyName, 'Effingham Office Maids');
  assert.equal(clientPayload.supportPlatform, 'helpscout');
  assert.equal(clientPayload.sourceOffer, 'support-ticket-deflection-intake');
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fetchImpl.calls[0].url, 'https://portfolio.example.com/api/gap-report-intake/record');
  assert.equal(fetchImpl.calls[0].init.method, 'POST');
  assert.equal(fetchImpl.calls[0].init.cache, 'no-store');
  const recordBody = JSON.parse(fetchImpl.calls[0].init.body);
  assert.equal(recordBody.blobUrl.includes('/gap-report-csvs/'), true);
  assert.equal(recordBody.email, 'ops@example.com');
}

{
  const { result, fetchImpl } = await run(
    { ...baseOptions, verifyResults: true },
    {},
    [
      {
        status: 200,
        body: {
          ok: true,
          requestId: '11111111-1111-4111-8111-111111111111',
          reportRequestId: 'content-ops-unit-123',
          warnings: [],
        },
      },
      { status: 200, kind: 'html', body: LOCKED_RESULTS_HTML },
    ],
  );
  assert.equal(result.ok, true);
  assert.equal(result.resultsVerified, true);
  assert.deepEqual(result.resultMarkers, {
    snapshotBadge: true,
    headline: true,
    teaserAnswer: true,
    unlockCta: true,
  });
  assert.equal(fetchImpl.calls.length, 2);
  assert.equal(
    fetchImpl.calls[1].url,
    'https://portfolio.example.com/systems/support-ticket-deflection/results/content-ops-unit-123',
  );
  assert.equal(fetchImpl.calls[1].init.cache, 'no-store');
}

{
  const { result } = await run(
    { ...baseOptions, verifyResults: true },
    {},
    [
      {
        status: 200,
        body: {
          ok: true,
          requestId: '11111111-1111-4111-8111-111111111111',
          reportRequestId: 'content-ops-unit-123',
          warnings: [],
        },
      },
      {
        status: 200,
        kind: 'html',
        body: LOCKED_RESULTS_HTML.replace('Unlock your full Backlog Report', 'Thanks'),
      },
    ],
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'results');
  assert.equal(result.reportRequestId, 'content-ops-unit-123');
  assert.equal(result.error, 'Hosted results page is missing required render markers.');
  assert.deepEqual(result.missing, ['unlockCta']);
}

{
  const result = await runCli([
    '--base-url',
    '--csv',
    '/tmp/support-export.csv',
    '--company',
    'Effingham Office Maids',
    '--email',
    'ops@example.com',
    '--platform',
    'helpscout',
    '--json',
  ]);
  assert.equal(result.code, 1);
  assert.equal(result.stderr, '');
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.ok, false);
  assert.equal(payload.error, 'Refusing to continue without --base-url <url>.');
  assert.equal(payload.apiCalls, false);
  assert.equal(payload.mutations, false);
}

{
  const { result, uploadImpl, fetchImpl } = await run(
    { ...baseOptions, csvPath: '/tmp/support-export.txt' },
    {},
    [],
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Deflection browser upload smoke options are invalid.');
  assert.deepEqual(result.errors, ['--csv must point to a .csv file']);
  assert.equal(uploadImpl.calls.length, 0);
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result } = await run(
    { ...baseOptions, baseUrl: 'http://evil.example.com' },
    {},
    [],
  );
  assert.equal(result.ok, false);
  assert.deepEqual(result.errors, ['--base-url must be https, localhost, or 127.0.0.1']);
}

{
  const { result, uploadImpl, fetchImpl } = await run(baseOptions, {}, [], {
    readFileImpl: async () => {
      throw new Error('missing file');
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'CSV file could not be read.');
  assert.equal(uploadImpl.calls.length, 0);
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result, uploadImpl } = await run(baseOptions, {}, [], {
    readFileImpl: async () => Buffer.from(''),
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'CSV file is empty.');
  assert.equal(uploadImpl.calls.length, 0);
}

{
  const { result, uploadImpl, fetchImpl } = await run(
    baseOptions,
    { reject: 'blob token failed' },
    [],
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'upload');
  assert.equal(result.apiCalls, true);
  assert.equal(result.mutations, true);
  assert.equal(result.error, 'Browser upload smoke failed during Blob upload.');
  assert.equal(result.detail, 'blob token failed');
  assert.equal(uploadImpl.calls.length, 1);
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result } = await run(
    baseOptions,
    { url: 'https://store.private.blob.vercel-storage.com/other/file.csv' },
    [],
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'upload');
  assert.equal(result.error, 'Blob upload did not return a valid intake Blob URL.');
}

{
  const { result, fetchImpl } = await run(
    baseOptions,
    {},
    [{ reject: 'network reset' }],
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'record');
  assert.equal(result.error, 'Record route failed before an HTTP response.');
  assert.equal(fetchImpl.calls.length, 1);
}

{
  const { result } = await run(
    baseOptions,
    {},
    [{ status: 500, body: { ok: false, error: 'Upload not found.' } }],
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'record');
  assert.equal(result.recordStatus, 500);
  assert.equal(result.error, 'Upload not found.');
}

{
  const { result } = await run(
    baseOptions,
    {},
    [
      {
        status: 200,
        body: {
          ok: true,
          requestId: '11111111-1111-4111-8111-111111111111',
          warnings: ['Deflection report was not generated immediately.'],
        },
      },
    ],
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'record');
  assert.equal(result.error, 'Record route did not return a valid reportRequestId for redirect.');
  assert.deepEqual(result.warnings, ['Deflection report was not generated immediately.']);
}

{
  const { result } = await run(
    baseOptions,
    {},
    [
      {
        status: 200,
        body: {
          ok: true,
          requestId: '11111111-1111-4111-8111-111111111111',
          reportRequestId: '../../bad',
        },
      },
    ],
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Record route did not return a valid reportRequestId for redirect.');
}

console.log('Deflection browser upload smoke tests passed.');
