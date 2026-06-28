import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-admin-intake-login-rate-limit-'));
const rateLimitSourceUrl = new URL('../src/lib/admin-intake-rate-limit.ts', import.meta.url);
const loginRouteSourceUrl = new URL('../src/app/admin/intake/login/route.ts', import.meta.url);
const compiledRateLimitPath = join(testDir, 'admin-intake-rate-limit.cjs');
const compiledLoginRoutePath = join(testDir, 'admin-intake-login-route.cjs');
const libStubDir = join(testDir, 'node_modules', '@', 'lib');
const nextStubDir = join(testDir, 'node_modules', 'next');
const originalNow = Date.now;
let now = 1_700_000_000_000;

function testHeaders({ realIp = '203.0.113.10', forwardedFor, cfIp } = {}) {
  const headers = new Headers();
  if (realIp) headers.set('x-real-ip', realIp);
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);
  if (cfIp) headers.set('cf-connecting-ip', cfIp);
  return headers;
}

function resetStore() {
  delete globalThis.__atlasAdminIntakeLoginRateLimitStore;
}

function resetRouteState({ rateLimit = { ok: true } } = {}) {
  globalThis.__adminIntakeRouteCookieCalls = [];
  globalThis.__adminIntakeRouteClearCalls = [];
  globalThis.__adminIntakeRouteFormDataCalls = 0;
  globalThis.__adminIntakeRouteRateLimit = rateLimit;
  globalThis.__adminIntakeRouteRateLimitCalls = [];
  globalThis.__adminIntakeRouteRecordCalls = [];
  globalThis.__adminIntakeRouteVerifyCalls = [];
}

function makeLoginRequest(token, ip = '203.0.113.44') {
  return {
    headers: testHeaders({ realIp: ip, forwardedFor: '198.51.100.200' }),
    url: 'https://example.com/admin/intake/login',
    async formData() {
      globalThis.__adminIntakeRouteFormDataCalls += 1;
      const formData = new FormData();
      formData.set('token', token);
      return formData;
    },
  };
}

function readRedirect(response) {
  const location = new URL(response.headers.get('Location'));
  return {
    error: location.searchParams.get('error'),
    pathname: location.pathname,
    retryAfter: response.headers.get('Retry-After'),
    status: response.status,
  };
}

try {
  await mkdir(libStubDir, { recursive: true });
  await mkdir(nextStubDir, { recursive: true });
  await writeFile(
    join(nextStubDir, 'server.js'),
    [
      'exports.NextResponse = {',
      '  redirect: (url, init = {}) => {',
      '    const headers = new Headers(init.headers);',
      "    headers.set('Location', String(url));",
      '    const response = new Response(null, { status: init.status || 307, headers });',
      '    response.cookies = {',
      '      set: (...args) => globalThis.__adminIntakeRouteCookieCalls.push(args),',
      '    };',
      '    return response;',
      '  },',
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'admin-intake-auth.js'),
    [
      "exports.ADMIN_INTAKE_COOKIE = 'admin-intake';",
      "exports.adminIntakeCookieValue = () => 'hashed-admin-cookie';",
      'exports.verifyAdminIntakeToken = (token) => {',
      '  globalThis.__adminIntakeRouteVerifyCalls.push(token);',
      "  return token === 'valid-token';",
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'admin-intake-rate-limit.js'),
    [
      'exports.checkAdminIntakeLoginRateLimit = (headers) => {',
      "  globalThis.__adminIntakeRouteRateLimitCalls.push(headers.get('x-real-ip'));",
      '  return globalThis.__adminIntakeRouteRateLimit;',
      '};',
      'exports.recordAdminIntakeLoginFailure = (headers) => {',
      "  globalThis.__adminIntakeRouteRecordCalls.push(headers.get('x-real-ip'));",
      '};',
      'exports.clearAdminIntakeLoginFailures = (headers) => {',
      "  globalThis.__adminIntakeRouteClearCalls.push(headers.get('x-real-ip'));",
      '};',
      '',
    ].join('\n'),
  );

  const rateLimitSource = await readFile(rateLimitSourceUrl, 'utf8');
  const compiledRateLimit = ts.transpileModule(rateLimitSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledRateLimitPath, compiledRateLimit.outputText);

  const loginRouteSource = await readFile(loginRouteSourceUrl, 'utf8');
  const compiledLoginRoute = ts.transpileModule(loginRouteSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledLoginRoutePath, compiledLoginRoute.outputText);

  const require = createRequire(import.meta.url);
  const {
    ADMIN_INTAKE_LOGIN_RATE_LIMIT,
    checkAdminIntakeLoginRateLimit,
    clearAdminIntakeLoginFailures,
    recordAdminIntakeLoginFailure,
  } = require(compiledRateLimitPath);
  const { POST: loginRoutePOST } = require(compiledLoginRoutePath);
  Date.now = () => now;

  resetStore();
  assert.equal(ADMIN_INTAKE_LOGIN_RATE_LIMIT.failureLimit, 5);
  assert.equal(ADMIN_INTAKE_LOGIN_RATE_LIMIT.windowMs, 900_000);
  for (let index = 0; index < 5; index += 1) {
    assert.deepEqual(checkAdminIntakeLoginRateLimit(testHeaders()), { ok: true });
    recordAdminIntakeLoginFailure(testHeaders());
  }
  assert.deepEqual(checkAdminIntakeLoginRateLimit(testHeaders()), {
    ok: false,
    retryAfterSeconds: 900,
  });
  assert.deepEqual(checkAdminIntakeLoginRateLimit(testHeaders({ realIp: '198.51.100.7' })), { ok: true });
  now += 900_000;
  assert.deepEqual(checkAdminIntakeLoginRateLimit(testHeaders()), { ok: true });

  resetStore();
  for (let index = 0; index < 5; index += 1) {
    recordAdminIntakeLoginFailure(testHeaders({
      realIp: '203.0.113.10',
      forwardedFor: `198.51.100.${index}`,
    }));
  }
  assert.deepEqual(checkAdminIntakeLoginRateLimit(testHeaders({
    realIp: '203.0.113.10',
    forwardedFor: '198.51.100.200',
  })), {
    ok: false,
    retryAfterSeconds: 900,
  });
  assert.deepEqual(checkAdminIntakeLoginRateLimit(testHeaders({
    realIp: '203.0.113.99',
    forwardedFor: '198.51.100.200',
  })), { ok: true });

  resetStore();
  for (let index = 0; index < 5; index += 1) {
    recordAdminIntakeLoginFailure(testHeaders({
      realIp: '',
      forwardedFor: `198.51.100.${index}`,
      cfIp: '203.0.113.88',
    }));
  }
  assert.deepEqual(checkAdminIntakeLoginRateLimit(testHeaders({
    realIp: '',
    forwardedFor: '198.51.100.200',
    cfIp: '203.0.113.88',
  })), {
    ok: false,
    retryAfterSeconds: 900,
  });

  resetStore();
  for (let index = 0; index < 5; index += 1) {
    recordAdminIntakeLoginFailure(testHeaders());
  }
  assert.equal(checkAdminIntakeLoginRateLimit(testHeaders()).ok, false);
  clearAdminIntakeLoginFailures(testHeaders());
  assert.deepEqual(checkAdminIntakeLoginRateLimit(testHeaders()), { ok: true });

  resetRouteState({ rateLimit: { ok: false, retryAfterSeconds: 42 } });
  let response = readRedirect(await loginRoutePOST(makeLoginRequest('valid-token')));
  assert.equal(response.status, 303);
  assert.equal(response.pathname, '/admin/intake');
  assert.equal(response.error, 'rate_limited');
  assert.equal(response.retryAfter, '42');
  assert.equal(globalThis.__adminIntakeRouteFormDataCalls, 0);
  assert.deepEqual(globalThis.__adminIntakeRouteVerifyCalls, []);
  assert.deepEqual(globalThis.__adminIntakeRouteRecordCalls, []);
  assert.deepEqual(globalThis.__adminIntakeRouteClearCalls, []);

  resetRouteState();
  response = readRedirect(await loginRoutePOST(makeLoginRequest('bad-token')));
  assert.equal(response.status, 303);
  assert.equal(response.pathname, '/admin/intake');
  assert.equal(response.error, 'invalid');
  assert.equal(response.retryAfter, null);
  assert.equal(globalThis.__adminIntakeRouteFormDataCalls, 1);
  assert.deepEqual(globalThis.__adminIntakeRouteVerifyCalls, ['bad-token']);
  assert.deepEqual(globalThis.__adminIntakeRouteRecordCalls, ['203.0.113.44']);
  assert.deepEqual(globalThis.__adminIntakeRouteClearCalls, []);
  assert.deepEqual(globalThis.__adminIntakeRouteCookieCalls, []);

  resetRouteState();
  response = readRedirect(await loginRoutePOST(makeLoginRequest('valid-token')));
  assert.equal(response.status, 303);
  assert.equal(response.pathname, '/admin/intake');
  assert.equal(response.error, null);
  assert.equal(globalThis.__adminIntakeRouteFormDataCalls, 1);
  assert.deepEqual(globalThis.__adminIntakeRouteVerifyCalls, ['valid-token']);
  assert.deepEqual(globalThis.__adminIntakeRouteRecordCalls, []);
  assert.deepEqual(globalThis.__adminIntakeRouteClearCalls, ['203.0.113.44']);
  assert.equal(globalThis.__adminIntakeRouteCookieCalls.length, 1);
  assert.equal(globalThis.__adminIntakeRouteCookieCalls[0][0], 'admin-intake');
  assert.equal(globalThis.__adminIntakeRouteCookieCalls[0][1], 'hashed-admin-cookie');
  assert.equal(globalThis.__adminIntakeRouteCookieCalls[0][2].httpOnly, true);

  console.log('Admin intake login rate-limit tests passed.');
} finally {
  Date.now = originalNow;
  resetStore();
  await rm(testDir, { recursive: true, force: true });
}
