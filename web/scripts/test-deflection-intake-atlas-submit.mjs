import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-submit-'));
const sourceUrl = new URL('../src/lib/atlas-deflection-client.ts', import.meta.url);
const recordRouteUrl = new URL('../src/app/api/gap-report-intake/record/route.ts', import.meta.url);
const intakePageUrl = new URL(
  '../src/components/landing/SupportTicketCsvIntakePage.tsx',
  import.meta.url,
);
const compiledPath = join(testDir, 'atlas-deflection-client.cjs');
const libStubDir = join(testDir, 'node_modules', '@', 'lib');
const blobStubDir = join(testDir, 'node_modules', '@vercel', 'blob');
const ENV_KEYS = ['ATLAS_API_BASE_URL', 'ATLAS_B2B_SERVICE_TOKEN'];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

let blobCalls = [];
let fetchCalls = [];
let fetchPayload = { request_id: 'content-ops-unit-123' };
let fetchStatus = 200;
let consoleErrors = [];

function resetEnv(values = {}) {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
  Object.assign(process.env, values);
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
    if (originalEnv[key] !== undefined) {
      process.env[key] = originalEnv[key];
    }
  }
}

function resetCalls() {
  blobCalls = [];
  fetchCalls = [];
  fetchPayload = { request_id: 'content-ops-unit-123' };
  fetchStatus = 200;
  consoleErrors = [];
}

function minimalSnapshot(summaryExtras = {}) {
  return {
    summary: {
      generated: 1,
      drafted_answer_count: 1,
      no_proven_answer_count: 0,
      repeat_ticket_count: 1,
      ...summaryExtras,
    },
    top_questions: [],
    locked_questions: [],
    teaser: { full_answer: null, previews: [] },
  };
}

globalThis.__atlasSubmitBlobGet = async (url, options) => {
  blobCalls.push({ url, options });
  return {
    statusCode: 200,
    stream: new Blob(['ticket_id,message\n1,How do I export reports?\n'], {
      type: 'text/csv',
    }).stream(),
    blob: { contentType: 'text/csv' },
  };
};

globalThis.fetch = async (url, init) => {
  fetchCalls.push({
    url: String(url),
    headers: init?.headers ?? {},
    body: init?.body,
  });
  return Response.json(fetchPayload, { status: fetchStatus });
};
console.error = (...args) => {
  consoleErrors.push(args.join(' '));
};

try {
  await mkdir(libStubDir, { recursive: true });
  await mkdir(blobStubDir, { recursive: true });
  await writeFile(
    join(libStubDir, 'deflection-snapshot.js'),
    "exports.deflectionSnapshotPath = (id) => `/api/v1/content-ops/deflection-reports/${encodeURIComponent(id)}/snapshot`;\n",
  );
  await writeFile(
    join(libStubDir, 'deflection-report-contract.js'),
    "exports.deflectionArtifactPath = (id) => `/api/v1/content-ops/deflection-reports/${encodeURIComponent(id)}/artifact`;\n",
  );
  await writeFile(
    join(libStubDir, 'gap-report-intake.js'),
    [
      "exports.gapReportBlobToken = () => 'vercel_blob_rw_unit';",
      "exports.gapReportBlobTokens = () => ['vercel_blob_rw_unit'];",
      '',
    ].join('\n'),
  );
  await writeFile(
    join(blobStubDir, 'index.js'),
    "exports.get = (...args) => globalThis.__atlasSubmitBlobGet(...args);\n",
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
  const { fetchDeflectionSnapshot, submitDeflectionReportCsv } = require(compiledPath);

  resetEnv({
    ATLAS_API_BASE_URL: 'https://atlas.example.com/',
    ATLAS_B2B_SERVICE_TOKEN: 'service_token_unit',
  });
  resetCalls();
  assert.deepEqual(
    await submitDeflectionReportCsv({
      csvBlobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
      csvFilename: 'unit tickets.csv',
      companyName: 'Acme Co.',
      contactEmail: 'lead@acme.example',
      supportPlatform: 'helpscout',
    }),
    { ok: true, requestId: 'content-ops-unit-123' },
  );
  assert.equal(blobCalls.length, 1);
  assert.equal(blobCalls[0].options.access, 'private');
  assert.equal(blobCalls[0].options.token, 'vercel_blob_rw_unit');
  assert.equal(fetchCalls.length, 1);
  assert.equal(
    fetchCalls[0].url,
    'https://atlas.example.com/api/v1/content-ops/deflection-reports/submit',
  );
  assert.equal(fetchCalls[0].headers.Authorization, 'Bearer service_token_unit');
  assert.equal(fetchCalls[0].headers['Content-Type'], undefined);
  assert.equal(fetchCalls[0].body.get('support_platform'), 'help_scout');
  assert.equal(fetchCalls[0].body.get('company_name'), 'Acme Co.');
  assert.equal(fetchCalls[0].body.get('contact_email'), 'lead@acme.example');
  assert.equal(fetchCalls[0].body.get('csv_file').name, 'unit_tickets.csv');

  resetEnv({});
  resetCalls();
  assert.deepEqual(
    await submitDeflectionReportCsv({
      csvBlobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
      csvFilename: 'unit.csv',
      companyName: 'Acme Co.',
      contactEmail: 'lead@acme.example',
      supportPlatform: 'zendesk',
    }),
    { ok: false, reason: 'not_configured' },
  );
  assert.equal(blobCalls.length, 0);
  assert.equal(fetchCalls.length, 0);

  resetEnv({
    ATLAS_API_BASE_URL: 'https://atlas.example.com',
    ATLAS_B2B_SERVICE_TOKEN: 'service_token_unit',
  });
  resetCalls();
  fetchPayload = { request_id: '../../bad' };
  assert.deepEqual(
    await submitDeflectionReportCsv({
      csvBlobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
      csvFilename: 'freshdesk.csv',
      companyName: 'Acme Co.',
      contactEmail: 'lead@acme.example',
      supportPlatform: 'freshdesk',
    }),
    { ok: false, reason: 'invalid_response' },
  );
  assert.equal(fetchCalls[0].headers.Authorization, 'Bearer service_token_unit');
  assert.equal(fetchCalls[0].body.get('support_platform'), 'other');
  assert.ok(
    consoleErrors.some((entry) => entry.includes('deflection submit: upstream shape rejected')),
    'invalid submit response is logged generically',
  );

  resetEnv({
    ATLAS_API_BASE_URL: 'https://atlas.example.com',
    ATLAS_B2B_SERVICE_TOKEN: 'service_token_unit',
  });
  resetCalls();
  fetchPayload = {
    summary: {
      generated: 2,
      drafted_answer_count: 1,
      no_proven_answer_count: 1,
      repeat_ticket_count: 6,
      source_date_start: '2026-05-01',
      source_date_end: '2026-05-06',
      source_window_days: 6,
    },
    top_questions: [
      {
        rank: 1,
        question: 'How do I export reports?',
        customer_wording: 'export reports',
        ticket_count: 4,
        weighted_frequency: 4,
        source_ids: ['ticket-private-top'],
        evidence_quotes: ['private top evidence'],
      },
    ],
    locked_questions: [
      {
        rank: 2,
        ticket_count: 2,
        question: 'Locked private billing question',
        customer_wording: 'schedule exports',
        source_ids: ['ticket-private-locked'],
        evidence_quotes: ['private locked evidence'],
        markdown: '# locked markdown',
      },
    ],
    teaser: {
      full_answer: {
        rank: 1,
        question: 'How do I export reports?',
        answer: 'Open Analytics and select Export.',
        steps: ['Open Analytics.', 'Select Export.'],
        answer_evidence_status: 'resolution_evidence',
        resolution_evidence_scope: 'scoped',
        weighted_frequency: 4,
        source_count: 2,
        source_ids: ['ticket-private-1'],
        evidence_quotes: ['private evidence quote'],
        markdown: '# paid markdown',
        term_mappings: [{ customer_term: 'export' }],
      },
      previews: [
        {
          rank: 2,
          question: 'Can I schedule exports?',
          answer: 'Preview answer must not cross to the browser.',
          steps: ['Preview step must not cross to the browser.'],
          answer_evidence_status: 'resolution_evidence',
          resolution_evidence_scope: 'scoped',
          weighted_frequency: 3,
          step_count: 2,
          source_count: 1,
          body_withheld: true,
          source_ids: ['ticket-private-2'],
        },
      ],
    },
  };
  const snapshotResult = await fetchDeflectionSnapshot('content-ops-unit-123');
  assert.equal(snapshotResult.ok, true);
  assert.deepEqual(snapshotResult.snapshot.summary, {
    generated: 2,
    drafted_answer_count: 1,
    no_proven_answer_count: 1,
    repeat_ticket_count: 6,
    source_date_start: '2026-05-01',
    source_date_end: '2026-05-06',
    source_window_days: 6,
  });
  assert.deepEqual(snapshotResult.snapshot.top_questions, [
    {
      rank: 1,
      question: 'How do I export reports?',
      customer_wording: 'export reports',
      ticket_count: 4,
      weighted_frequency: 4,
    },
  ]);
  assert.deepEqual(snapshotResult.snapshot.locked_questions, [
    {
      rank: 2,
      ticket_count: 2,
    },
  ]);
  assert.deepEqual(snapshotResult.snapshot.teaser.full_answer, {
    rank: 1,
    question: 'How do I export reports?',
    answer: 'Open Analytics and select Export.',
    steps: ['Open Analytics.', 'Select Export.'],
    answer_evidence_status: 'resolution_evidence',
    resolution_evidence_scope: 'scoped',
    weighted_frequency: 4,
    source_count: 2,
  });
  assert.deepEqual(snapshotResult.snapshot.teaser.previews, [
    {
      rank: 2,
      question: 'Can I schedule exports?',
      answer_evidence_status: 'resolution_evidence',
      resolution_evidence_scope: 'scoped',
      weighted_frequency: 3,
      step_count: 2,
      source_count: 1,
      body_withheld: true,
    },
  ]);
  assert.equal(JSON.stringify(snapshotResult.snapshot).includes('ticket-private'), false);
  assert.equal(JSON.stringify(snapshotResult.snapshot).includes('private evidence quote'), false);
  assert.equal(JSON.stringify(snapshotResult.snapshot).includes('paid markdown'), false);
  assert.equal(JSON.stringify(snapshotResult.snapshot).includes('private top evidence'), false);
  assert.equal(JSON.stringify(snapshotResult.snapshot).includes('private locked evidence'), false);
  assert.equal(JSON.stringify(snapshotResult.snapshot).includes('locked markdown'), false);
  assert.equal(JSON.stringify(snapshotResult.snapshot).includes('Locked private billing question'), false);
  assert.equal(
    JSON.stringify(snapshotResult.snapshot).includes('Preview answer must not cross'),
    false,
  );

  resetCalls();
  fetchPayload = minimalSnapshot();
  const missingWindowResult = await fetchDeflectionSnapshot('content-ops-unit-123');
  assert.equal(missingWindowResult.ok, true);
  assert.deepEqual(missingWindowResult.snapshot.summary, {
    generated: 1,
    drafted_answer_count: 1,
    no_proven_answer_count: 0,
    repeat_ticket_count: 1,
  });

  resetCalls();
  fetchPayload = minimalSnapshot({
    source_date_start: '2026-05-01',
    source_window_days: 1,
  });
  const partialWindowResult = await fetchDeflectionSnapshot('content-ops-unit-123');
  assert.equal(partialWindowResult.ok, true);
  assert.deepEqual(partialWindowResult.snapshot.summary, {
    generated: 1,
    drafted_answer_count: 1,
    no_proven_answer_count: 0,
    repeat_ticket_count: 1,
  });

  resetCalls();
  fetchPayload = minimalSnapshot({
    source_date_start: '2026-05-01',
    source_date_end: '2026-05-06',
    source_window_days: 30,
  });
  const contradictoryWindowResult = await fetchDeflectionSnapshot('content-ops-unit-123');
  assert.equal(contradictoryWindowResult.ok, true);
  assert.deepEqual(contradictoryWindowResult.snapshot.summary, {
    generated: 1,
    drafted_answer_count: 1,
    no_proven_answer_count: 0,
    repeat_ticket_count: 1,
  });

  for (const badWindow of [
    {
      source_date_start: '2026-02-30',
      source_date_end: '2026-03-01',
      source_window_days: 1,
    },
    {
      source_date_start: '2026-05-06',
      source_date_end: '2026-05-01',
      source_window_days: 6,
    },
  ]) {
    resetCalls();
    fetchPayload = minimalSnapshot(badWindow);
    const badWindowResult = await fetchDeflectionSnapshot('content-ops-unit-123');
    assert.equal(badWindowResult.ok, true);
    assert.deepEqual(badWindowResult.snapshot.summary, {
      generated: 1,
      drafted_answer_count: 1,
      no_proven_answer_count: 0,
      repeat_ticket_count: 1,
    });
  }

  resetCalls();
  fetchPayload = {
    summary: {
      generated: 1,
      drafted_answer_count: 1,
      no_proven_answer_count: 0,
    },
    top_questions: [
      {
        rank: 1,
        question: 'How do I export reports?',
        customer_wording: 'export reports',
        ticket_count: 1,
        weighted_frequency: 1,
      },
    ],
    locked_questions: [],
    teaser: { full_answer: null, previews: [] },
  };
  assert.deepEqual(await fetchDeflectionSnapshot('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });
  assert.ok(
    consoleErrors.some((entry) => entry.includes('deflection snapshot fetch: upstream shape rejected')),
    'missing repeat_ticket_count is logged generically',
  );

  resetCalls();
  fetchPayload = {
    summary: {
      generated: 1,
      drafted_answer_count: 1,
      no_proven_answer_count: 0,
      repeat_ticket_count: 1,
    },
    top_questions: [
      {
        rank: 1,
        question: 'How do I export reports?',
        customer_wording: 'export reports',
        weighted_frequency: 1,
      },
    ],
    locked_questions: [],
    teaser: { full_answer: null, previews: [] },
  };
  assert.deepEqual(await fetchDeflectionSnapshot('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = {
    summary: {
      generated: 2,
      drafted_answer_count: 1,
      no_proven_answer_count: 1,
      repeat_ticket_count: 2,
    },
    top_questions: [
      {
        rank: 1,
        question: 'How do I export reports?',
        customer_wording: 'export reports',
        ticket_count: 1,
        weighted_frequency: 1,
      },
    ],
    locked_questions: [{ rank: 2, ticket_count: '1' }],
    teaser: { full_answer: null, previews: [] },
  };
  assert.deepEqual(await fetchDeflectionSnapshot('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = {
    summary: {
      generated: 1,
      drafted_answer_count: 1,
      no_proven_answer_count: 0,
      repeat_ticket_count: 1,
    },
    top_questions: [],
    locked_questions: [],
    teaser: {
      full_answer: {
        rank: 1,
        question: 'Missing source count',
        answer: 'This malformed teaser should fail closed.',
        steps: [],
        answer_evidence_status: 'resolution_evidence',
        resolution_evidence_scope: 'scoped',
        weighted_frequency: 1,
      },
      previews: [],
    },
  };
  assert.deepEqual(await fetchDeflectionSnapshot('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });
  assert.ok(
    consoleErrors.some((entry) => entry.includes('deflection snapshot fetch: upstream shape rejected')),
    'invalid snapshot teaser response is logged generically',
  );

  const recordRoute = await readFile(recordRouteUrl, 'utf8');
  assert.ok(recordRoute.includes('submitDeflectionReportCsv'), 'record route calls ATLAS submit');
  assert.ok(recordRoute.includes('reportRequestId'), 'record route returns reportRequestId');
  assert.ok(
    recordRoute.includes('deflectionSubmitFailureResponse(submit.reason)'),
    'record route fails closed when ATLAS submit fails',
  );
  assert.ok(
    recordRoute.includes("status: 'failed_to_submit'"),
    'record route returns a typed ATLAS submit failure status',
  );
  assert.ok(
    recordRoute.includes('consumeRecordRateLimits(request.headers, meta.value.email)'),
    'record route rate-limits support deflection record submissions by client/email',
  );
  assert.ok(
    recordRoute.includes('getRecentGapReportSubmissionByEmailAndBlob'),
    'record route checks for a recent duplicate before ATLAS submit',
  );
  assert.ok(
    recordRoute.includes("status: 'already_submitted'"),
    'record route returns a typed duplicate submission status',
  );
  assert.equal(
    recordRoute.includes('Deflection report was not generated immediately.'),
    false,
    'record route should not turn ATLAS submit failures into success warnings',
  );

  const intakePage = await readFile(intakePageUrl, 'utf8');
  assert.ok(
    intakePage.includes('deflectionResultsPath'),
    'intake delegates results URL validation to the shared helper',
  );
  assert.ok(
    intakePage.includes("phase: 'processing'"),
    'successful ATLAS submit enters the processing transition state',
  );
  assert.ok(
    intakePage.includes('window.setTimeout') &&
      intakePage.includes('window.location.assign(submission.resultsHref)'),
    'processing transition redirects to the validated results route after a delay',
  );
  assert.ok(
    intakePage.includes('disabled={isSubmitting}') && intakePage.includes('aria-busy={isSubmitting}'),
    'intake submit button is disabled while upload/record submission is in flight',
  );
  assert.ok(
    intakePage.includes('Snapshot processing steps') &&
      intakePage.includes('Reading the ticket export') &&
      intakePage.includes('Pulling customer wording from tickets'),
    'processing screen shows bounded Snapshot preparation steps',
  );
  assert.ok(
    intakePage.includes('processingHeadingRef') &&
      intakePage.includes('processingHeadingRef.current?.focus()') &&
      intakePage.includes('tabIndex={-1}'),
    'processing screen moves focus to the new heading after the form mode switch',
  );
  assert.ok(
    intakePage.includes('Open Snapshot now'),
    'processing screen has a manual Snapshot link while redirect is pending',
  );

  console.log('Deflection intake ATLAS submit tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  restoreEnv();
  delete globalThis.__atlasSubmitBlobGet;
  await rm(testDir, { recursive: true, force: true });
}
