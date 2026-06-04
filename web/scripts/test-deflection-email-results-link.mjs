import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-email-link-'));
const sourceUrl = new URL('../src/lib/gap-report-intake.ts', import.meta.url);
const compiledPath = join(testDir, 'gap-report-intake.cjs');
const ENV_KEYS = [
  'GAP_REPORT_NOTIFICATION_RESEND_API_KEY',
  'GAP_REPORT_NOTIFICATION_FROM_EMAIL',
  'GAP_REPORT_NOTIFICATION_TO_EMAIL',
];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
let calls = [];

function resetEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  process.env.GAP_REPORT_NOTIFICATION_RESEND_API_KEY = 'resend_unit';
  process.env.GAP_REPORT_NOTIFICATION_FROM_EMAIL = 'reports@example.com';
  process.env.GAP_REPORT_NOTIFICATION_TO_EMAIL = 'ops@example.com';
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
    if (originalEnv[key] !== undefined) {
      process.env[key] = originalEnv[key];
    }
  }
}

function installFetchMock() {
  calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({
      url: String(url),
      body: JSON.parse(String(init?.body ?? '{}')),
    });
    return new Response(JSON.stringify({ id: 'email_unit' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}

function sentText(index) {
  return calls[index]?.body?.text ?? '';
}

const baseInput = {
  name: 'Alex Lee',
  email: 'alex@example.com',
  companyName: 'Effingham Office Maids',
  supportPlatform: 'helpscout',
  csvBlobUrl: 'https://blob.vercel-storage.com/gap-report-csvs/unit/tickets.csv',
  csvFilename: 'tickets.csv',
  csvSizeBytes: 4096,
  sourcePage: '/systems/support-ticket-deflection/intake',
  sourceOffer: 'support-ticket-deflection-intake',
};

try {
  await writeFile(
    join(testDir, 'gap-report-intake-database.js'),
    'exports.persistGapReportSubmission = async () => true;\n',
  );
  await writeFile(
    join(testDir, 'deflection-pricing.js'),
    [
      "exports.DEFLECTION_DEFAULT_PRICE_VARIANT_ID = 'standard';",
      "exports.resolveDeflectionPriceVariant = (value) => {",
      "  if (value === undefined || value === null || value === 'standard') return { id: 'standard' };",
      "  if (value === 'partner') return { id: 'partner' };",
      '  return null;',
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(join(testDir, 'seo.js'), "exports.SITE_URL = 'https://juancanfield.com';\n");

  const source = await readFile(sourceUrl, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledPath, compiled.outputText);

  const require = createRequire(compiledPath);
  const {
    deflectionResultsPath,
    parseGapReportMetadata,
    recordGapReportSubmission,
  } = require(compiledPath);

  assert.equal(
    deflectionResultsPath('content-ops-unit-123', 'partner'),
    '/systems/support-ticket-deflection/results/content-ops-unit-123?priceVariant=partner',
  );
  assert.deepEqual(parseGapReportMetadata({ ...baseInput, priceVariant: 'partner' }).value.priceVariant, 'partner');
  assert.deepEqual(parseGapReportMetadata({ ...baseInput, priceVariant: 'unknown' }), {
    ok: false,
    error: 'Invalid price variant.',
  });

  resetEnv();
  installFetchMock();
  const withLink = await recordGapReportSubmission({
    ...baseInput,
    reportRequestId: 'content-ops-unit-123',
  });
  assert.equal(withLink.status, 'submitted');
  assert.equal(calls.length, 2);
  assert.match(sentText(0), /Report request ID: content-ops-unit-123/);
  assert.match(
    sentText(0),
    /Results: https:\/\/juancanfield\.com\/systems\/support-ticket-deflection\/results\/content-ops-unit-123/,
  );
  assert.match(sentText(1), /Your free Deflection Snapshot is ready:/);
  assert.match(
    sentText(1),
    /https:\/\/juancanfield\.com\/systems\/support-ticket-deflection\/results\/content-ops-unit-123/,
  );
  assert.doesNotMatch(sentText(1), /within 24 hours/);

  installFetchMock();
  const partnerLink = await recordGapReportSubmission({
    ...baseInput,
    priceVariant: 'partner',
    reportRequestId: 'content-ops-unit-123',
  });
  assert.equal(partnerLink.status, 'submitted');
  assert.equal(calls.length, 2);
  assert.match(
    sentText(0),
    /Results: https:\/\/juancanfield\.com\/systems\/support-ticket-deflection\/results\/content-ops-unit-123\?priceVariant=partner/,
  );
  assert.match(
    sentText(1),
    /https:\/\/juancanfield\.com\/systems\/support-ticket-deflection\/results\/content-ops-unit-123\?priceVariant=partner/,
  );

  installFetchMock();
  const withoutLink = await recordGapReportSubmission(baseInput);
  assert.equal(withoutLink.status, 'submitted');
  assert.equal(calls.length, 2);
  assert.doesNotMatch(sentText(0), /Report request ID:/);
  assert.doesNotMatch(sentText(0), /\/systems\/support-ticket-deflection\/results\//);
  assert.doesNotMatch(sentText(1), /Your free Deflection Snapshot is ready:/);
  assert.match(sentText(1), /within 24 hours/);

  installFetchMock();
  await recordGapReportSubmission({
    ...baseInput,
    reportRequestId: 'https://evil.example/report',
  });
  assert.doesNotMatch(sentText(0), /https:\/\/evil\.example/);
  assert.doesNotMatch(sentText(1), /https:\/\/evil\.example/);

  console.log('Deflection email results-link tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  restoreEnv();
  await rm(testDir, { recursive: true, force: true });
}
