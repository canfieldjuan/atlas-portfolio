import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-review-decisions-'));
const routeUrl = new URL('../src/app/api/deflection-review-decisions/route.ts', import.meta.url);
const compiledRoutePath = join(testDir, 'route.cjs');
const libStubDir = join(testDir, 'node_modules', '@', 'lib');
const nextStubDir = join(testDir, 'node_modules', 'next');
const REQUEST_ID = 'content-ops-unit-123';
const REVIEW_KEY = 'review_0123456789abcdef01234567';

function model(reviewKeys = [REVIEW_KEY]) {
  return {
    schema_version: 'deflection.v1',
    title: 'Report',
    summary: {},
    sections: [
      {
        id: 'support_tax',
        title: 'Support Tax',
        priority: 10,
        surfaces: ['web'],
        default_limit: null,
        required_data: [],
        snapshot_safe_fields: [],
        data: {},
      },
      {
        id: 'suppressed_repeat_review_queue',
        title: 'Suppressed Review Queue',
        priority: 41,
        surfaces: ['web'],
        default_limit: 25,
        required_data: ['items'],
        snapshot_safe_fields: [],
        data: {
          items: reviewKeys.map((reviewKey) => ({
            review_key: reviewKey,
            question: 'Customer wording must not be persisted.',
          })),
        },
      },
    ],
  };
}

function resetState(overrides = {}) {
  globalThis.__deflectionReviewDecisions = {
    modelResult: { ok: true, model: model() },
    rateLimit: { ok: true },
    configured: true,
    records: [],
    calls: [],
    ...overrides,
  };
  return globalThis.__deflectionReviewDecisions;
}

async function json(response) {
  return response.json();
}

function postRequest(body) {
  return new Request('https://unit.test/api/deflection-review-decisions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function getRequest(requestId = REQUEST_ID) {
  return new Request(`https://unit.test/api/deflection-review-decisions?requestId=${encodeURIComponent(requestId)}`);
}

try {
  await mkdir(libStubDir, { recursive: true });
  await mkdir(nextStubDir, { recursive: true });
  await writeFile(
    join(nextStubDir, 'server.js'),
    "exports.NextResponse = { json: (body, init) => Response.json(body, init) };\n",
  );
  await writeFile(
    join(libStubDir, 'atlas-deflection-client.js'),
    [
      "exports.fetchDeflectionReportModel = async (requestId) => {",
      "  const state = globalThis.__deflectionReviewDecisions;",
      "  state.calls.push({ kind: 'model', requestId });",
      "  return state.modelResult;",
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'deflection-rate-limit.js'),
    [
      "exports.consumeDeflectionRateLimit = (headers, requestId, config) => {",
      "  const state = globalThis.__deflectionReviewDecisions;",
      "  state.calls.push({ kind: 'rateLimit', requestId, scope: config.scope });",
      "  return state.rateLimit;",
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(join(libStubDir, 'deflection-report-contract.js'), '');
  await writeFile(
    join(libStubDir, 'deflection-review-decisions-database.js'),
    [
      "exports.DEFLECTION_REVIEW_DECISIONS = ['keep_suppressed', 'promote_to_review'];",
      "exports.deflectionReviewDecisionDatabaseConfigured = () => globalThis.__deflectionReviewDecisions.configured;",
      "exports.listDeflectionReviewDecisions = async (requestId) => {",
      "  const state = globalThis.__deflectionReviewDecisions;",
      "  state.calls.push({ kind: 'list', requestId });",
      "  if (state.listError) throw state.listError;",
      "  return state.records;",
      '};',
      "exports.upsertDeflectionReviewDecision = async (input) => {",
      "  const state = globalThis.__deflectionReviewDecisions;",
      "  state.calls.push({ kind: 'upsert', input });",
      "  if (!state.configured) return null;",
      "  if (state.upsertError) throw state.upsertError;",
      "  const record = { ...input, updatedAt: '2026-06-24T00:00:00.000Z' };",
      "  state.records = state.records.filter((row) => row.requestId !== input.requestId || row.reviewKey !== input.reviewKey);",
      "  state.records.unshift(record);",
      '  return record;',
      '};',
      '',
    ].join('\n'),
  );

  const routeSource = await readFile(routeUrl, 'utf8');
  const compiledRoute = ts.transpileModule(routeSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledRoutePath, compiledRoute.outputText);

  const require = createRequire(compiledRoutePath);
  const { GET, POST } = require(compiledRoutePath);

  resetState();
  const invalid = await POST(postRequest({ requestId: '../bad', reviewKey: REVIEW_KEY, decision: 'promote_to_review' }));
  assert.equal(invalid.status, 400);
  assert.deepEqual(globalThis.__deflectionReviewDecisions.calls, []);

  resetState({ modelResult: { ok: false, reason: 'locked' } });
  const locked = await POST(postRequest({ requestId: REQUEST_ID, reviewKey: REVIEW_KEY, decision: 'promote_to_review' }));
  assert.equal(locked.status, 403);
  assert.equal((await json(locked)).error, 'Report is locked.');
  assert.ok(!globalThis.__deflectionReviewDecisions.calls.some((call) => call.kind === 'upsert'));

  resetState();
  const unknownKey = await POST(postRequest({
    requestId: REQUEST_ID,
    reviewKey: 'review_ffffffffffffffffffffffff',
    decision: 'promote_to_review',
  }));
  assert.equal(unknownKey.status, 404);
  assert.equal((await json(unknownKey)).error, 'Review key not found.');

  resetState();
  const saved = await POST(postRequest({ requestId: REQUEST_ID, reviewKey: REVIEW_KEY, decision: 'promote_to_review' }));
  assert.equal(saved.status, 200);
  assert.deepEqual(await json(saved), {
    decision: {
      requestId: REQUEST_ID,
      reviewKey: REVIEW_KEY,
      decision: 'promote_to_review',
      updatedAt: '2026-06-24T00:00:00.000Z',
    },
  });
  const upsertCall = globalThis.__deflectionReviewDecisions.calls.find((call) => call.kind === 'upsert');
  assert.deepEqual(upsertCall.input, {
    requestId: REQUEST_ID,
    reviewKey: REVIEW_KEY,
    decision: 'promote_to_review',
  });
  assert.ok(!JSON.stringify(upsertCall.input).includes('Customer wording'));

  resetState({
    records: [
      { requestId: REQUEST_ID, reviewKey: REVIEW_KEY, decision: 'keep_suppressed', updatedAt: '2026-06-24T00:00:00.000Z' },
      { requestId: REQUEST_ID, reviewKey: 'review_ffffffffffffffffffffffff', decision: 'promote_to_review', updatedAt: '2026-06-24T00:00:00.000Z' },
    ],
  });
  const listed = await GET(getRequest());
  assert.equal(listed.status, 200);
  assert.deepEqual(await json(listed), {
    decisions: [
      { requestId: REQUEST_ID, reviewKey: REVIEW_KEY, decision: 'keep_suppressed', updatedAt: '2026-06-24T00:00:00.000Z' },
    ],
    persistence: 'configured',
  });

  resetState({ configured: false });
  const unconfigured = await POST(postRequest({ requestId: REQUEST_ID, reviewKey: REVIEW_KEY, decision: 'keep_suppressed' }));
  assert.equal(unconfigured.status, 503);
  assert.equal((await json(unconfigured)).error, 'Review decision storage is not configured.');

  resetState({ listError: new Error('relation does not exist') });
  const listFailure = await GET(getRequest());
  assert.equal(listFailure.status, 503);
  assert.equal((await json(listFailure)).error, 'Review decision storage is unavailable.');

  resetState({ upsertError: new Error('connection reset') });
  const writeFailure = await POST(postRequest({ requestId: REQUEST_ID, reviewKey: REVIEW_KEY, decision: 'keep_suppressed' }));
  assert.equal(writeFailure.status, 503);
  assert.equal((await json(writeFailure)).error, 'Review decision storage is unavailable.');

  resetState({ rateLimit: { ok: false, retryAfterSeconds: 9 } });
  const limited = await GET(getRequest());
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '9');
} finally {
  await rm(testDir, { recursive: true, force: true });
}
