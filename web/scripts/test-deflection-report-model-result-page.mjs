import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-report-model-'));
const sourceUrl = new URL('../src/lib/atlas-deflection-client.ts', import.meta.url);
const routeUrl = new URL(
  '../src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx',
  import.meta.url,
);
const modelPageUrl = new URL('../src/components/landing/DeflectionReportModelPage.tsx', import.meta.url);
const compiledPath = join(testDir, 'atlas-deflection-client.cjs');
const libStubDir = join(testDir, 'node_modules', '@', 'lib');
const blobStubDir = join(testDir, 'node_modules', '@vercel', 'blob');
const ENV_KEYS = ['ATLAS_API_BASE_URL', 'ATLAS_B2B_SERVICE_TOKEN'];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

let fetchCalls = [];
let fetchPayload = minimalModel();
let fetchStatus = 200;
let consoleErrors = [];

function resetEnv(values = {}) {
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, values);
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
    if (originalEnv[key] !== undefined) process.env[key] = originalEnv[key];
  }
}

function resetCalls() {
  fetchCalls = [];
  fetchPayload = minimalModel();
  fetchStatus = 200;
  consoleErrors = [];
}

function minimalModel(overrides = {}) {
  return {
    schema_version: 'deflection.v1',
    title: 'Support Ticket Deflection Report',
    summary: { generated: 1 },
    sections: [
      {
        id: 'support_tax',
        title: 'Support Tax Confirmation',
        priority: 10,
        surfaces: ['web', 'pdf', 'email_summary', 'markdown'],
        default_limit: null,
        required_data: ['repeat_ticket_count'],
        data: { repeat_ticket_count: 7 },
      },
      {
        id: 'complete_evidence',
        title: 'Complete Evidence',
        priority: 90,
        surfaces: ['export'],
        default_limit: null,
        required_data: ['evidence_row_count'],
        data: { evidence_row_count: 42 },
      },
    ],
    ...overrides,
  };
}

globalThis.fetch = async (url, init) => {
  fetchCalls.push({
    url: String(url),
    headers: init?.headers ?? {},
    cache: init?.cache,
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
    [
      "exports.deflectionArtifactPath = (id) => `/api/v1/content-ops/deflection-reports/${encodeURIComponent(id)}/artifact`;",
      "exports.deflectionReportModelPath = (id) => `/api/v1/content-ops/deflection-reports/${encodeURIComponent(id)}/report-model`;",
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'gap-report-intake.js'),
    "exports.gapReportBlobToken = () => 'vercel_blob_rw_unit'; exports.gapReportBlobTokens = () => ['vercel_blob_rw_unit'];\n",
  );
  await writeFile(join(blobStubDir, 'index.js'), "exports.get = async () => ({ statusCode: 404 });\n");

  const source = await readFile(sourceUrl, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledPath, compiled.outputText);

  const require = createRequire(compiledPath);
  const { fetchDeflectionReportModel } = require(compiledPath);

  resetEnv({
    ATLAS_API_BASE_URL: 'https://atlas.example.com/',
    ATLAS_B2B_SERVICE_TOKEN: 'service_token_unit',
  });
  resetCalls();
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: true,
    model: minimalModel(),
  });
  assert.equal(
    fetchCalls[0].url,
    'https://atlas.example.com/api/v1/content-ops/deflection-reports/content-ops-unit-123/report-model',
  );
  assert.equal(fetchCalls[0].headers.Authorization, 'Bearer service_token_unit');
  assert.equal(fetchCalls[0].cache, 'no-store');

  resetCalls();
  fetchStatus = 403;
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'locked',
  });

  resetCalls();
  fetchStatus = 404;
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'not_found',
  });

  resetCalls();
  fetchStatus = 200;
  fetchPayload = minimalModel({ schema_version: 'deflection.v2' });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });
  assert.ok(
    consoleErrors.some((entry) => entry.includes('deflection report model fetch: upstream shape rejected')),
    'unsupported schema is logged generically',
  );

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      {
        id: 'support_tax',
        title: 'Support Tax Confirmation',
        priority: 10,
        surfaces: ['web'],
        default_limit: null,
        required_data: ['repeat_ticket_count'],
        data: {},
      },
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetEnv({});
  resetCalls();
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'not_configured',
  });
  assert.equal(fetchCalls.length, 0);

  resetEnv({
    ATLAS_API_BASE_URL: 'https://atlas.example.com',
    ATLAS_B2B_SERVICE_TOKEN: 'service_token_unit',
  });
  resetCalls();
  assert.deepEqual(await fetchDeflectionReportModel('../bad'), {
    ok: false,
    reason: 'not_found',
  });
  assert.equal(fetchCalls.length, 0);

  const routeSource = await readFile(routeUrl, 'utf8');
  const modelFetchIndex = routeSource.indexOf('const modelResult = await getReportModel(requestId)');
  const artifactFetchIndex = routeSource.indexOf("modelResult.reason === 'not_found' ? await getArtifact(requestId) : null");
  assert.ok(modelFetchIndex > -1, 'results route fetches the report model first');
  assert.ok(artifactFetchIndex > modelFetchIndex, 'artifact fallback happens after model fetch');
  assert.equal(
    routeSource.includes('fetchDeflectionArtifact(requestId);\\n  const model'),
    false,
    'artifact fetch should not precede the model fetch',
  );

  const modelPageSource = await readFile(modelPageUrl, 'utf8');
  assert.ok(modelPageSource.includes("section.surfaces.includes('web')"), 'model page filters to web sections');
  assert.ok(modelPageSource.includes('complete evidence export'), 'model page points to the complete evidence export');
  assert.equal(modelPageSource.includes('evidence_quotes'), false, 'model page must not read raw evidence quotes');
  assert.equal(modelPageSource.includes('source_ids.map'), false, 'model page must not render raw source IDs');

  console.log('Deflection report-model result page tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  restoreEnv();
  await rm(testDir, { recursive: true, force: true });
}
