import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

function assertIncludes(haystack, needle, context) {
  assert.ok(haystack.includes(needle), `${context}: expected to find ${needle}`);
}

function assertNotIncludes(haystack, needle, context) {
  assert.equal(haystack.includes(needle), false, `${context}: unexpected ${needle}`);
}

function sourceSlice(haystack, startNeedle, endNeedle, context) {
  const start = haystack.indexOf(startNeedle);
  assert.notEqual(start, -1, `${context}: expected to find ${startNeedle}`);
  const end = haystack.indexOf(endNeedle, start);
  assert.notEqual(end, -1, `${context}: expected to find ${endNeedle}`);
  return haystack.slice(start, end);
}

const intakePage = await source('src/components/landing/SupportTicketCsvIntakePage.tsx');
const uploadRoute = await source('src/app/api/gap-report-intake/upload/route.ts');
const recordRoute = await source('src/app/api/gap-report-intake/record/route.ts');
const intakeLib = await source('src/lib/gap-report-intake.ts');
const adminCsvRoute = await source('src/app/admin/intake/gap-report/[requestId]/csv/route.ts');
const cleanupLib = await source('src/lib/gap-report-cleanup.ts');
const landingConfig = await source('src/app/systems/support-ticket-deflection/landingConfig.tsx');

assertIncludes(intakePage, "access: 'private'", 'CSV client upload');
assertIncludes(intakePage, 'contentType,', 'CSV client upload content type');
assertIncludes(intakePage, 'CSV_UPLOAD_CONTENT_TYPES', 'CSV client upload content type allow-list');
assertNotIncludes(intakePage, "access: 'public'", 'CSV client upload');
assertIncludes(intakePage, 'Privacy: we delete your CSV after 30 days', 'CSV intake confirmation copy');

assertIncludes(uploadRoute, "pathname.startsWith('gap-report-csvs/')", 'CSV upload token scope');
assertIncludes(uploadRoute, 'allowedContentTypes: CSV_CONTENT_TYPES', 'CSV upload content type gate');
assertIncludes(uploadRoute, 'maximumSizeInBytes: MAX_CSV_BYTES', 'CSV upload size gate');

assertIncludes(recordRoute, "blobUrl.startsWith('https://')", 'CSV record upload reference');
assertIncludes(recordRoute, "blobUrl.includes('/gap-report-csvs/')", 'CSV record namespace check');
assertIncludes(recordRoute, 'await head(blobUrl', 'CSV record ownership check');
assertIncludes(recordRoute, 'gapReportBlobTokens', 'CSV record ownership token fallback');

assertIncludes(intakeLib, 'Private blob reference: ${record.csvBlobUrl}', 'CSV notification copy');
assertNotIncludes(intakeLib, 'Download: ${record.csvBlobUrl}', 'CSV notification copy');
assertIncludes(
  intakeLib,
  'Privacy: we delete the uploaded CSV and submission record after 30 days.',
  'CSV confirmation retention copy',
);
const writeTokenResolver = sourceSlice(
  intakeLib,
  'export function gapReportBlobToken()',
  'export function gapReportBlobTokens()',
  'CSV Blob write token resolver',
);
assertIncludes(
  writeTokenResolver,
  'return cleanBlobToken(process.env.BLOB_READ_WRITE_TOKEN);',
  'CSV Blob write token resolver',
);
assertNotIncludes(
  writeTokenResolver,
  'ticke_deflection_blob_READ_WRITE_TOKEN',
  'CSV Blob write token resolver',
);
assert.ok(
  intakeLib.indexOf('cleanBlobToken(process.env.BLOB_READ_WRITE_TOKEN)') <
    intakeLib.indexOf('cleanBlobToken(process.env.ticke_deflection_blob_READ_WRITE_TOKEN)'),
  'CSV Blob URL fallback list prefers the private-capable default store before the legacy public store',
);
assertIncludes(intakeLib, 'export function gapReportBlobTokens()', 'CSV Blob token fallback list');

assertIncludes(adminCsvRoute, 'verifyAdminIntakeCookie', 'admin CSV auth');
assertIncludes(adminCsvRoute, "access: 'private'", 'admin CSV private Blob read');
assertIncludes(adminCsvRoute, 'gapReportBlobTokens', 'admin CSV Blob token fallback');
assertIncludes(adminCsvRoute, "headers.set('Cache-Control', 'no-store')", 'admin CSV cache control');

assertIncludes(cleanupLib, "const GAP_REPORT_BLOB_PREFIX = 'gap-report-csvs/'", 'CSV cleanup prefix');
assertIncludes(cleanupLib, 'for (const token of tokens)', 'CSV cleanup delete token fallback');
assertIncludes(cleanupLib, 'for (const token of listTokens)', 'CSV cleanup list token fallback');
assertIncludes(cleanupLib, 'cleanupTrackedSubmissions', 'CSV tracked cleanup');
assertIncludes(cleanupLib, 'cleanupOrphanedBlobs', 'CSV orphan cleanup');

assertIncludes(
  landingConfig,
  'If your export tool can remove names, emails, phone numbers, or other private details, do that first',
  'CSV public PII guidance',
);
assertIncludes(landingConfig, 'We do not need PII to find repeat questions', 'CSV public PII guidance');
assertNotIncludes(landingConfig, 'we drop PII in our intake step', 'CSV public PII guidance');

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-csv-privacy-'));
try {
  const compiledPath = join(testDir, 'gap-report-cleanup.cjs');
  const blobStubDir = join(testDir, 'node_modules', '@vercel', 'blob');
  await mkdir(blobStubDir, { recursive: true });
  await writeFile(
    join(blobStubDir, 'index.js'),
    `
exports.del = (...args) => globalThis.__csvPrivacyBlobDel(...args);
exports.list = (...args) => globalThis.__csvPrivacyBlobList(...args);
`,
  );
  await writeFile(
    join(testDir, 'gap-report-intake.js'),
    `
exports.gapReportBlobTokens = () => globalThis.__csvPrivacyBlobTokens;
exports.gapReportBlobToken = () => globalThis.__csvPrivacyBlobTokens[0];
`,
  );
  await writeFile(
    join(testDir, 'gap-report-intake-database.js'),
    `
exports.gapReportDatabaseConfigured = () => true;
exports.listExpiredGapReportSubmissions = async () => {
  const next = globalThis.__csvPrivacyExpiredBatches.shift();
  return next || [];
};
exports.deleteGapReportSubmissions = async (ids) => ids.length;
`,
  );

  const compiled = ts.transpileModule(cleanupLib, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledPath, compiled.outputText);

  const oldDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
  const delCalls = [];
  const listCalls = [];
  globalThis.__csvPrivacyBlobTokens = ['private-token', 'legacy-token'];
  globalThis.__csvPrivacyExpiredBatches = [
    [{ requestId: 'legacy-row', csvBlobUrl: 'https://legacy.example/gap-report-csvs/tracked.csv' }],
    [],
  ];
  globalThis.__csvPrivacyBlobDel = async (url, options) => {
    delCalls.push({ url, token: options?.token });
    if (url.includes('legacy.example') && options?.token !== 'legacy-token') {
      throw new Error('wrong store');
    }
    if (url.includes('private.example') && options?.token !== 'private-token') {
      throw new Error('wrong store');
    }
  };
  globalThis.__csvPrivacyBlobList = async (options) => {
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
  };

  const require = createRequire(compiledPath);
  const { cleanupExpiredGapReportData } = require(compiledPath);
  const result = await cleanupExpiredGapReportData({ retentionDays: 30, limit: 10 });

  assert.equal(result.deletedTrackedBlobs, 1);
  assert.equal(result.deletedDatabaseRows, 1);
  assert.equal(result.deletedOrphanedBlobs, 2);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(listCalls, ['private-token', 'legacy-token']);
  assert.deepEqual(
    delCalls.map((call) => call.token),
    ['private-token', 'legacy-token', 'private-token', 'private-token', 'legacy-token'],
    'cleanup retries legacy token for legacy-store URLs without blocking private-store deletes',
  );
} finally {
  delete globalThis.__csvPrivacyBlobTokens;
  delete globalThis.__csvPrivacyExpiredBatches;
  delete globalThis.__csvPrivacyBlobDel;
  delete globalThis.__csvPrivacyBlobList;
  await rm(testDir, { recursive: true, force: true });
}

console.log('Deflection CSV privacy contract tests passed.');
