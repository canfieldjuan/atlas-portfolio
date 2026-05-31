import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

function assertIncludes(haystack, needle, context) {
  assert.ok(haystack.includes(needle), `${context}: expected to find ${needle}`);
}

function assertNotIncludes(haystack, needle, context) {
  assert.equal(haystack.includes(needle), false, `${context}: unexpected ${needle}`);
}

const intakePage = await source('src/components/landing/SupportTicketCsvIntakePage.tsx');
const uploadRoute = await source('src/app/api/gap-report-intake/upload/route.ts');
const recordRoute = await source('src/app/api/gap-report-intake/record/route.ts');
const intakeLib = await source('src/lib/gap-report-intake.ts');
const adminCsvRoute = await source('src/app/admin/intake/gap-report/[requestId]/csv/route.ts');
const cleanupLib = await source('src/lib/gap-report-cleanup.ts');
const landingConfig = await source('src/app/systems/support-ticket-deflection/landingConfig.tsx');

assertIncludes(intakePage, "access: 'private'", 'CSV client upload');
assertNotIncludes(intakePage, "access: 'public'", 'CSV client upload');
assertIncludes(intakePage, 'Privacy: we delete your CSV after 30 days', 'CSV intake confirmation copy');

assertIncludes(uploadRoute, "pathname.startsWith('gap-report-csvs/')", 'CSV upload token scope');
assertIncludes(uploadRoute, 'allowedContentTypes: CSV_CONTENT_TYPES', 'CSV upload content type gate');
assertIncludes(uploadRoute, 'maximumSizeInBytes: MAX_CSV_BYTES', 'CSV upload size gate');

assertIncludes(recordRoute, "blobUrl.startsWith('https://')", 'CSV record upload reference');
assertIncludes(recordRoute, "blobUrl.includes('/gap-report-csvs/')", 'CSV record namespace check');
assertIncludes(recordRoute, 'await head(blobUrl', 'CSV record ownership check');
assertIncludes(recordRoute, 'token: gapReportBlobToken()', 'CSV record ownership token');

assertIncludes(intakeLib, 'Private blob reference: ${record.csvBlobUrl}', 'CSV notification copy');
assertNotIncludes(intakeLib, 'Download: ${record.csvBlobUrl}', 'CSV notification copy');
assertIncludes(
  intakeLib,
  'Privacy: we delete the uploaded CSV and submission record after 30 days.',
  'CSV confirmation retention copy',
);

assertIncludes(adminCsvRoute, 'verifyAdminIntakeCookie', 'admin CSV auth');
assertIncludes(adminCsvRoute, "access: 'private'", 'admin CSV private Blob read');
assertIncludes(adminCsvRoute, 'token: gapReportBlobToken()', 'admin CSV Blob token');
assertIncludes(adminCsvRoute, "headers.set('Cache-Control', 'no-store')", 'admin CSV cache control');

assertIncludes(cleanupLib, "const GAP_REPORT_BLOB_PREFIX = 'gap-report-csvs/'", 'CSV cleanup prefix');
assertIncludes(cleanupLib, 'await del(url, { token: gapReportBlobToken() })', 'CSV cleanup token');
assertIncludes(cleanupLib, 'cleanupTrackedSubmissions', 'CSV tracked cleanup');
assertIncludes(cleanupLib, 'cleanupOrphanedBlobs', 'CSV orphan cleanup');

assertIncludes(
  landingConfig,
  'If your export tool can remove names, emails, phone numbers, or other private details, do that first',
  'CSV public PII guidance',
);
assertIncludes(landingConfig, 'We do not need PII to find repeat questions', 'CSV public PII guidance');
assertNotIncludes(landingConfig, 'we drop PII in our intake step', 'CSV public PII guidance');

console.log('Deflection CSV privacy contract tests passed.');
