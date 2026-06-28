import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-admin-intake-named-accounts-'));
const helperUrl = new URL('../src/lib/admin-intake-auth.ts', import.meta.url);
const loginRouteUrl = new URL('../src/app/admin/intake/login/route.ts', import.meta.url);
const adminPageUrl = new URL('../src/app/admin/intake/page.tsx', import.meta.url);
const csvRouteUrl = new URL(
  '../src/app/admin/intake/gap-report/[requestId]/csv/route.ts',
  import.meta.url,
);
const accessLogUrl = new URL('../src/lib/admin-access-log.ts', import.meta.url);
const compiledHelperPath = join(testDir, 'admin-intake-auth.cjs');
const originalUsers = process.env.ADMIN_INTAKE_USERS;
const originalSigningSecret = process.env.ADMIN_SESSION_SIGNING_SECRET;

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function setUsers(value) {
  if (value === undefined) {
    delete process.env.ADMIN_INTAKE_USERS;
    return;
  }
  process.env.ADMIN_INTAKE_USERS = value;
}

function setSigningSecret(value) {
  if (value === undefined) {
    delete process.env.ADMIN_SESSION_SIGNING_SECRET;
    return;
  }
  process.env.ADMIN_SESSION_SIGNING_SECRET = value;
}

try {
  await mkdir(testDir, { recursive: true });
  const helperSource = await readFile(helperUrl, 'utf8');
  const compiledHelper = ts.transpileModule(helperSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledHelperPath, compiledHelper.outputText);

  const require = createRequire(compiledHelperPath);
  const {
    adminIntakeConfigured,
    adminIntakeCookieValue,
    verifyAdminIntakeCookie,
    verifyAdminIntakeCredentials,
  } = require(compiledHelperPath);

  setUsers(undefined);
  setSigningSecret(undefined);
  assert.equal(adminIntakeConfigured(), false);
  assert.equal(verifyAdminIntakeCredentials('juan', 'valid-token'), null);
  assert.equal(adminIntakeCookieValue({ actorId: 'juan', actorKind: 'named_admin' }), '');
  assert.equal(verifyAdminIntakeCookie(''), null);

  setUsers([
    'bad-entry',
    `bad space:${sha256('ignored')}`,
    'juan:not-a-hash',
    `juan:${sha256('valid-token')}`,
    `ops:${sha256('ops-token')}`,
  ].join(','));
  assert.equal(adminIntakeConfigured(), false, 'credential hashes alone should not configure admin auth');
  assert.deepEqual(verifyAdminIntakeCredentials('juan', 'valid-token'), {
    actorId: 'juan',
    actorKind: 'named_admin',
  });
  assert.equal(adminIntakeCookieValue({ actorId: 'juan', actorKind: 'named_admin' }), '');

  setSigningSecret('too-short');
  assert.equal(adminIntakeConfigured(), false, 'short signing secrets should fail closed');

  setSigningSecret('0123456789abcdef0123456789abcdef');
  assert.equal(adminIntakeConfigured(), true);
  assert.equal(verifyAdminIntakeCredentials('juan', 'wrong-token'), null);
  assert.equal(verifyAdminIntakeCredentials('missing', 'valid-token'), null);
  assert.deepEqual(verifyAdminIntakeCredentials('juan', 'valid-token'), {
    actorId: 'juan',
    actorKind: 'named_admin',
  });

  const cookie = adminIntakeCookieValue({ actorId: 'juan', actorKind: 'named_admin' });
  assert.match(cookie, /^v2\.[^.]+\.[^.]+$/);
  assert.deepEqual(verifyAdminIntakeCookie(cookie), {
    actorId: 'juan',
    actorKind: 'named_admin',
  });

  const [version, payload, signature] = cookie.split('.');
  assert.equal(verifyAdminIntakeCookie(`${version}.${payload}.bad${signature}`), null);

  setSigningSecret('fedcba9876543210fedcba9876543210');
  assert.equal(verifyAdminIntakeCookie(cookie), null, 'signing-secret rotation should invalidate existing sessions');

  setSigningSecret('0123456789abcdef0123456789abcdef');
  setUsers(`ops:${sha256('ops-token')}`);
  assert.equal(verifyAdminIntakeCookie(cookie), null, 'removed admins should lose existing sessions');

  setUsers(`juan:${sha256('rotated-token')}`);
  assert.equal(verifyAdminIntakeCookie(cookie), null, 'token rotation should invalidate existing sessions');
  const rotatedCookie = adminIntakeCookieValue({ actorId: 'juan', actorKind: 'named_admin' });
  assert.deepEqual(verifyAdminIntakeCookie(rotatedCookie), {
    actorId: 'juan',
    actorKind: 'named_admin',
  });

  const [loginRouteSource, adminPageSource, csvRouteSource, accessLogSource] = await Promise.all([
    readFile(loginRouteUrl, 'utf8'),
    readFile(adminPageUrl, 'utf8'),
    readFile(csvRouteUrl, 'utf8'),
    readFile(accessLogUrl, 'utf8'),
  ]);

  assert.ok(
    loginRouteSource.includes('verifyAdminIntakeCredentials(adminId, token)'),
    'login route should verify named admin id + token credentials',
  );
  assert.ok(
    loginRouteSource.includes('adminIntakeCookieValue(session)'),
    'login route should sign the verified named session',
  );
  assert.ok(
    adminPageSource.includes('name="adminId"'),
    'login page should ask for an admin id',
  );
  assert.ok(
    adminPageSource.includes('ADMIN_INTAKE_USERS'),
    'login page should point operators at the named-admin env var',
  );
  assert.ok(
    adminPageSource.includes('ADMIN_SESSION_SIGNING_SECRET'),
    'login page should point operators at the signing-secret env var',
  );
  assert.ok(
    csvRouteSource.includes('actorId: adminSession.actorId') &&
      csvRouteSource.includes('actorKind: adminSession.actorKind'),
    'CSV route should log the named admin actor',
  );
  assert.ok(
    accessLogSource.includes("actorKind: 'named_admin'"),
    'access log input should require a named admin actor kind',
  );
  const legacySharedActor = ['shared', 'admin', 'token'].join('-');
  assert.equal(
    [loginRouteSource, adminPageSource, csvRouteSource, accessLogSource].join('\n').includes(legacySharedActor),
    false,
    'runtime admin surfaces should not retain the shared-token actor',
  );

  console.log('Admin intake named-account tests passed.');
} finally {
  setUsers(originalUsers);
  setSigningSecret(originalSigningSecret);
  await rm(testDir, { recursive: true, force: true });
}
