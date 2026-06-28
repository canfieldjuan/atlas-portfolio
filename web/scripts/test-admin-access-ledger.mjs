import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';

const testDir = await mkdtemp(join(tmpdir(), 'atlas-admin-access-ledger-'));
const helperUrl = new URL('../src/lib/admin-access-log.ts', import.meta.url);
const adminPageUrl = new URL('../src/app/admin/intake/page.tsx', import.meta.url);
const csvRouteUrl = new URL(
  '../src/app/admin/intake/gap-report/[requestId]/csv/route.ts',
  import.meta.url,
);
const compiledHelperPath = join(testDir, 'admin-access-log.cjs');
const neonStubDir = join(testDir, 'node_modules', '@neondatabase', 'serverless');
const libStubDir = join(testDir, 'node_modules', '@', 'lib');
const ENV_KEYS = [
  'ADMIN_ACCESS_LOG_DATABASE_URL',
  'AUDIT_INTAKE_DATABASE_URL',
  'GAP_REPORT_DATABASE_URL',
  'DATABASE_URL',
  'POSTGRES_URL',
];
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));

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

try {
  await mkdir(neonStubDir, { recursive: true });
  await mkdir(libStubDir, { recursive: true });
  await writeFile(
    join(neonStubDir, 'index.js'),
    [
      'exports.neon = (databaseUrl) => {',
      '  globalThis.__adminAccessLedgerDatabaseUrls.push(databaseUrl);',
      '  return {',
      '    query: async (sql, params) => {',
      '      globalThis.__adminAccessLedgerQueries.push({ sql, params });',
      '      if (globalThis.__adminAccessLedgerThrow) throw new Error("db down");',
      '      return [];',
      '    },',
      '  };',
      '};',
      '',
    ].join('\n'),
  );
  await writeFile(
    join(libStubDir, 'structured-runtime-log.js'),
    [
      'exports.structuredRuntimeError = (event, fields) => {',
      '  globalThis.__adminAccessLedgerLogs.push({ event, fields });',
      '};',
      '',
    ].join('\n'),
  );

  const helperSource = await readFile(helperUrl, 'utf8');
  const compiledHelper = ts.transpileModule(helperSource, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  });
  await writeFile(compiledHelperPath, compiledHelper.outputText);

  globalThis.__adminAccessLedgerDatabaseUrls = [];
  globalThis.__adminAccessLedgerQueries = [];
  globalThis.__adminAccessLedgerLogs = [];
  globalThis.__adminAccessLedgerThrow = false;

  const require = createRequire(compiledHelperPath);
  const { adminAccessLogConfigured, recordAdminAccessEvent } = require(compiledHelperPath);

  resetEnv();
  assert.equal(adminAccessLogConfigured(), false);
  assert.deepEqual(
    await recordAdminAccessEvent({
      action: 'admin_intake_view',
      targetType: 'admin_intake_queue',
      headers: new Headers(),
    }),
    { ok: false, reason: 'not_configured' },
  );
  assert.equal(globalThis.__adminAccessLedgerQueries.length, 0);

  resetEnv({ ADMIN_ACCESS_LOG_DATABASE_URL: 'postgres://admin-ledger' });
  assert.equal(adminAccessLogConfigured(), true);
  assert.deepEqual(
    await recordAdminAccessEvent({
      action: 'gap_report_csv_download',
      targetType: 'gap_report_submission',
      targetRequestId: '00000000-0000-4000-8000-000000000000',
      headers: new Headers({
        'x-real-ip': '203.0.113.10',
        'cf-connecting-ip': '198.51.100.10',
        'user-agent': 'Unit Test Browser',
      }),
      metadata: {
        sourceOffer: 'support-ticket-deflection-intake',
        supportPlatform: 'zendesk',
        badKey: { nested: true },
        reallyLong: 'x'.repeat(500),
      },
    }),
    { ok: true },
  );

  assert.deepEqual(globalThis.__adminAccessLedgerDatabaseUrls, ['postgres://admin-ledger']);
  assert.equal(globalThis.__adminAccessLedgerQueries.length, 1);
  const query = globalThis.__adminAccessLedgerQueries[0];
  assert.match(query.sql, /INSERT INTO portfolio_admin_access_events/);
  assert.equal(query.params[0], 'shared-admin-token');
  assert.equal(query.params[1], 'shared_admin_token');
  assert.equal(query.params[2], 'gap_report_csv_download');
  assert.equal(query.params[3], 'gap_report_submission');
  assert.equal(query.params[4], '00000000-0000-4000-8000-000000000000');
  assert.equal(query.params[5], '203.0.113.10');
  assert.equal(query.params[6], 'Unit Test Browser');
  assert.deepEqual(JSON.parse(query.params[7]), {
    sourceOffer: 'support-ticket-deflection-intake',
    supportPlatform: 'zendesk',
    reallyLong: 'x'.repeat(240),
  });

  globalThis.__adminAccessLedgerThrow = true;
  assert.deepEqual(
    await recordAdminAccessEvent({
      action: 'admin_intake_view',
      targetType: 'admin_intake_queue',
      headers: new Headers({ 'cf-connecting-ip': '198.51.100.5' }),
    }),
    { ok: false, reason: 'error' },
  );
  assert.equal(globalThis.__adminAccessLedgerLogs[0].event, 'admin.access_log.write_failed');

  const [adminPageSource, csvRouteSource] = await Promise.all([
    readFile(adminPageUrl, 'utf8'),
    readFile(csvRouteUrl, 'utf8'),
  ]);
  assert.ok(
    adminPageSource.includes("action: 'admin_intake_view'"),
    'admin intake page should record authorized PII queue views',
  );
  assert.ok(
    csvRouteSource.includes("action: 'gap_report_csv_download'"),
    'CSV route should record raw CSV downloads',
  );
  assert.ok(
    csvRouteSource.indexOf('const blob = await getPrivateCsvBlob') <
      csvRouteSource.indexOf('const accessLog = await recordAdminAccessEvent'),
    'CSV access logging should happen after private Blob validation',
  );
  assert.ok(
    csvRouteSource.indexOf('const accessLog = await recordAdminAccessEvent') <
      csvRouteSource.indexOf('return new Response(blob.stream'),
    'CSV access logging should happen before streaming the private Blob',
  );

  const sqlSource = await readFile(new URL('../sql/004_portfolio_admin_access_events.sql', import.meta.url), 'utf8');
  assert.match(sqlSource, /BEFORE TRUNCATE ON portfolio_admin_access_events/);
  assert.match(sqlSource, /REVOKE UPDATE, DELETE, TRUNCATE ON portfolio_admin_access_events FROM PUBLIC/);

  console.log('Admin access ledger tests passed.');
} finally {
  restoreEnv();
  await rm(testDir, { recursive: true, force: true });
}
