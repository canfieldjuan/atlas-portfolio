import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type QueryCall = { sql: string; params: unknown[] };
type ExpiredRow = {
  request_id: string;
  report_request_id: string;
  submitted_at: string;
  csv_blob_url: string;
};
type PurgeRow = {
  request_id: string;
  report_request_id: string;
  csv_blob_url: string;
};

const blobClientState = vi.hoisted(() => ({
  handleUpload: vi.fn(),
}));

const blobState = vi.hoisted(() => {
  class MockBlobNotFoundError extends Error {}
  return {
    BlobNotFoundError: MockBlobNotFoundError,
    del: vi.fn(),
    list: vi.fn(),
  };
});

const dbState = vi.hoisted(() => ({
  databaseUrls: [] as string[],
  queries: [] as QueryCall[],
  expiredRows: [] as ExpiredRow[],
  deletedSubmissionIds: [] as string[],
  purgeTargets: {} as Record<string, PurgeRow | undefined>,
  neon: vi.fn(),
}));

vi.mock('@vercel/blob/client', () => ({
  handleUpload: blobClientState.handleUpload,
}));

vi.mock('@vercel/blob', () => ({
  BlobNotFoundError: blobState.BlobNotFoundError,
  del: blobState.del,
  list: blobState.list,
  get: vi.fn(),
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: dbState.neon,
}));

import { POST as uploadPOST } from '@/app/api/gap-report-intake/upload/route';
import {
  cleanupExpiredGapReportData,
  purgeGapReportSubmissionByReportRequestId,
} from '@/lib/gap-report-cleanup';

const ENV_KEYS = [
  'ATLAS_API_BASE_URL',
  'ATLAS_B2B_SERVICE_TOKEN',
  'BLOB_READ_WRITE_TOKEN',
  'ticke_deflection_blob_READ_WRITE_TOKEN',
  'DEFLECTION_REVIEW_DECISIONS_DATABASE_URL',
  'GAP_REPORT_DATABASE_URL',
  'AUDIT_INTAKE_DATABASE_URL',
  'DATABASE_URL',
  'POSTGRES_URL',
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const webRoot = process.cwd();
const gapReportCacheKey = Symbol.for('atlas-portfolio.gap-report-intake.neon-clients');
const reviewDecisionCacheKey = Symbol.for(
  'atlas-portfolio.deflection-review-decisions.neon-clients',
);
const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

let uploadPayload: unknown;
let uploadHandleCalls = 0;
let uploadGeneratedTokens = 0;
let cleanupEvents: string[] = [];
let fetchCalls: Array<{ url: string; init: RequestInit }> = [];
let atlasDeleteFailures = new Set<string>();
let missingBlobUrls = new Set<string>();
let listCalls: Array<string | undefined> = [];
let delCalls: Array<{ url: string; token: string | undefined }> = [];
let cleanupPageRequests: Array<{ limit: number; offset: number }> = [];
let reviewDecisionDeletes: string[] = [];
let consoleErrors: string[] = [];

function restoreEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
    if (originalEnv[key] !== undefined) process.env[key] = originalEnv[key];
  }
}

function resetEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) {
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, values);
}

function configurePrivacyEnv() {
  resetEnv({
    ATLAS_API_BASE_URL: 'https://atlas.example.test',
    ATLAS_B2B_SERVICE_TOKEN: 'service_token_unit',
    BLOB_READ_WRITE_TOKEN: 'private-token',
    ticke_deflection_blob_READ_WRITE_TOKEN: 'legacy-token',
    GAP_REPORT_DATABASE_URL: 'postgres://gap-report-unit',
  });
}

function resetModuleCaches() {
  delete (globalThis as Record<symbol, unknown>)[gapReportCacheKey];
  delete (globalThis as Record<symbol, unknown>)[reviewDecisionCacheKey];
  delete globalThis.__atlasDeflectionRateLimitStore;
}

async function query(sql: string, params: unknown[]) {
  dbState.queries.push({ sql, params });
  if (/FROM portfolio_gap_report_submissions/i.test(sql) && /payload->>'reportRequestId' = \$1/i.test(sql)) {
    const target = dbState.purgeTargets[String(params[0])];
    return target ? [target] : [];
  }
  if (/FROM portfolio_gap_report_submissions/i.test(sql) && /submitted_at < \$1::timestamptz/i.test(sql)) {
    const limit = Number(params[1]);
    const offset = Number(params[2] ?? 0);
    cleanupPageRequests.push({ limit, offset });
    const remaining = dbState.expiredRows.filter(
      (row) => !dbState.deletedSubmissionIds.includes(row.request_id),
    );
    return remaining.slice(offset, offset + limit);
  }
  if (/DELETE FROM portfolio_gap_report_submissions/i.test(sql)) {
    const ids = Array.isArray(params[0]) ? params[0].map(String) : [];
    dbState.deletedSubmissionIds.push(...ids);
    return ids.map((request_id) => ({ request_id }));
  }
  if (/DELETE FROM portfolio_deflection_review_decisions/i.test(sql)) {
    reviewDecisionDeletes.push(String(params[0]));
    cleanupEvents.push(`review-decisions:${String(params[0])}`);
    return [{ review_key: 'unit' }];
  }
  return [];
}

dbState.neon.mockImplementation((databaseUrl: string) => {
  dbState.databaseUrls.push(databaseUrl);
  return { query };
});

function resetDatabase() {
  dbState.databaseUrls = [];
  dbState.queries = [];
  dbState.expiredRows = [];
  dbState.deletedSubmissionIds = [];
  dbState.purgeTargets = {};
  dbState.neon.mockClear();
  cleanupPageRequests = [];
  reviewDecisionDeletes = [];
}

function resetBlob() {
  delCalls = [];
  listCalls = [];
  missingBlobUrls = new Set();
  blobState.del.mockReset();
  blobState.list.mockReset();
  blobState.del.mockImplementation(async (url: string, options?: { token?: string }) => {
    delCalls.push({ url, token: options?.token });
    cleanupEvents.push(`blob:${url}:${options?.token}`);
    if (missingBlobUrls.has(url) && options?.token === 'private-token') {
      throw new blobState.BlobNotFoundError('missing blob');
    }
    if (url.includes('legacy.example') && options?.token !== 'legacy-token') {
      throw new Error('wrong store');
    }
    if (url.includes('private.example') && options?.token !== 'private-token') {
      throw new Error('wrong store');
    }
  });
  blobState.list.mockImplementation(async (options?: { token?: string }) => {
    listCalls.push(options?.token);
    return {
      hasMore: false,
      cursor: undefined,
      blobs:
        options?.token === 'legacy-token'
          ? [
              {
                url: 'https://legacy.example/gap-report-csvs/orphan.csv',
                pathname: 'gap-report-csvs/orphan.csv',
                uploadedAt: oldDate,
              },
            ]
          : [
              {
                url: 'https://private.example/gap-report-csvs/orphan.csv',
                pathname: 'gap-report-csvs/orphan.csv',
                uploadedAt: oldDate,
              },
            ],
    };
  });
}

function resetUpload() {
  uploadHandleCalls = 0;
  uploadGeneratedTokens = 0;
  uploadPayload = undefined;
  blobClientState.handleUpload.mockReset();
  blobClientState.handleUpload.mockImplementation(async (options: {
    onBeforeGenerateToken: (pathname: string, payload: string) => Promise<unknown>;
  }) => {
    uploadHandleCalls += 1;
    const payload =
      uploadPayload ??
      JSON.stringify({
        name: 'Alex Lee',
        email: 'buyer@example.com',
        companyName: 'Effingham Office Maids',
        supportPlatform: 'helpscout',
        csvFilename: 'tickets.csv',
        sourceOffer: 'support-ticket-deflection-intake',
      });
    const tokenPayload = await options.onBeforeGenerateToken(
      'gap-report-csvs/unit.csv',
      String(payload),
    );
    uploadGeneratedTokens += 1;
    return { ok: true, tokenPayload };
  });
}

function resetFetch() {
  fetchCalls = [];
  atlasDeleteFailures = new Set(['report-failed']);
  globalThis.fetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = input instanceof Request ? input.url : String(input);
    fetchCalls.push({ url, init });
    const reportId = decodeURIComponent(url.split('/').pop() ?? '');
    cleanupEvents.push(`atlas:${reportId}`);
    return new Response(null, { status: atlasDeleteFailures.has(reportId) ? 500 : 204 });
  });
}

function uploadRequest(ip: string, email: string) {
  uploadPayload = JSON.stringify({
    name: 'Alex Lee',
    email,
    companyName: 'Effingham Office Maids',
    supportPlatform: 'helpscout',
    csvFilename: 'tickets.csv',
    sourceOffer: 'support-ticket-deflection-intake',
  });
  return new Request('https://unit.test/api/gap-report-intake/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify({ type: 'blob.generate-client-token' }),
  });
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function sourceSlice(haystack: string, startNeedle: string, endNeedle: string) {
  const start = haystack.indexOf(startNeedle);
  expect(start, `expected to find ${startNeedle}`).not.toBe(-1);
  const end = haystack.indexOf(endNeedle, start);
  expect(end, `expected to find ${endNeedle}`).not.toBe(-1);
  return haystack.slice(start, end);
}

function seedExpiredRows() {
  dbState.expiredRows = [
    {
      request_id: 'legacy-row',
      report_request_id: 'report-deleted',
      submitted_at: oldDate.toISOString(),
      csv_blob_url: 'https://legacy.example/gap-report-csvs/tracked.csv',
    },
    {
      request_id: 'failed-row',
      report_request_id: 'report-failed',
      submitted_at: oldDate.toISOString(),
      csv_blob_url: 'https://private.example/gap-report-csvs/failed.csv',
    },
    {
      request_id: 'gone-row',
      report_request_id: 'report-gone',
      submitted_at: oldDate.toISOString(),
      csv_blob_url: 'https://private.example/gap-report-csvs/gone.csv',
    },
    {
      request_id: 'after-failure-row',
      report_request_id: 'report-after-failure',
      submitted_at: oldDate.toISOString(),
      csv_blob_url: 'https://private.example/gap-report-csvs/after-failure.csv',
    },
  ];
}

beforeEach(() => {
  configurePrivacyEnv();
  resetModuleCaches();
  resetDatabase();
  resetBlob();
  resetUpload();
  resetFetch();
  cleanupEvents = [];
  consoleErrors = [];
  vi.spyOn(console, 'error').mockImplementation((message) => {
    consoleErrors.push(String(message));
  });
});

afterEach(() => {
  if (originalFetch) {
    globalThis.fetch = originalFetch;
  } else {
    Reflect.deleteProperty(globalThis, 'fetch');
  }
  restoreEnv();
  resetModuleCaches();
  vi.restoreAllMocks();
});

describe('deflection CSV privacy source contract', () => {
  it('keeps public PII, private-upload, admin-download, and purge claims scoped', async () => {
    const [
      intakePage,
      intakeForm,
      uploadRoute,
      recordRoute,
      purgeRoute,
      intakeLib,
      adminCsvRoute,
      cleanupLib,
      atlasDeflectionClient,
      reviewDecisionsDatabase,
      landingConfig,
      securityPage,
      resultsRoute,
      resultsPage,
      modelPage,
      artifactPage,
      purgeControl,
    ] = await Promise.all([
      readFile(join(webRoot, 'src/components/landing/SupportTicketCsvIntakePage.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/components/landing/SupportTicketCsvIntakeForm.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/app/api/gap-report-intake/upload/route.ts'), 'utf8'),
      readFile(join(webRoot, 'src/app/api/gap-report-intake/record/route.ts'), 'utf8'),
      readFile(join(webRoot, 'src/app/api/deflection-report-purge/route.ts'), 'utf8'),
      readFile(join(webRoot, 'src/lib/gap-report-intake.ts'), 'utf8'),
      readFile(join(webRoot, 'src/app/admin/intake/gap-report/[requestId]/csv/route.ts'), 'utf8'),
      readFile(join(webRoot, 'src/lib/gap-report-cleanup.ts'), 'utf8'),
      readFile(join(webRoot, 'src/lib/atlas-deflection-client.ts'), 'utf8'),
      readFile(join(webRoot, 'src/lib/deflection-review-decisions-database.ts'), 'utf8'),
      readFile(join(webRoot, 'src/app/systems/support-ticket-deflection/landingConfig.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/app/security/page.tsx'), 'utf8'),
      readFile(
        join(webRoot, 'src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx'),
        'utf8',
      ),
      readFile(join(webRoot, 'src/components/landing/DeflectionResultsPage.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/components/landing/DeflectionReportModelPage.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/components/landing/DeflectionReportArtifactPage.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/components/landing/DeflectionReportPurgeControl.tsx'), 'utf8'),
    ]);
    const intakeClientSource = `${intakePage}\n${intakeForm}`;
    const compactIntakeClientSource = intakeClientSource.replace(/\s+/g, ' ');
    const compactSecurityPage = securityPage.replace(/\s+/g, ' ');

    expect(intakeClientSource).toContain("access: 'private'");
    expect(intakeClientSource).toContain('contentType,');
    expect(intakeClientSource).toContain('CSV_UPLOAD_CONTENT_TYPES');
    expect(intakeClientSource).not.toContain("access: 'public'");
    expect(intakeClientSource).toContain('deleted after 30 days');
    expect(intakeClientSource).toContain('SCRUBBED_CSV_FILENAME');
    expect(intakeClientSource).toContain("new TextDecoder('utf-8', { fatal: true })");
    expect(intakeClientSource).toContain('looksLikeUtf16(bytes)');
    expect(intakeClientSource).toContain('Upload stopped before any file was sent');
    expect(intakeClientSource).toContain('Browser + backend PII controls');
    expect(intakeClientSource).toContain('Your browser minimizes common contact identifiers in the CSV');
    expect(intakeClientSource).toContain('body before upload');
    expect(compactIntakeClientSource).toContain('backend redacts supported PII patterns from generated');
    expect(intakeClientSource).not.toContain('using raw file');
    expect(intakeClientSource).not.toContain('let fileToUpload: File = file');
    expect(intakeClientSource).not.toContain('never leave your device');
    expect(intakeClientSource).not.toContain('never make it into the report');

    expect(uploadRoute).toContain("pathname.startsWith('gap-report-csvs/')");
    expect(uploadRoute).toContain('allowedContentTypes: CSV_CONTENT_TYPES');
    expect(uploadRoute).toContain('maximumSizeInBytes: MAX_CSV_BYTES');
    expect(uploadRoute).toContain('consumeDeflectionRateLimit');
    expect(uploadRoute).toContain('consumeDeflectionIdentifierRateLimit');
    expect(uploadRoute).toContain('UploadRateLimitError');

    expect(recordRoute).toContain("blobUrl.startsWith('https://')");
    expect(recordRoute).toContain("blobUrl.includes('/gap-report-csvs/')");
    expect(recordRoute).toContain('await head(blobUrl');
    expect(recordRoute).toContain('gapReportBlobTokens');

    expect(intakeLib).toContain('Private blob reference: ${record.csvBlobUrl}');
    expect(intakeLib).not.toContain('Download: ${record.csvBlobUrl}');
    expect(intakeLib).toContain(
      'Privacy: we delete the uploaded CSV and submission record after 30 days.',
    );
    const writeTokenResolver = sourceSlice(
      intakeLib,
      'export function gapReportBlobToken()',
      'export function gapReportBlobTokens()',
    );
    expect(writeTokenResolver).toContain('return cleanBlobToken(process.env.BLOB_READ_WRITE_TOKEN);');
    expect(writeTokenResolver).not.toContain('ticke_deflection_blob_READ_WRITE_TOKEN');
    expect(intakeLib.indexOf('cleanBlobToken(process.env.BLOB_READ_WRITE_TOKEN)')).toBeLessThan(
      intakeLib.indexOf('cleanBlobToken(process.env.ticke_deflection_blob_READ_WRITE_TOKEN)'),
    );
    expect(intakeLib).toContain('export function gapReportBlobTokens()');

    expect(adminCsvRoute).toContain('verifyAdminIntakeCookie');
    expect(adminCsvRoute).toContain("access: 'private'");
    expect(adminCsvRoute).toContain('gapReportBlobTokens');
    expect(adminCsvRoute).toContain("headers.set('Cache-Control', 'no-store')");

    expect(cleanupLib).toContain("const GAP_REPORT_BLOB_PREFIX = 'gap-report-csvs/'");
    expect(cleanupLib).toContain('for (const token of tokens)');
    expect(cleanupLib).toContain('for (const token of listTokens)');
    expect(cleanupLib).toContain('deleteDeflectionReport');
    expect(cleanupLib).toContain('deleteDeflectionReviewDecisions');
    expect(cleanupLib).toContain('cleanupTrackedSubmissions');
    expect(cleanupLib).toContain('cleanupOrphanedBlobs');
    expect(cleanupLib).toContain('MAX_TRACKED_BATCH_LIMIT = 25');
    expect(cleanupLib).toContain('retainedOffset += retainedRows');
    expect(cleanupLib).toContain('export async function purgeGapReportSubmissionByReportRequestId');
    expect(cleanupLib).toContain('getGapReportPurgeTargetByReportRequestId(reportRequestId)');
    expect(cleanupLib.indexOf('await deleteBlob(target.csvBlobUrl)')).toBeLessThan(
      cleanupLib.indexOf('const atlasDelete = await deleteDeflectionReport(target.reportRequestId)'),
    );
    expect(
      cleanupLib.indexOf('const atlasDelete = await deleteDeflectionReport(target.reportRequestId)'),
    ).toBeLessThan(
      cleanupLib.indexOf('await deleteDeflectionReviewDecisions(target.reportRequestId)'),
    );
    expect(
      cleanupLib.indexOf('await deleteDeflectionReviewDecisions(target.reportRequestId)'),
    ).toBeLessThan(
      cleanupLib.indexOf('const deletedRows = await deleteGapReportSubmissions([target.requestId])'),
    );

    expect(reviewDecisionsDatabase).toContain('export async function deleteDeflectionReviewDecisions');
    expect(reviewDecisionsDatabase).toContain('DELETE FROM portfolio_deflection_review_decisions');
    expect(reviewDecisionsDatabase).toContain('WHERE request_id = $1');
    expect(cleanupLib.indexOf('await deleteDeflectionReport(submission.reportRequestId)')).toBeLessThan(
      cleanupLib.indexOf('await deleteDeflectionReviewDecisions(submission.reportRequestId)'),
    );
    expect(
      cleanupLib.indexOf('await deleteDeflectionReviewDecisions(submission.reportRequestId)'),
    ).toBeLessThan(cleanupLib.indexOf('deletedRequestIds.push(submission.requestId)'));
    const reportDeleteHelper = sourceSlice(
      atlasDeflectionClient,
      'export async function deleteDeflectionReport',
      'export type ArtifactFetchResult',
    );
    expect(atlasDeflectionClient).toContain('const REPORT_DELETE_TIMEOUT_MS = 3_000');
    expect(reportDeleteHelper).toContain("structuredRuntimeError('deflection.report_delete.unexpected_status'");

    expect(purgeRoute).toContain('consumeDeflectionRateLimit');
    expect(purgeRoute).toContain("scope: 'deflection-report-purge'");
    expect(purgeRoute).toContain('purgeGapReportSubmissionByReportRequestId(requestId)');
    expect(purgeRoute).toContain('Report not found or already deleted.');
    expect(purgeControl).toContain("fetch('/api/deflection-report-purge'");
    expect(purgeControl).toContain('Delete this upload and report');
    expect(purgeControl).toContain('Confirm delete');
    expect(resultsPage).toContain('<DeflectionReportPurgeControl requestId={requestId} />');
    expect(modelPage).toContain('<DeflectionReportPurgeControl requestId={requestId} />');
    expect(artifactPage).toContain('<DeflectionReportPurgeControl requestId={requestId} />');
    expect(resultsRoute).toContain('requestId={requestId}');

    expect(landingConfig).toContain(
      'If your export tool can remove names, emails, phone numbers, or other private details, do that first',
    );
    expect(landingConfig).toContain(
      'The intake minimizes common contact identifiers in the CSV body before upload',
    );
    expect(landingConfig).toContain(
      'backend redacts supported PII patterns from generated Snapshot and report outputs',
    );
    expect(landingConfig).toContain('We do not need PII to find repeat questions');
    expect(landingConfig).not.toContain('we drop PII in our intake step');

    expect(securityPage).toContain('browser CSV minimization');
    expect(securityPage).toContain('backend redaction for supported report-output PII patterns');
    expect(securityPage).toContain(
      'Uploaded CSV ticket exports and local submission records are deleted after 30 days',
    );
    expect(securityPage).toContain('Generated report data is handled by the downstream');
    expect(compactSecurityPage).toContain('This does not guarantee removal of every name, account number, or');
    expect(compactSecurityPage).toContain(
      'redacts supported PII patterns from generated Snapshot and report outputs before storage or delivery',
    );
    expect(securityPage).not.toContain('No PII ever leaves your browser');
    expect(securityPage).not.toContain('all PII is removed');
    expect(securityPage).not.toContain('no PII can appear');
    expect(securityPage).not.toContain('automatically and completely deleted');
    expect(securityPage).not.toContain('AES-256');
    expect(securityPage).not.toContain('zero training data leaks');
  });
});

describe('deflection CSV upload privacy route', () => {
  it('rate-limits upload token creation by IP before Blob handles the request', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await uploadPOST(
        uploadRequest('203.0.113.10', `ip-bucket-${attempt}@example.com`),
      );
      expect(response.status).toBe(200);
    }

    const ipLimited = await uploadPOST(uploadRequest('203.0.113.10', 'ip-bucket-6@example.com'));
    expect(ipLimited.status).toBe(429);
    expect(Number(ipLimited.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(await readJson(ipLimited)).toEqual({
      error: 'Too many upload attempts. Please try again later.',
    });
    expect(uploadHandleCalls).toBe(5);
    expect(uploadGeneratedTokens).toBe(5);
  });

  it('rate-limits upload token creation by normalized email inside the Blob token callback', async () => {
    resetModuleCaches();
    uploadHandleCalls = 0;
    uploadGeneratedTokens = 0;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await uploadPOST(
        uploadRequest(`198.51.100.${attempt + 10}`, 'buyer@example.com'),
      );
      expect(response.status).toBe(200);
    }

    const emailLimited = await uploadPOST(uploadRequest('198.51.100.99', 'BUYER@example.com'));
    expect(emailLimited.status).toBe(429);
    expect(Number(emailLimited.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(await readJson(emailLimited)).toEqual({
      error: 'Too many upload attempts. Please try again later.',
    });
    expect(uploadHandleCalls).toBe(6);
    expect(uploadGeneratedTokens).toBe(5);
  });
});

describe('deflection CSV cleanup privacy contract', () => {
  it('deletes tracked blobs before reports, keeps failed rows, and uses token fallback', async () => {
    seedExpiredRows();

    const result = await cleanupExpiredGapReportData({ retentionDays: 30, limit: 2 });

    expect(result.deletedTrackedBlobs).toBe(4);
    expect(result.deletedDatabaseRows).toBe(3);
    expect(result.deletedOrphanedBlobs).toBe(2);
    expect(result.errors).toEqual([
      'Failed to delete ATLAS report report-failed for request failed-row: error',
    ]);
    expect(listCalls).toEqual(['private-token', 'legacy-token']);
    expect(cleanupPageRequests).toEqual([
      { limit: 2, offset: 0 },
      { limit: 2, offset: 1 },
      { limit: 2, offset: 1 },
    ]);
    expect(fetchCalls.map((call) => call.url)).toEqual([
      'https://atlas.example.test/api/v1/content-ops/deflection-reports/report-deleted',
      'https://atlas.example.test/api/v1/content-ops/deflection-reports/report-failed',
      'https://atlas.example.test/api/v1/content-ops/deflection-reports/report-gone',
      'https://atlas.example.test/api/v1/content-ops/deflection-reports/report-after-failure',
    ]);
    expect(reviewDecisionDeletes).toEqual([
      'report-deleted',
      'report-gone',
      'report-after-failure',
    ]);
    expect(dbState.deletedSubmissionIds).toEqual([
      'legacy-row',
      'gone-row',
      'after-failure-row',
    ]);

    const trackedBlobIndex = cleanupEvents.indexOf(
      'blob:https://legacy.example/gap-report-csvs/tracked.csv:legacy-token',
    );
    const reportDeleteIndex = cleanupEvents.indexOf('atlas:report-deleted');
    const reviewDeleteIndex = cleanupEvents.indexOf('review-decisions:report-deleted');
    expect(trackedBlobIndex).toBeGreaterThanOrEqual(0);
    expect(reportDeleteIndex).toBeGreaterThanOrEqual(0);
    expect(reviewDeleteIndex).toBeGreaterThanOrEqual(0);
    expect(trackedBlobIndex).toBeLessThan(reportDeleteIndex);
    expect(reportDeleteIndex).toBeLessThan(reviewDeleteIndex);
    const orphanBlobIndex = cleanupEvents.indexOf(
      'blob:https://private.example/gap-report-csvs/orphan.csv:private-token',
    );
    expect(orphanBlobIndex).toBeGreaterThanOrEqual(0);
    expect(reviewDeleteIndex).toBeLessThan(orphanBlobIndex);
    expect(delCalls.map((call) => call.token)).toEqual([
      'private-token',
      'legacy-token',
      'private-token',
      'private-token',
      'private-token',
      'private-token',
      'private-token',
      'legacy-token',
    ]);
    expect(
      dbState.queries.some((call) =>
        /DELETE FROM portfolio_deflection_review_decisions/.test(call.sql),
      ),
    ).toBe(true);
  });

  it('retries a previously retained row when the blob is already gone', async () => {
    seedExpiredRows();
    await cleanupExpiredGapReportData({ retentionDays: 30, limit: 2 });
    atlasDeleteFailures = new Set();
    missingBlobUrls.add('https://private.example/gap-report-csvs/failed.csv');

    const retryResult = await cleanupExpiredGapReportData({ retentionDays: 30, limit: 2 });

    expect(retryResult.deletedTrackedBlobs).toBe(1);
    expect(retryResult.deletedDatabaseRows).toBe(1);
    expect(retryResult.deletedOrphanedBlobs).toBe(2);
    expect(retryResult.errors).toEqual([]);
    expect(dbState.deletedSubmissionIds).toEqual([
      'legacy-row',
      'gone-row',
      'after-failure-row',
      'failed-row',
    ]);
    expect(fetchCalls.at(-1)?.url).toBe(
      'https://atlas.example.test/api/v1/content-ops/deflection-reports/report-failed',
    );
  });

  it('purges a user-requested report in blob, ATLAS, review, then database order', async () => {
    dbState.purgeTargets = {
      'report-purge': {
        request_id: 'purge-row',
        report_request_id: 'report-purge',
        csv_blob_url: 'https://private.example/gap-report-csvs/purge.csv',
      },
    };
    cleanupEvents = [];

    await expect(purgeGapReportSubmissionByReportRequestId('report-purge')).resolves.toEqual({
      ok: true,
      status: 'purged',
    });

    expect(dbState.deletedSubmissionIds).toEqual(['purge-row']);
    expect(fetchCalls.map((call) => call.url)).toEqual([
      'https://atlas.example.test/api/v1/content-ops/deflection-reports/report-purge',
    ]);
    expect(reviewDecisionDeletes).toEqual(['report-purge']);
    expect(cleanupEvents).toEqual([
      'blob:https://private.example/gap-report-csvs/purge.csv:private-token',
      'atlas:report-purge',
      'review-decisions:report-purge',
    ]);
  });
});
