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
const statusRouteUrl = new URL('../src/app/api/deflection-report-status/route.ts', import.meta.url);
const modelPageUrl = new URL('../src/components/landing/DeflectionReportModelPage.tsx', import.meta.url);
const compiledPath = join(testDir, 'atlas-deflection-client.cjs');
const statusRouteCompiledPath = join(testDir, 'deflection-report-status-route.cjs');
const libStubDir = join(testDir, 'node_modules', '@', 'lib');
const blobStubDir = join(testDir, 'node_modules', '@vercel', 'blob');
const nextStubDir = join(testDir, 'node_modules', 'next');
const ENV_KEYS = ['ATLAS_API_BASE_URL', 'ATLAS_B2B_SERVICE_TOKEN'];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const originalConsoleError = console.error;

let fetchCalls = [];
let fetchPayload = minimalModel();
let fetchStatus = 200;
let consoleErrors = [];

function resetStatusRoute({
  modelResult = { ok: false, reason: 'not_found' },
  artifactResult = { ok: false, reason: 'not_found' },
  rateLimit = { ok: true },
} = {}) {
  globalThis.__atlasDeflectionStatusRoute = {
    modelResult,
    artifactResult,
    rateLimit,
    calls: [],
  };
  return globalThis.__atlasDeflectionStatusRoute;
}

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

function supportTaxSection(dataOverrides = {}) {
  return {
    id: 'support_tax',
    title: 'Support Tax Confirmation',
    priority: 10,
    surfaces: ['web', 'pdf', 'email_summary', 'markdown'],
    default_limit: null,
    required_data: [
      'repeat_ticket_count',
      'non_repeat_ticket_count',
      'generated_question_count',
      'assisted_contact_cost',
      'estimated_support_cost',
      'source_date_window',
      'drafted_answer_count',
      'no_proven_answer_count',
      'ticket_source_count',
    ],
    data: {
      repeat_ticket_count: 7,
      non_repeat_ticket_count: 3,
      generated_question_count: 4,
      assisted_contact_cost: 13.5,
      estimated_support_cost: 94.5,
      annualized_support_cost: 2299.5,
      source_date_window: {
        source_date_start: '2026-05-01',
        source_date_end: '2026-05-15',
        source_window_days: 15,
      },
      drafted_answer_count: 2,
      no_proven_answer_count: 1,
      ticket_source_count: 10,
      ...dataOverrides,
    },
  };
}

function exportOnlySection(overrides = {}) {
  return {
    id: 'complete_evidence',
    title: 'Complete Evidence',
    priority: 90,
    surfaces: ['export'],
    default_limit: null,
    required_data: ['evidence_row_count'],
    data: { evidence_row_count: 42 },
    ...overrides,
  };
}

function minimalModel(overrides = {}) {
  return {
    schema_version: 'deflection.v1',
    title: 'Support Ticket Deflection Report',
    summary: { generated: 1 },
    sections: [supportTaxSection()],
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
  await mkdir(nextStubDir, { recursive: true });
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
  await writeFile(
    join(libStubDir, 'atlas-deflection-client.js'),
    [
      "exports.fetchDeflectionReportModel = async (id) => {",
      "  const state = globalThis.__atlasDeflectionStatusRoute;",
      "  state.calls.push({ kind: 'model', id });",
      "  return state.modelResult;",
      '};',
      "exports.fetchDeflectionArtifact = async (id) => {",
      "  const state = globalThis.__atlasDeflectionStatusRoute;",
      "  state.calls.push({ kind: 'artifact', id });",
      "  return state.artifactResult;",
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'deflection-rate-limit.js'),
    [
      "exports.consumeDeflectionRateLimit = (headers, requestId, config) => {",
      "  const state = globalThis.__atlasDeflectionStatusRoute;",
      "  state.calls.push({ kind: 'rateLimit', requestId, scope: config.scope });",
      "  return state.rateLimit;",
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(nextStubDir, 'server.js'),
    "exports.NextResponse = { json: (body, init) => Response.json(body, init) };\n",
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
  const statusRouteSource = await readFile(statusRouteUrl, 'utf8');
  const compiledStatusRoute = ts.transpileModule(statusRouteSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(statusRouteCompiledPath, compiledStatusRoute.outputText);

  const require = createRequire(compiledPath);
  const { fetchDeflectionReportModel } = require(compiledPath);
  const { GET: reportStatusGET } = require(statusRouteCompiledPath);

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

  resetCalls();
  fetchPayload = minimalModel({ sections: [supportTaxSection({ repeat_ticket_count: '7' })] });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: false,
    reason: 'error',
  });

  resetCalls();
  fetchPayload = minimalModel({
    sections: [
      supportTaxSection(),
      exportOnlySection({
        required_data: ['evidence_row_count', 'source_id_count'],
        data: { evidence_row_count: 42 },
      }),
    ],
  });
  assert.deepEqual(await fetchDeflectionReportModel('content-ops-unit-123'), {
    ok: true,
    model: minimalModel(),
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
  assert.ok(
    modelPageSource.includes('const limit = Math.min(OUTCOME_DIAGNOSTIC_LIMIT, requestedLimit)'),
    'outcome diagnostics clamp upstream limits to the local cap',
  );
  assert.ok(
    modelPageSource.includes('const limit = Math.min(SEO_TARGET_LIMIT, requestedLimit)'),
    'SEO targets clamp upstream limits to the local cap',
  );
  assert.ok(modelPageSource.includes('const diagnostics = allDiagnostics.slice(0, limit)'), 'outcome diagnostics are capped before rendering');
  assert.ok(modelPageSource.includes('Diagnostics capped at'), 'diagnostic cap copy points to the export');
  assert.ok(modelPageSource.includes('complete evidence export'), 'model page points to the complete evidence export');
  assert.equal(modelPageSource.includes('evidence_quotes'), false, 'model page must not read raw evidence quotes');
  assert.equal(modelPageSource.includes('source_ids.map'), false, 'model page must not render raw source IDs');

  async function readReportStatus(requestId = 'content-ops-unit-123') {
    const response = await reportStatusGET(
      new Request(`https://portfolio.example.com/api/deflection-report-status?requestId=${encodeURIComponent(requestId)}`),
    );
    return {
      status: response.status,
      body: await response.json(),
    };
  }

  let statusState = resetStatusRoute({ modelResult: { ok: true, model: minimalModel() } });
  assert.deepEqual(await readReportStatus(), { status: 200, body: { status: 'unlocked' } });
  assert.deepEqual(statusState.calls.map((call) => call.kind), ['rateLimit', 'model']);

  statusState = resetStatusRoute({
    modelResult: { ok: false, reason: 'not_found' },
    artifactResult: { ok: true, artifact: { markdown: '# legacy' } },
  });
  assert.deepEqual(await readReportStatus(), { status: 200, body: { status: 'unlocked' } });
  assert.deepEqual(statusState.calls.map((call) => call.kind), ['rateLimit', 'model', 'artifact']);

  statusState = resetStatusRoute({ modelResult: { ok: false, reason: 'locked' } });
  assert.deepEqual(await readReportStatus(), { status: 200, body: { status: 'locked' } });
  assert.deepEqual(statusState.calls.map((call) => call.kind), ['rateLimit', 'model']);

  statusState = resetStatusRoute({ modelResult: { ok: false, reason: 'error' } });
  assert.deepEqual(await readReportStatus(), {
    status: 503,
    body: { error: 'Report status unavailable.' },
  });
  assert.deepEqual(statusState.calls.map((call) => call.kind), ['rateLimit', 'model']);

  console.log('Deflection report-model result page tests passed.');
} finally {
  globalThis.fetch = originalFetch;
  console.error = originalConsoleError;
  restoreEnv();
  delete globalThis.__atlasDeflectionStatusRoute;
  await rm(testDir, { recursive: true, force: true });
}
