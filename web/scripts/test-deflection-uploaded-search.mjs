import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-uploaded-search-'));
const routeUrl = new URL('../src/app/api/demo/deflection-search/route.ts', import.meta.url);
const helperUrl = new URL('../src/lib/deflection-demo.ts', import.meta.url);
const atlasClientUrl = new URL('../src/lib/atlas-deflection-client.ts', import.meta.url);
const resultsPageUrl = new URL('../src/components/landing/DeflectionResultsPage.tsx', import.meta.url);
const routeCompiledPath = join(testDir, 'route.cjs');
const nextStubDir = join(testDir, 'node_modules', 'next');
const libStubDir = join(testDir, 'node_modules', '@', 'lib');

const localMatch = { topic: 'local sample' };
const atlasMatch = { topic: 'uploaded report' };
let localCalls = [];
let atlasCalls = [];
let modelCalls = [];
let artifactCalls = [];
let rateLimitCalls = [];
let atlasResult = { ok: true, item: atlasMatch };
let modelResult = { ok: true, model: {} };
let artifactResult = { ok: false, reason: 'not_found' };
let rateLimitResult = { ok: true };

function makeRequest(url) {
  return { nextUrl: new URL(url) };
}

function makePostRequest(body) {
  return {
    headers: new Headers({ 'x-forwarded-for': '203.0.113.10' }),
    async json() {
      return body;
    },
  };
}

try {
  await mkdir(nextStubDir, { recursive: true });
  await mkdir(libStubDir, { recursive: true });
  await writeFile(
    join(nextStubDir, 'server.js'),
    [
      'exports.NextResponse = {',
      '  json(body, init = {}) { return { body, status: init.status || 200 }; },',
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'deflection-demo.js'),
    [
      'exports.matchLocal = (q) => {',
      '  globalThis.__uploadedSearchLocalCalls.push(q);',
      '  return globalThis.__uploadedSearchLocalMatch;',
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'atlas-deflection-client.js'),
    [
      'exports.searchUploadedDeflectionReport = async (input) => {',
      '  globalThis.__uploadedSearchAtlasCalls.push(input);',
      '  return globalThis.__uploadedSearchAtlasResult;',
      '};',
      'exports.fetchDeflectionReportModel = async (requestId) => {',
      '  globalThis.__uploadedSearchModelCalls.push(requestId);',
      '  return globalThis.__uploadedSearchModelResult;',
      '};',
      'exports.fetchDeflectionArtifact = async (requestId) => {',
      '  globalThis.__uploadedSearchArtifactCalls.push(requestId);',
      '  return globalThis.__uploadedSearchArtifactResult;',
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'deflection-rate-limit.js'),
    [
      'exports.consumeDeflectionRateLimit = (headers, requestId, config) => {',
      '  globalThis.__uploadedSearchRateLimitCalls.push({ headers, requestId, config });',
      '  return globalThis.__uploadedSearchRateLimitResult;',
      '};',
      '',
    ].join('\n'),
  );

  globalThis.__uploadedSearchLocalMatch = localMatch;
  globalThis.__uploadedSearchLocalCalls = localCalls;
  globalThis.__uploadedSearchAtlasCalls = atlasCalls;
  globalThis.__uploadedSearchModelCalls = modelCalls;
  globalThis.__uploadedSearchArtifactCalls = artifactCalls;
  globalThis.__uploadedSearchRateLimitCalls = rateLimitCalls;
  globalThis.__uploadedSearchAtlasResult = atlasResult;
  globalThis.__uploadedSearchModelResult = modelResult;
  globalThis.__uploadedSearchArtifactResult = artifactResult;
  globalThis.__uploadedSearchRateLimitResult = rateLimitResult;

  const source = await readFile(routeUrl, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  await writeFile(routeCompiledPath, compiled.outputText);

  const require = createRequire(routeCompiledPath);
  const { GET, POST } = require(routeCompiledPath);

  localCalls = [];
  atlasCalls = [];
  globalThis.__uploadedSearchLocalCalls = localCalls;
  globalThis.__uploadedSearchAtlasCalls = atlasCalls;
  let response = await GET(makeRequest('https://portfolio.test/api/demo/deflection-search?q=export'));
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { match: localMatch, source: 'local' });
  assert.deepEqual(localCalls, ['export']);
  assert.deepEqual(atlasCalls, []);

  localCalls = [];
  atlasCalls = [];
  modelCalls = [];
  artifactCalls = [];
  rateLimitCalls = [];
  globalThis.__uploadedSearchLocalCalls = localCalls;
  globalThis.__uploadedSearchAtlasCalls = atlasCalls;
  globalThis.__uploadedSearchModelCalls = modelCalls;
  globalThis.__uploadedSearchArtifactCalls = artifactCalls;
  globalThis.__uploadedSearchRateLimitCalls = rateLimitCalls;
  const longQuery = `${'x'.repeat(300)}   `;
  response = await POST(makePostRequest({ requestId: 'content-ops-unit', q: longQuery }));
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { match: atlasMatch, source: 'atlas' });
  assert.deepEqual(localCalls, []);
  assert.deepEqual(modelCalls, ['content-ops-unit']);
  assert.deepEqual(artifactCalls, []);
  assert.equal(rateLimitCalls.length, 1);
  assert.equal(atlasCalls.length, 1);
  assert.equal(atlasCalls[0].requestId, 'content-ops-unit');
  assert.equal(atlasCalls[0].query.length, 256);

  atlasCalls = [];
  globalThis.__uploadedSearchAtlasCalls = atlasCalls;
  globalThis.__uploadedSearchAtlasResult = { ok: true, item: null };
  response = await POST(makePostRequest({ requestId: 'content-ops-unit', q: 'missing' }));
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { match: null, source: 'atlas' });
  assert.deepEqual(localCalls, []);

  globalThis.__uploadedSearchAtlasResult = { ok: false, reason: 'error' };
  response = await POST(makePostRequest({ requestId: 'content-ops-unit', q: 'export' }));
  assert.equal(response.status, 502);
  assert.equal(response.body.match, null);
  assert.equal(response.body.source, 'atlas');
  assert.equal(
    response.body.error,
    'Uploaded report search is temporarily unavailable. Please try again.',
  );
  assert.deepEqual(localCalls, []);

  globalThis.__uploadedSearchModelResult = { ok: false, reason: 'locked' };
  atlasCalls = [];
  globalThis.__uploadedSearchAtlasCalls = atlasCalls;
  response = await POST(makePostRequest({ requestId: 'content-ops-unit', q: 'export' }));
  assert.equal(response.status, 403);
  assert.deepEqual(atlasCalls, []);

  globalThis.__uploadedSearchModelResult = { ok: true, model: {} };
  globalThis.__uploadedSearchRateLimitResult = { ok: false, retryAfterSeconds: 17 };
  response = await POST(makePostRequest({ requestId: 'content-ops-unit', q: 'export' }));
  assert.equal(response.status, 429);
  assert.equal(response.body.error, 'Too many searches. Please try again later.');

  const helperSource = await readFile(helperUrl, 'utf8');
  assert.match(helperSource, /options: \{ requestId\?: string \}/);
  assert.match(helperSource, /method: 'POST'/);
  assert.match(helperSource, /JSON\.stringify\(\{ requestId: options\.requestId, q \}\)/);

  const atlasClientSource = await readFile(atlasClientUrl, 'utf8');
  assert.match(
    atlasClientSource,
    /content-ops\/deflection-reports\/\$\{encodeURIComponent\(requestId\)\}\/search/,
  );
  assert.match(atlasClientSource, /Authorization: `Bearer \$\{config\.token\}`/);
  assert.match(atlasClientSource, /value\.results\.length === 0/);
  assert.match(atlasClientSource, /value\.item \?\? value\.faq_item/);

  const resultsPageSource = await readFile(resultsPageUrl, 'utf8');
  assert.doesNotMatch(resultsPageSource, /requestId=\{requestId\}/);
  const modelPageSource = await readFile(
    new URL('../src/components/landing/DeflectionReportModelPage.tsx', import.meta.url),
    'utf8',
  );
  assert.match(modelPageSource, /Search the FAQ drafts built from this CSV/);
  assert.match(modelPageSource, /requestId=\{requestId\}/);
} finally {
  await rm(testDir, { recursive: true, force: true });
}
