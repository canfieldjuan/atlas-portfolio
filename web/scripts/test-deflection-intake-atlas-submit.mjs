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
const ENV_KEYS = ['ATLAS_API_BASE_URL', 'ATLAS_B2B_JWT'];
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
  const { submitDeflectionReportCsv } = require(compiledPath);

  resetEnv({
    ATLAS_API_BASE_URL: 'https://atlas.example.com/',
    ATLAS_B2B_JWT: 'jwt_unit',
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
  assert.equal(fetchCalls[0].headers.Authorization, 'Bearer jwt_unit');
  assert.equal(fetchCalls[0].headers['Content-Type'], undefined);
  assert.equal(fetchCalls[0].body.get('support_platform'), 'help_scout');
  assert.equal(fetchCalls[0].body.get('company_name'), 'Acme Co.');
  assert.equal(fetchCalls[0].body.get('contact_email'), 'lead@acme.example');
  assert.equal(fetchCalls[0].body.get('csv_file').name, 'unit_tickets.csv');

  resetCalls();
  assert.deepEqual(
    await submitDeflectionReportCsv({
      csvBlobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
      csvFilename: 'freshdesk.csv',
      companyName: 'Acme Co.',
      contactEmail: 'lead@acme.example',
      supportPlatform: 'freshdesk',
    }),
    { ok: true, requestId: 'content-ops-unit-123' },
  );
  assert.equal(fetchCalls[0].body.get('support_platform'), 'other');

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
    ATLAS_B2B_JWT: 'jwt_unit',
  });
  resetCalls();
  fetchPayload = { request_id: '../../bad' };
  assert.deepEqual(
    await submitDeflectionReportCsv({
      csvBlobUrl: 'https://blob.example/gap-report-csvs/unit.csv',
      csvFilename: 'unit.csv',
      companyName: 'Acme Co.',
      contactEmail: 'lead@acme.example',
      supportPlatform: 'intercom',
    }),
    { ok: false, reason: 'invalid_response' },
  );
  assert.ok(
    consoleErrors.some((entry) => entry.includes('deflection submit: upstream shape rejected')),
    'invalid submit response is logged generically',
  );

  const recordRoute = await readFile(recordRouteUrl, 'utf8');
  assert.ok(recordRoute.includes('submitDeflectionReportCsv'), 'record route calls ATLAS submit');
  assert.ok(recordRoute.includes('reportRequestId'), 'record route returns reportRequestId');

  const intakePage = await readFile(intakePageUrl, 'utf8');
  assert.ok(
    intakePage.includes('/systems/support-ticket-deflection/results/'),
    'intake success links to results route',
  );
  assert.ok(intakePage.includes('deflectionResultsHref'), 'intake validates report id before URL use');
  assert.ok(
    intakePage.includes('window.location.assign(resultsHref)'),
    'successful ATLAS submit redirects to results route',
  );
  assert.ok(intakePage.includes('View free snapshot'), 'intake success has results CTA');

  console.log('Deflection intake ATLAS submit tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  restoreEnv();
  delete globalThis.__atlasSubmitBlobGet;
  await rm(testDir, { recursive: true, force: true });
}
