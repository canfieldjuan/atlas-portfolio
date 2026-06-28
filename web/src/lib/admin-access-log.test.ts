import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adminAccessLogConfigured,
  recordAdminAccessEvent,
} from '@/lib/admin-access-log';

type QueryCall = { sql: string; params: unknown[] };

const dbState = vi.hoisted(() => ({
  databaseUrls: [] as string[],
  queries: [] as QueryCall[],
  shouldThrow: false,
  neon: vi.fn(),
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: dbState.neon,
}));

const ENV_KEYS = [
  'ADMIN_ACCESS_LOG_DATABASE_URL',
  'AUDIT_INTAKE_DATABASE_URL',
  'GAP_REPORT_DATABASE_URL',
  'DATABASE_URL',
  'POSTGRES_URL',
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const webRoot = process.cwd();
const adminAccessCacheKey = Symbol.for('atlas-portfolio.admin-access-log.neon-clients');

async function query(sql: string, params: unknown[]) {
  dbState.queries.push({ sql, params });
  if (dbState.shouldThrow) throw new Error('db down');
  return [];
}

dbState.neon.mockImplementation((databaseUrl: string) => {
  dbState.databaseUrls.push(databaseUrl);
  return { query };
});

function restoreEnv() {
  for (const key of ENV_KEYS) {
    const value = originalEnv[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function resetEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}) {
  for (const key of ENV_KEYS) delete process.env[key];
  Object.assign(process.env, values);
}

function resetAdminAccessCache() {
  delete (globalThis as Record<symbol, unknown>)[adminAccessCacheKey];
}

beforeEach(() => {
  resetEnv();
  resetAdminAccessCache();
  dbState.databaseUrls = [];
  dbState.queries = [];
  dbState.shouldThrow = false;
  dbState.neon.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
  restoreEnv();
  resetAdminAccessCache();
});

describe('admin access ledger', () => {
  it('does not write when no ledger database URL is configured', async () => {
    expect(adminAccessLogConfigured()).toBe(false);

    await expect(recordAdminAccessEvent({
      actorId: 'juan',
      actorKind: 'named_admin',
      action: 'admin_intake_view',
      targetType: 'admin_intake_queue',
      headers: new Headers(),
    })).resolves.toEqual({ ok: false, reason: 'not_configured' });

    expect(dbState.neon).not.toHaveBeenCalled();
    expect(dbState.queries).toHaveLength(0);
  });

  it('writes sanitized admin access events through the real ledger helper', async () => {
    resetEnv({ ADMIN_ACCESS_LOG_DATABASE_URL: 'postgres://admin-ledger' });

    expect(adminAccessLogConfigured()).toBe(true);
    await expect(recordAdminAccessEvent({
      actorId: ' juan ',
      actorKind: 'named_admin',
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
    })).resolves.toEqual({ ok: true });

    expect(dbState.databaseUrls).toEqual(['postgres://admin-ledger']);
    expect(dbState.queries).toHaveLength(1);
    const queryCall = dbState.queries[0];
    expect(queryCall.sql).toMatch(/INSERT INTO portfolio_admin_access_events/);
    expect(queryCall.params[0]).toBe('juan');
    expect(queryCall.params[1]).toBe('named_admin');
    expect(queryCall.params[2]).toBe('gap_report_csv_download');
    expect(queryCall.params[3]).toBe('gap_report_submission');
    expect(queryCall.params[4]).toBe('00000000-0000-4000-8000-000000000000');
    expect(queryCall.params[5]).toBe('203.0.113.10');
    expect(queryCall.params[6]).toBe('Unit Test Browser');
    expect(JSON.parse(String(queryCall.params[7]))).toEqual({
      sourceOffer: 'support-ticket-deflection-intake',
      supportPlatform: 'zendesk',
      reallyLong: 'x'.repeat(240),
    });
  });

  it('logs write failures with the real structured runtime logger', async () => {
    resetEnv({ ADMIN_ACCESS_LOG_DATABASE_URL: 'postgres://admin-ledger' });
    dbState.shouldThrow = true;
    const consoleErrors: string[] = [];
    vi.spyOn(console, 'error').mockImplementation((message) => {
      consoleErrors.push(String(message));
    });

    await expect(recordAdminAccessEvent({
      actorId: 'juan',
      actorKind: 'named_admin',
      action: 'admin_intake_view',
      targetType: 'admin_intake_queue',
      headers: new Headers({ 'cf-connecting-ip': '198.51.100.5' }),
    })).resolves.toEqual({ ok: false, reason: 'error' });

    expect(consoleErrors).toHaveLength(1);
    const payload = JSON.parse(consoleErrors[0]) as Record<string, unknown>;
    expect(payload.event).toBe('admin.access_log.write_failed');
    expect(payload.action).toBe('admin_intake_view');
    expect(payload.targetType).toBe('admin_intake_queue');
    expect(payload.error).toEqual({ name: 'Error' });
  });

  it('keeps the admin page and CSV route wired to named admin ledger events', async () => {
    const [adminPageSource, csvRouteSource] = await Promise.all([
      readFile(join(webRoot, 'src/app/admin/intake/page.tsx'), 'utf8'),
      readFile(join(webRoot, 'src/app/admin/intake/gap-report/[requestId]/csv/route.ts'), 'utf8'),
    ]);

    expect(adminPageSource).toContain('actorId: adminSession.actorId');
    expect(adminPageSource).toContain('actorKind: adminSession.actorKind');
    expect(adminPageSource).toContain("action: 'admin_intake_view'");
    expect(csvRouteSource).toContain('actorId: adminSession.actorId');
    expect(csvRouteSource).toContain('actorKind: adminSession.actorKind');
    expect(csvRouteSource).toContain("action: 'gap_report_csv_download'");
    expect(csvRouteSource.indexOf('const blob = await getPrivateCsvBlob')).toBeLessThan(
      csvRouteSource.indexOf('const accessLog = await recordAdminAccessEvent'),
    );
    expect(csvRouteSource.indexOf('const accessLog = await recordAdminAccessEvent')).toBeLessThan(
      csvRouteSource.indexOf('return new Response(blob.stream'),
    );
  });

  it('keeps the SQL ledger protected against destructive edits', async () => {
    const sqlSource = await readFile(
      join(webRoot, 'sql/004_portfolio_admin_access_events.sql'),
      'utf8',
    );

    expect(sqlSource).toMatch(/BEFORE TRUNCATE ON portfolio_admin_access_events/);
    expect(sqlSource).toMatch(
      /REVOKE UPDATE, DELETE, TRUNCATE ON portfolio_admin_access_events FROM PUBLIC/,
    );
  });
});
