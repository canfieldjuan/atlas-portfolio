import { spawn } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { runDeflectionBrowserUploadSmoke } from '../../scripts/smoke-deflection-browser-upload.mjs';

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
  '<span>YOUR RESOLUTION AUDIT SNAPSHOT</span>',
  '<h1>We found 12 deflection opportunities</h1>',
  '<p>Support Tax projection</p>',
  '<p>Help-desk SEO targeting list</p>',
  '<p>This backlog at current pace</p>',
  '<p>One drafted answer you can inspect before paying</p>',
  '<a>Unlock your full Resolution Audit</a>',
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
  const queue = [...responses];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const next = queue.shift();
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
  const child = spawn(process.execPath, [
    new URL('../../scripts/smoke-deflection-browser-upload.mjs', import.meta.url).pathname,
    ...args,
  ], {
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
  return { code, stderr, stdout };
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
  return { fetchImpl, result, uploadImpl };
}

function successfulRecordPayload() {
  return {
    ok: true,
    requestId: '11111111-1111-4111-8111-111111111111',
    reportRequestId: 'content-ops-unit-123',
    warnings: [],
  };
}

describe('deflection browser upload smoke guard', () => {
  it('uploads a private CSV Blob and records the intake payload', async () => {
    const { fetchImpl, result, uploadImpl } = await run(
      baseOptions,
      {},
      [{ status: 200, body: successfulRecordPayload() }],
    );

    expect(result).toMatchObject({
      ok: true,
      reportRequestId: 'content-ops-unit-123',
      resultsUrl: 'https://portfolio.example.com/systems/support-ticket-deflection/results/content-ops-unit-123',
      blobHost: 'store.private.blob.vercel-storage.com',
    });
    expect(uploadImpl.calls).toHaveLength(1);
    expect(uploadImpl.calls[0].pathname).toMatch(/^gap-report-csvs\//);
    expect(uploadImpl.calls[0].options).toMatchObject({
      access: 'private',
      contentType: 'text/csv',
      handleUploadUrl: 'https://portfolio.example.com/api/gap-report-intake/upload',
    });
    const clientPayload = JSON.parse(uploadImpl.calls[0].options.clientPayload);
    expect(clientPayload).toMatchObject({
      companyName: 'Effingham Office Maids',
      supportPlatform: 'helpscout',
      sourceOffer: 'support-ticket-deflection-intake',
    });

    expect(fetchImpl.calls).toHaveLength(1);
    expect(fetchImpl.calls[0]).toMatchObject({
      url: 'https://portfolio.example.com/api/gap-report-intake/record',
      init: { method: 'POST', cache: 'no-store' },
    });
    const recordBody = JSON.parse(fetchImpl.calls[0].init.body);
    expect(recordBody.blobUrl).toContain('/gap-report-csvs/');
    expect(recordBody.email).toBe('ops@example.com');
  });

  it('can verify the hosted locked results page markers', async () => {
    const { fetchImpl, result } = await run(
      { ...baseOptions, verifyResults: true },
      {},
      [
        { status: 200, body: successfulRecordPayload() },
        { status: 200, kind: 'html', body: LOCKED_RESULTS_HTML },
      ],
    );

    expect(result).toMatchObject({
      ok: true,
      resultsVerified: true,
    });
    expect(result.resultMarkers).toEqual({
      snapshotBadge: true,
      headline: true,
      keywordReframe: true,
      runRateComparison: true,
      snapshotAnswerState: true,
      supportTax: true,
      unlockCta: true,
    });
    expect(fetchImpl.calls).toHaveLength(2);
    expect(fetchImpl.calls[1]).toMatchObject({
      url: 'https://portfolio.example.com/systems/support-ticket-deflection/results/content-ops-unit-123',
      init: { cache: 'no-store' },
    });
  });

  it('fails when hosted results verification is missing required markers', async () => {
    const { result } = await run(
      { ...baseOptions, verifyResults: true },
      {},
      [
        { status: 200, body: successfulRecordPayload() },
        {
          status: 200,
          kind: 'html',
          body: LOCKED_RESULTS_HTML.replace('Unlock your full Resolution Audit', 'Thanks'),
        },
      ],
    );

    expect(result).toMatchObject({
      ok: false,
      stage: 'results',
      reportRequestId: 'content-ops-unit-123',
      error: 'Hosted results page is missing required render markers.',
      missing: ['unlockCta'],
    });
  });

  it('keeps CLI JSON bare-flag failure machine-readable', async () => {
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

    expect(result.code).toBe(1);
    expect(result.stderr).toBe('');
    const payload = JSON.parse(result.stdout);
    expect(payload).toMatchObject({
      ok: false,
      error: 'Refusing to continue without --base-url <url>.',
      apiCalls: false,
      mutations: false,
    });
  });

  it.each([
    [
      'csv extension',
      { ...baseOptions, csvPath: '/tmp/support-export.txt' },
      ['--csv must point to a .csv file'],
    ],
    [
      'base URL',
      { ...baseOptions, baseUrl: 'http://evil.example.com' },
      ['--base-url must be https, localhost, or 127.0.0.1'],
    ],
  ])('fails before mutations for invalid %s option', async (_label, options, errors) => {
    const { fetchImpl, result, uploadImpl } = await run(options, {}, []);

    expect(result).toMatchObject({
      ok: false,
      error: 'Deflection browser upload smoke options are invalid.',
      errors,
      apiCalls: false,
      mutations: false,
    });
    expect(uploadImpl.calls).toHaveLength(0);
    expect(fetchImpl.calls).toHaveLength(0);
  });

  it('fails before upload when the CSV cannot be read or is empty', async () => {
    const missingFile = await run(baseOptions, {}, [], {
      readFileImpl: async () => {
        throw new Error('missing file');
      },
    });
    expect(missingFile.result).toMatchObject({
      ok: false,
      error: 'CSV file could not be read.',
      apiCalls: false,
      mutations: false,
    });
    expect(missingFile.uploadImpl.calls).toHaveLength(0);
    expect(missingFile.fetchImpl.calls).toHaveLength(0);

    const emptyFile = await run(baseOptions, {}, [], {
      readFileImpl: async () => Buffer.from(''),
    });
    expect(emptyFile.result).toMatchObject({
      ok: false,
      error: 'CSV file is empty.',
      apiCalls: false,
      mutations: false,
    });
    expect(emptyFile.uploadImpl.calls).toHaveLength(0);
  });

  it('reports Blob upload failures and invalid Blob URLs', async () => {
    const uploadFailure = await run(baseOptions, { reject: 'blob token failed' }, []);
    expect(uploadFailure.result).toMatchObject({
      ok: false,
      stage: 'upload',
      apiCalls: true,
      mutations: true,
      error: 'Browser upload smoke failed during Blob upload.',
      detail: 'blob token failed',
    });
    expect(uploadFailure.uploadImpl.calls).toHaveLength(1);
    expect(uploadFailure.fetchImpl.calls).toHaveLength(0);

    const invalidBlobUrl = await run(
      baseOptions,
      { url: 'https://store.private.blob.vercel-storage.com/other/file.csv' },
      [],
    );
    expect(invalidBlobUrl.result).toMatchObject({
      ok: false,
      stage: 'upload',
      error: 'Blob upload did not return a valid intake Blob URL.',
    });
  });

  it('surfaces record route fetch, HTTP, and ATLAS rejection failures', async () => {
    const fetchFailure = await run(baseOptions, {}, [{ reject: 'network reset' }]);
    expect(fetchFailure.result).toMatchObject({
      ok: false,
      stage: 'record',
      error: 'Record route failed before an HTTP response.',
    });
    expect(fetchFailure.fetchImpl.calls).toHaveLength(1);

    const httpFailure = await run(
      baseOptions,
      {},
      [{ status: 500, body: { ok: false, error: 'Upload not found.' } }],
    );
    expect(httpFailure.result).toMatchObject({
      ok: false,
      stage: 'record',
      recordStatus: 500,
      error: 'Upload not found.',
    });

    const atlasRejection = await run(
      baseOptions,
      {},
      [
        {
          status: 502,
          body: {
            ok: false,
            status: 'failed_to_submit',
            reason: 'rejected',
            error:
              'Deflection report generation rejected this CSV. Please check the export and try again, or email us directly.',
          },
        },
      ],
    );
    expect(atlasRejection.result).toMatchObject({
      ok: false,
      stage: 'record',
      recordStatus: 502,
      error:
        'Deflection report generation rejected this CSV. Please check the export and try again, or email us directly.',
    });
  });

  it('fails when the record route returns an invalid reportRequestId', async () => {
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

    expect(result).toMatchObject({
      ok: false,
      stage: 'record',
      error: 'Record route did not return a valid reportRequestId for redirect.',
    });
  });
});
