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
  'DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN',
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
  process.env.DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN = 'partner_unit';
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
    [
      'exports.persistGapReportSubmission = async (record) => {',
      '  globalThis.__gapReportPersistedRecords = globalThis.__gapReportPersistedRecords || [];',
      '  globalThis.__gapReportPersistedRecords.push(record);',
      '  return true;',
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(testDir, 'deflection-pricing.js'),
    [
      "exports.DEFLECTION_DEFAULT_PRICE_VARIANT_ID = 'standard';",
      "exports.DEFLECTION_PARTNER_PRICE_VARIANT_ID = 'partner';",
      "exports.resolveDeflectionPriceVariant = (value) => {",
      "  if (value === undefined || value === null || value === 'standard') return { id: 'standard' };",
      "  if (value === 'partner') return { id: 'partner' };",
      '  return null;',
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(testDir, 'deflection-partner-access.js'),
    [
      "exports.DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN_PARAM = 'partnerToken';",
      'exports.hasDeflectionPartnerPriceAccessToken = (value) => {',
      "  return typeof value === 'string' && value.trim() === process.env.DEFLECTION_PARTNER_PRICE_ACCESS_TOKEN;",
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(join(testDir, 'seo.js'), "exports.SITE_URL = 'https://juancanfield.com';\n");
  await writeFile(
    join(testDir, 'deflection-snapshot-pdf.js'),
    [
      'exports.createDeflectionSnapshotPdfAttachment = ({ snapshot, companyName, resultsUrl }) => ({',
      '  filename: "deflection-snapshot-unit.pdf",',
      '  content: Buffer.from(JSON.stringify({ companyName, resultsUrl, topQuestions: snapshot.top_questions.length })).toString("base64"),',
      '});',
      '',
    ].join('\n'),
  );

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
  const snapshotFixture = {
    summary: {
      generated: 3,
      drafted_answer_count: 1,
      no_proven_answer_count: 2,
      repeat_ticket_count: 22,
      source_date_start: '2026-05-01',
      source_date_end: '2026-05-30',
      source_window_days: 30,
    },
    top_questions: [
      {
        rank: 1,
        question: 'How do I cancel?',
        customer_wording: 'cancel my subscription',
        ticket_count: 22,
        weighted_frequency: 34,
      },
    ],
    locked_questions: [{ rank: 2, ticket_count: 11 }],
    teaser: {
      full_answer: {
        rank: 1,
        question: 'How do I cancel?',
        answer: 'Open billing and choose cancel.',
        steps: ['Open billing.', 'Choose cancel.'],
        answer_evidence_status: 'resolution_evidence',
        resolution_evidence_scope: 'scoped',
        weighted_frequency: 34,
        source_count: 22,
      },
      previews: [],
    },
  };

  assert.equal(
    deflectionResultsPath('content-ops-unit-123', 'partner'),
    '/systems/support-ticket-deflection/results/content-ops-unit-123?priceVariant=partner',
  );
  resetEnv();
  assert.deepEqual(parseGapReportMetadata({ ...baseInput, priceVariant: 'partner' }), {
    ok: false,
    error: 'Invalid partner price access token.',
  });
  assert.deepEqual(
    parseGapReportMetadata({
      ...baseInput,
      priceVariant: 'partner',
      partnerToken: 'partner_unit',
    }).value.priceVariant,
    'partner',
  );
  assert.equal(
    JSON.stringify(
      parseGapReportMetadata({
        ...baseInput,
        priceVariant: 'partner',
        partnerToken: 'partner_unit',
      }).value,
    ).includes('partner_unit'),
    false,
  );
  assert.deepEqual(parseGapReportMetadata({ ...baseInput, priceVariant: 'unknown' }), {
    ok: false,
    error: 'Invalid price variant.',
  });

  installFetchMock();
  globalThis.__gapReportPersistedRecords = [];
  const withLink = await recordGapReportSubmission({
    ...baseInput,
    reportRequestId: 'content-ops-unit-123',
  }, { snapshot: snapshotFixture });
  assert.equal(withLink.status, 'submitted');
  assert.equal(calls.length, 2);
  assert.equal(globalThis.__gapReportPersistedRecords.length, 1);
  assert.equal(globalThis.__gapReportPersistedRecords[0].snapshotEmailStatus, 'sent');
  assert.equal(globalThis.__gapReportPersistedRecords[0].confirmationStatus, 'sent');
  assert.equal(globalThis.__gapReportPersistedRecords[0].snapshotEmailError, undefined);
  assert.equal(globalThis.__gapReportPersistedRecords[0].confirmationError, undefined);
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
  assert.match(sentText(1), /save this email or bookmark your results link/);
  assert.match(sentText(1), /upgrade to the full report during that window without re-uploading/);
  assert.doesNotMatch(sentText(1), /within 24 hours/);
  assert.deepEqual(calls[1].body.attachments?.map((attachment) => attachment.filename), [
    'deflection-snapshot-unit.pdf',
  ]);
  assert.deepEqual(JSON.parse(Buffer.from(calls[1].body.attachments[0].content, 'base64')), {
    companyName: 'Effingham Office Maids',
    resultsUrl:
      'https://juancanfield.com/systems/support-ticket-deflection/results/content-ops-unit-123',
    topQuestions: 1,
  });

  installFetchMock();
  globalThis.__gapReportPersistedRecords = [];
  const partnerLink = await recordGapReportSubmission({
    ...baseInput,
    priceVariant: 'partner',
    reportRequestId: 'content-ops-unit-123',
  });
  assert.equal(partnerLink.status, 'submitted');
  assert.equal(calls.length, 2);
  assert.equal(globalThis.__gapReportPersistedRecords[0].snapshotEmailStatus, 'sent');
  assert.equal(globalThis.__gapReportPersistedRecords[0].confirmationStatus, 'sent');
  assert.match(
    sentText(0),
    /Results: https:\/\/juancanfield\.com\/systems\/support-ticket-deflection\/results\/content-ops-unit-123\?priceVariant=partner/,
  );
  assert.match(
    sentText(1),
    /https:\/\/juancanfield\.com\/systems\/support-ticket-deflection\/results\/content-ops-unit-123\?priceVariant=partner/,
  );
  assert.match(sentText(1), /save this email or bookmark your results link/);
  assert.equal(calls[1].body.attachments, undefined);

  installFetchMock();
  globalThis.__gapReportPersistedRecords = [];
  const withoutLink = await recordGapReportSubmission(baseInput);
  assert.equal(withoutLink.status, 'submitted');
  assert.equal(calls.length, 2);
  assert.equal(globalThis.__gapReportPersistedRecords[0].snapshotEmailStatus, 'sent');
  assert.equal(globalThis.__gapReportPersistedRecords[0].confirmationStatus, 'sent');
  assert.doesNotMatch(sentText(0), /Report request ID:/);
  assert.doesNotMatch(sentText(0), /\/systems\/support-ticket-deflection\/results\//);
  assert.doesNotMatch(sentText(1), /Your free Deflection Snapshot is ready:/);
  assert.doesNotMatch(sentText(1), /bookmark your results link/);
  assert.match(sentText(1), /as soon as processing finishes/);
  assert.doesNotMatch(sentText(1), /within 24 hours/);
  assert.equal(calls[1].body.attachments, undefined);

  installFetchMock();
  globalThis.__gapReportPersistedRecords = [];
  await recordGapReportSubmission({
    ...baseInput,
    reportRequestId: 'https://evil.example/report',
  });
  assert.doesNotMatch(sentText(0), /https:\/\/evil\.example/);
  assert.doesNotMatch(sentText(1), /https:\/\/evil\.example/);

  globalThis.fetch = async (url, init) => {
    calls.push({
      url: String(url),
      body: JSON.parse(String(init?.body ?? '{}')),
    });
    return calls.length === 2
      ? new Response('snapshot email rejected', { status: 503 })
      : new Response(JSON.stringify({ id: 'email_unit' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
  };
  calls = [];
  globalThis.__gapReportPersistedRecords = [];
  const failedSnapshotEmail = await recordGapReportSubmission({
    ...baseInput,
    reportRequestId: 'content-ops-unit-456',
  });
  assert.equal(failedSnapshotEmail.status, 'submitted_with_warnings');
  assert.deepEqual(failedSnapshotEmail.warnings, ['Gap Report snapshot email failed.']);
  assert.equal(globalThis.__gapReportPersistedRecords[0].notificationStatus, 'sent');
  assert.equal(globalThis.__gapReportPersistedRecords[0].snapshotEmailStatus, 'failed');
  assert.equal(globalThis.__gapReportPersistedRecords[0].confirmationStatus, 'failed');
  assert.match(
    globalThis.__gapReportPersistedRecords[0].snapshotEmailError,
    /Gap Report snapshot email failed: snapshot email rejected/,
  );
  assert.equal(
    globalThis.__gapReportPersistedRecords[0].confirmationError,
    globalThis.__gapReportPersistedRecords[0].snapshotEmailError,
  );

  console.log('Deflection email results-link tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  restoreEnv();
  await rm(testDir, { recursive: true, force: true });
}
