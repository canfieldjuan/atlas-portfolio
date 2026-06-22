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
const intakeForm = await source('src/components/landing/SupportTicketCsvIntakeForm.tsx');
const uploadRoute = await source('src/app/api/gap-report-intake/upload/route.ts');
const recordRoute = await source('src/app/api/gap-report-intake/record/route.ts');
const intakeLib = await source('src/lib/gap-report-intake.ts');
const adminCsvRoute = await source('src/app/admin/intake/gap-report/[requestId]/csv/route.ts');
const cleanupLib = await source('src/lib/gap-report-cleanup.ts');
const landingConfig = await source('src/app/systems/support-ticket-deflection/landingConfig.tsx');
const securityPage = await source('src/app/security/page.tsx');
const compactSecurityPage = securityPage.replace(/\s+/g, ' ');

const intakeClientSource = `${intakePage}\n${intakeForm}`;
const compactIntakeClientSource = intakeClientSource.replace(/\s+/g, ' ');

assertIncludes(intakeClientSource, "access: 'private'", 'CSV client upload');
assertIncludes(intakeClientSource, 'contentType,', 'CSV client upload content type');
assertIncludes(intakeClientSource, 'CSV_UPLOAD_CONTENT_TYPES', 'CSV client upload content type allow-list');
assertNotIncludes(intakeClientSource, "access: 'public'", 'CSV client upload');
assertIncludes(intakeClientSource, 'deleted after 30 days', 'CSV intake confirmation copy');
assertIncludes(intakeClientSource, 'SCRUBBED_CSV_FILENAME', 'CSV scrubbed generic filename');
assertIncludes(intakeClientSource, 'new TextDecoder(\'utf-8\', { fatal: true })', 'CSV scrub UTF-8 gate');
assertIncludes(intakeClientSource, 'looksLikeUtf16(bytes)', 'CSV scrub UTF-16 rejection');
assertIncludes(intakeClientSource, 'Upload stopped before any file was sent', 'CSV scrub fail-closed copy');
assertIncludes(intakeClientSource, 'Browser + backend PII controls', 'CSV scrub scoped public copy');
assertIncludes(
  intakeClientSource,
  'Your browser minimizes common contact identifiers in the CSV',
  'CSV scrub scoped public copy',
);
assertIncludes(intakeClientSource, 'body before upload', 'CSV scrub scoped public copy');
assertIncludes(
  compactIntakeClientSource,
  'backend redacts supported PII patterns from generated',
  'CSV backend redaction public copy',
);
assertNotIncludes(intakeClientSource, 'using raw file', 'CSV scrub fail-closed upload path');
assertNotIncludes(intakeClientSource, 'let fileToUpload: File = file', 'CSV scrub fail-closed upload path');
assertNotIncludes(intakeClientSource, 'never leave your device', 'CSV scrub scoped public copy');
assertNotIncludes(intakeClientSource, 'never make it into the report', 'CSV scrub scoped public copy');

assertIncludes(uploadRoute, "pathname.startsWith('gap-report-csvs/')", 'CSV upload token scope');
assertIncludes(uploadRoute, 'allowedContentTypes: CSV_CONTENT_TYPES', 'CSV upload content type gate');
assertIncludes(uploadRoute, 'maximumSizeInBytes: MAX_CSV_BYTES', 'CSV upload size gate');
assertIncludes(uploadRoute, 'consumeDeflectionRateLimit', 'CSV upload IP rate limit');
assertIncludes(uploadRoute, 'consumeDeflectionIdentifierRateLimit', 'CSV upload email rate limit');
assertIncludes(uploadRoute, 'UploadRateLimitError', 'CSV upload token-callback rate limit');

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
assertIncludes(
  landingConfig,
  'The intake minimizes common contact identifiers in the CSV body before upload',
  'CSV public PII guidance',
);
assertIncludes(
  landingConfig,
  'backend redacts supported PII patterns from generated Snapshot and report outputs',
  'CSV public PII guidance',
);
assertIncludes(landingConfig, 'We do not need PII to find repeat questions', 'CSV public PII guidance');
assertNotIncludes(landingConfig, 'we drop PII in our intake step', 'CSV public PII guidance');

assertIncludes(securityPage, 'browser CSV minimization', 'security page CSV data safety copy');
assertIncludes(
  securityPage,
  'backend redaction for supported report-output PII patterns',
  'security page CSV data safety copy',
);
assertIncludes(
  securityPage,
  'Uploaded CSV ticket exports and local submission records are deleted after 30 days',
  'security page retention scope',
);
assertIncludes(
  securityPage,
  'Generated report data is handled by the downstream',
  'security page report-data retention scope',
);
assertIncludes(
  compactSecurityPage,
  'This does not guarantee removal of every name, account number, or',
  'security page scoped PII claim',
);
assertIncludes(
  compactSecurityPage,
  'redacts supported PII patterns from generated Snapshot and report outputs before storage or delivery',
  'security page scoped PII claim',
);
assertNotIncludes(securityPage, 'No PII ever leaves your browser', 'security page scoped PII claim');
assertNotIncludes(securityPage, 'all PII is removed', 'security page scoped PII claim');
assertNotIncludes(securityPage, 'no PII can appear', 'security page scoped PII claim');
assertNotIncludes(securityPage, 'automatically and completely deleted', 'security page retention scope');
assertNotIncludes(securityPage, 'AES-256', 'security page encryption scope');
assertNotIncludes(securityPage, 'zero training data leaks', 'security page deterministic processing copy');

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-csv-privacy-'));
try {
  const compiledUploadRoutePath = join(testDir, 'gap-report-upload-route.cjs');
  const compiledPath = join(testDir, 'gap-report-cleanup.cjs');
  const libStubDir = join(testDir, 'node_modules', '@', 'lib');
  const nextStubDir = join(testDir, 'node_modules', 'next');
  const blobStubDir = join(testDir, 'node_modules', '@vercel', 'blob');
  await mkdir(libStubDir, { recursive: true });
  await mkdir(nextStubDir, { recursive: true });
  await mkdir(blobStubDir, { recursive: true });
  await writeFile(
    join(testDir, 'node_modules', '@vercel', 'blob', 'client.js'),
    `
exports.handleUpload = async (options) => {
  globalThis.__csvPrivacyUploadHandleCalls = (globalThis.__csvPrivacyUploadHandleCalls || 0) + 1;
  const payload = globalThis.__csvPrivacyUploadClientPayload || JSON.stringify({
    name: 'Alex Lee',
    email: 'buyer@example.com',
    companyName: 'Effingham Office Maids',
    supportPlatform: 'helpscout',
    csvFilename: 'tickets.csv',
    sourceOffer: 'support-ticket-deflection-intake'
  });
  const tokenPayload = await options.onBeforeGenerateToken('gap-report-csvs/unit.csv', payload);
  globalThis.__csvPrivacyUploadGeneratedTokens = (globalThis.__csvPrivacyUploadGeneratedTokens || 0) + 1;
  return { ok: true, tokenPayload };
};
`,
  );
  await writeFile(
    join(nextStubDir, 'server.js'),
    "exports.NextResponse = { json: (body, init) => Response.json(body, init) };\n",
  );
  await writeFile(
    join(libStubDir, 'gap-report-intake.js'),
    `
exports.gapReportBlobToken = () => 'blob-token';
exports.parseGapReportMetadata = (raw) => {
  const email = typeof raw?.email === 'string' ? raw.email.trim() : '';
  if (!email) return { ok: false, error: 'A valid work email is required.' };
  return { ok: true, value: { ...raw, email } };
};
`,
  );
  await writeFile(
    join(libStubDir, 'deflection-rate-limit.js'),
    ts.transpileModule(await source('src/lib/deflection-rate-limit.ts'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  );
  await writeFile(
    compiledUploadRoutePath,
    ts.transpileModule(uploadRoute, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
  );
  const uploadRequire = createRequire(compiledUploadRoutePath);
  const { POST: uploadPOST } = uploadRequire(compiledUploadRoutePath);

  function uploadRequest(ip, email) {
    globalThis.__csvPrivacyUploadClientPayload = JSON.stringify({
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

  delete globalThis.__atlasDeflectionRateLimitStore;
  globalThis.__csvPrivacyUploadHandleCalls = 0;
  globalThis.__csvPrivacyUploadGeneratedTokens = 0;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await uploadPOST(
      uploadRequest('203.0.113.10', `ip-bucket-${attempt}@example.com`),
    );
    assert.equal(response.status, 200);
  }
  const ipLimited = await uploadPOST(uploadRequest('203.0.113.10', 'ip-bucket-6@example.com'));
  assert.equal(ipLimited.status, 429);
  assert.equal(Number(ipLimited.headers.get('Retry-After')) > 0, true);
  assert.deepEqual(await ipLimited.json(), {
    error: 'Too many upload attempts. Please try again later.',
  });
  assert.equal(globalThis.__csvPrivacyUploadHandleCalls, 5);
  assert.equal(globalThis.__csvPrivacyUploadGeneratedTokens, 5);

  delete globalThis.__atlasDeflectionRateLimitStore;
  globalThis.__csvPrivacyUploadHandleCalls = 0;
  globalThis.__csvPrivacyUploadGeneratedTokens = 0;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await uploadPOST(
      uploadRequest(`198.51.100.${attempt + 10}`, 'buyer@example.com'),
    );
    assert.equal(response.status, 200);
  }
  const emailLimited = await uploadPOST(uploadRequest('198.51.100.99', 'BUYER@example.com'));
  assert.equal(emailLimited.status, 429);
  assert.equal(Number(emailLimited.headers.get('Retry-After')) > 0, true);
  assert.deepEqual(await emailLimited.json(), {
    error: 'Too many upload attempts. Please try again later.',
  });
  assert.equal(globalThis.__csvPrivacyUploadHandleCalls, 6);
  assert.equal(globalThis.__csvPrivacyUploadGeneratedTokens, 5);

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
  delete globalThis.__atlasDeflectionRateLimitStore;
  delete globalThis.__csvPrivacyUploadClientPayload;
  delete globalThis.__csvPrivacyUploadGeneratedTokens;
  delete globalThis.__csvPrivacyUploadHandleCalls;
  delete globalThis.__csvPrivacyBlobTokens;
  delete globalThis.__csvPrivacyExpiredBatches;
  delete globalThis.__csvPrivacyBlobDel;
  delete globalThis.__csvPrivacyBlobList;
  await rm(testDir, { recursive: true, force: true });
}

console.log('Deflection CSV privacy contract tests passed.');
