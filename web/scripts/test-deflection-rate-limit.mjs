import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-deflection-rate-limit-'));
const sourceUrl = new URL('../src/lib/deflection-rate-limit.ts', import.meta.url);
const auditRouteUrl = new URL('../src/app/api/audit/route.ts', import.meta.url);
const compiledPath = join(testDir, 'deflection-rate-limit.cjs');
const compiledAuditRoutePath = join(testDir, 'audit-route.cjs');
const libStubDir = join(testDir, 'node_modules', '@', 'lib');
const nextStubDir = join(testDir, 'node_modules', 'next');
const originalNow = Date.now;
let now = 1_700_000_000_000;

function testHeaders(value) {
  return new Headers(value ? { 'x-forwarded-for': value } : {});
}

function resetStore() {
  delete globalThis.__atlasDeflectionRateLimitStore;
}

function validAuditBody(overrides = {}) {
  return {
    fullName: 'Ada Buyer',
    workEmail: ' buyer@example.com ',
    companyOrProjectUrl: 'https://example.com',
    roleAndDecisionScope: 'Owner',
    projectInterest: 'content-ops-audit',
    biggestBottleneck: 'Manual intake triage',
    automationDataSources: 'Tickets and CRM',
    desiredTimeline: 'quarter',
    securityRequirement: 'unsure',
    anticipatedInvestmentRange: 'phase1',
    ...overrides,
  };
}

function makeAuditRequest(body) {
  return {
    headers: testHeaders('203.0.113.44'),
    async json() {
      globalThis.__auditRouteJsonCalls += 1;
      return body;
    },
  };
}

async function readRouteResponse(response) {
  return {
    status: response.status,
    body: await response.json(),
    retryAfter: response.headers.get('Retry-After'),
  };
}

function resetAuditRouteState({
  ipRateLimit = { ok: true },
  emailRateLimit = { ok: true },
} = {}) {
  globalThis.__auditRouteJsonCalls = 0;
  globalThis.__auditRouteRecordCalls = [];
  globalThis.__auditRouteIpLimitCalls = [];
  globalThis.__auditRouteEmailLimitCalls = [];
  globalThis.__auditRouteIpRateLimit = ipRateLimit;
  globalThis.__auditRouteEmailRateLimit = emailRateLimit;
}

try {
  await mkdir(libStubDir, { recursive: true });
  await mkdir(nextStubDir, { recursive: true });
  await writeFile(
    join(nextStubDir, 'server.js'),
    'exports.NextResponse = { json: (body, init = {}) => Response.json(body, init) };\n',
  );
  await writeFile(
    join(libStubDir, 'audit-intake.js'),
    [
      'exports.recordAuditIntake = async (payload) => {',
      '  globalThis.__auditRouteRecordCalls.push(payload);',
      "  return { requestId: 'audit-unit', deliveries: ['database'], warnings: [] };",
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'audit-routing.js'),
    "exports.isAuditProjectInterest = (value) => typeof value === 'string' && value.trim().length > 0;\n",
  );
  await writeFile(
    join(libStubDir, 'deflection-rate-limit.js'),
    [
      'exports.consumeDeflectionRateLimit = (headers, requestId, config) => {',
      '  globalThis.__auditRouteIpLimitCalls.push({ requestId, scope: config.scope, limit: config.limit, windowMs: config.windowMs });',
      '  return globalThis.__auditRouteIpRateLimit;',
      '};',
      'exports.consumeDeflectionIdentifierRateLimit = (identifier, config) => {',
      '  globalThis.__auditRouteEmailLimitCalls.push({ identifier, scope: config.scope, limit: config.limit, windowMs: config.windowMs });',
      '  return globalThis.__auditRouteEmailRateLimit;',
      '};',
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
  const auditRouteSource = await readFile(auditRouteUrl, 'utf8');
  const compiledAuditRoute = ts.transpileModule(auditRouteSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledAuditRoutePath, compiledAuditRoute.outputText);

  const require = createRequire(import.meta.url);
  const { consumeDeflectionIdentifierRateLimit, consumeDeflectionRateLimit } = require(compiledPath);
  const { POST: auditRoutePOST } = require(compiledAuditRoutePath);
  Date.now = () => now;

  resetStore();
  const tightConfig = { scope: 'unit', limit: 2, windowMs: 1_000 };
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', tightConfig),
    { ok: true },
  );
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', tightConfig),
    { ok: true },
  );
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', tightConfig),
    { ok: false, retryAfterSeconds: 1 },
  );
  now += 1_000;
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', tightConfig),
    { ok: true },
  );

  resetStore();
  const singleUseConfig = { scope: 'unit', limit: 1, windowMs: 60_000 };
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10, 198.51.100.4'), 'report-a', singleUseConfig),
    { ok: true },
  );
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', singleUseConfig),
    { ok: false, retryAfterSeconds: 60 },
  );
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-b', singleUseConfig),
    { ok: true },
  );
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('198.51.100.4'), 'report-a', singleUseConfig),
    { ok: true },
  );

  resetStore();
  assert.deepEqual(
    consumeDeflectionIdentifierRateLimit(' buyer@example.com ', singleUseConfig),
    { ok: true },
  );
  assert.deepEqual(
    consumeDeflectionIdentifierRateLimit('BUYER@example.com', singleUseConfig),
    { ok: false, retryAfterSeconds: 60 },
  );
  assert.deepEqual(
    consumeDeflectionIdentifierRateLimit('other@example.com', singleUseConfig),
    { ok: true },
  );

  resetStore();
  const cappedStoreConfig = { scope: 'unit', limit: 2, windowMs: 60_000 };
  for (let index = 0; index < 1_000; index += 1) {
    assert.deepEqual(
      consumeDeflectionRateLimit(testHeaders('203.0.113.20'), `random-report-${index}`, cappedStoreConfig),
      { ok: true },
    );
  }
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.20'), 'random-report-over-cap', cappedStoreConfig),
    { ok: false, retryAfterSeconds: 60 },
  );
  now += 60_000;
  assert.deepEqual(
    consumeDeflectionRateLimit(testHeaders('203.0.113.20'), 'random-report-after-expiry', cappedStoreConfig),
    { ok: true },
  );

  resetAuditRouteState();
  assert.ok(
    auditRouteSource.includes("scope: 'audit-intake-ip'") &&
      auditRouteSource.includes("scope: 'audit-intake-email'"),
    'audit route declares IP and email limit scopes',
  );
  let auditResponse = await readRouteResponse(await auditRoutePOST(makeAuditRequest(validAuditBody())));
  assert.equal(auditResponse.status, 200);
  assert.equal(globalThis.__auditRouteJsonCalls, 1);
  assert.deepEqual(globalThis.__auditRouteIpLimitCalls, [
    { requestId: 'audit', scope: 'audit-intake-ip', limit: 3, windowMs: 600_000 },
  ]);
  assert.deepEqual(globalThis.__auditRouteEmailLimitCalls, [
    { identifier: 'buyer@example.com', scope: 'audit-intake-email', limit: 3, windowMs: 600_000 },
  ]);
  assert.equal(globalThis.__auditRouteRecordCalls.length, 1);
  assert.equal(globalThis.__auditRouteRecordCalls[0].workEmail, 'buyer@example.com');

  resetAuditRouteState({ ipRateLimit: { ok: false, retryAfterSeconds: 17 } });
  auditResponse = await readRouteResponse(await auditRoutePOST(makeAuditRequest(validAuditBody())));
  assert.equal(auditResponse.status, 429);
  assert.equal(auditResponse.retryAfter, '17');
  assert.deepEqual(auditResponse.body, {
    ok: false,
    error: 'Too many audit requests. Please try again later.',
  });
  assert.equal(globalThis.__auditRouteJsonCalls, 0);
  assert.equal(globalThis.__auditRouteEmailLimitCalls.length, 0);
  assert.equal(globalThis.__auditRouteRecordCalls.length, 0);

  resetAuditRouteState({ emailRateLimit: { ok: false, retryAfterSeconds: 23 } });
  auditResponse = await readRouteResponse(await auditRoutePOST(makeAuditRequest(validAuditBody())));
  assert.equal(auditResponse.status, 429);
  assert.equal(auditResponse.retryAfter, '23');
  assert.deepEqual(auditResponse.body, {
    ok: false,
    error: 'Too many audit requests. Please try again later.',
  });
  assert.equal(globalThis.__auditRouteJsonCalls, 1);
  assert.equal(globalThis.__auditRouteEmailLimitCalls.length, 1);
  assert.equal(globalThis.__auditRouteRecordCalls.length, 0);

  console.log('Deflection rate-limit tests passed.');
} finally {
  Date.now = originalNow;
  resetStore();
  await rm(testDir, { recursive: true, force: true });
}
