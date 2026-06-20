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
let atlasResult = { ok: true, item: atlasMatch };

function makeRequest(url) {
  return { nextUrl: new URL(url) };
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
      '',
    ].join('\n'),
  );

  globalThis.__uploadedSearchLocalMatch = localMatch;
  globalThis.__uploadedSearchLocalCalls = localCalls;
  globalThis.__uploadedSearchAtlasCalls = atlasCalls;
  globalThis.__uploadedSearchAtlasResult = atlasResult;

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
  const { GET } = require(routeCompiledPath);

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
  globalThis.__uploadedSearchLocalCalls = localCalls;
  globalThis.__uploadedSearchAtlasCalls = atlasCalls;
  const longQuery = `${'x'.repeat(300)}   `;
  response = await GET(
    makeRequest(
      `https://portfolio.test/api/demo/deflection-search?requestId=content-ops-unit&q=${longQuery}`,
    ),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { match: atlasMatch, source: 'atlas' });
  assert.deepEqual(localCalls, []);
  assert.equal(atlasCalls.length, 1);
  assert.equal(atlasCalls[0].requestId, 'content-ops-unit');
  assert.equal(atlasCalls[0].query.length, 256);

  atlasCalls = [];
  globalThis.__uploadedSearchAtlasCalls = atlasCalls;
  globalThis.__uploadedSearchAtlasResult = { ok: true, item: null };
  response = await GET(
    makeRequest('https://portfolio.test/api/demo/deflection-search?requestId=content-ops-unit&q=missing'),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { match: null, source: 'atlas' });
  assert.deepEqual(localCalls, []);

  globalThis.__uploadedSearchAtlasResult = { ok: false, reason: 'error' };
  response = await GET(
    makeRequest('https://portfolio.test/api/demo/deflection-search?requestId=content-ops-unit&q=export'),
  );
  assert.equal(response.status, 502);
  assert.equal(response.body.match, null);
  assert.equal(response.body.source, 'atlas');
  assert.equal(
    response.body.error,
    'Uploaded report search is temporarily unavailable. Please try again.',
  );
  assert.deepEqual(localCalls, []);

  globalThis.__uploadedSearchAtlasResult = { ok: false, reason: 'not_configured' };
  response = await GET(
    makeRequest('https://portfolio.test/api/demo/deflection-search?requestId=content-ops-unit&q=export'),
  );
  assert.equal(response.status, 503);

  const helperSource = await readFile(helperUrl, 'utf8');
  assert.match(helperSource, /options: \{ requestId\?: string \}/);
  assert.match(helperSource, /params\.set\('requestId', options\.requestId\)/);

  const atlasClientSource = await readFile(atlasClientUrl, 'utf8');
  assert.match(
    atlasClientSource,
    /content-ops\/deflection-reports\/\$\{encodeURIComponent\(requestId\)\}\/search/,
  );
  assert.match(atlasClientSource, /Authorization: `Bearer \$\{config\.token\}`/);
  assert.match(atlasClientSource, /value\.results\.length === 0/);
  assert.match(atlasClientSource, /value\.item \?\? value\.faq_item/);

  const resultsPageSource = await readFile(resultsPageUrl, 'utf8');
  assert.match(resultsPageSource, /Search this uploaded report/);
  assert.match(resultsPageSource, /requestId=\{requestId\}/);
  assert.match(resultsPageSource, /uploadedSearchChips/);
} finally {
  await rm(testDir, { recursive: true, force: true });
}
