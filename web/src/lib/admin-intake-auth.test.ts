import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  adminIntakeConfigured,
  adminIntakeCookieValue,
  verifyAdminIntakeCookie,
  verifyAdminIntakeCredentials,
} from '@/lib/admin-intake-auth';

const ENV_KEYS = [
  'ADMIN_INTAKE_USERS',
  'ADMIN_SESSION_SIGNING_SECRET',
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const webRoot = process.cwd();

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

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

function setUsers(value: string | undefined) {
  if (value === undefined) {
    delete process.env.ADMIN_INTAKE_USERS;
    return;
  }
  process.env.ADMIN_INTAKE_USERS = value;
}

function setSigningSecret(value: string | undefined) {
  if (value === undefined) {
    delete process.env.ADMIN_SESSION_SIGNING_SECRET;
    return;
  }
  process.env.ADMIN_SESSION_SIGNING_SECRET = value;
}

afterEach(() => {
  restoreEnv();
});

describe('admin intake named accounts', () => {
  it('fails closed until named users and a strong signing secret are configured', () => {
    setUsers(undefined);
    setSigningSecret(undefined);

    expect(adminIntakeConfigured()).toBe(false);
    expect(verifyAdminIntakeCredentials('juan', 'valid-token')).toBeNull();
    expect(adminIntakeCookieValue({ actorId: 'juan', actorKind: 'named_admin' })).toBe('');
    expect(verifyAdminIntakeCookie('')).toBeNull();

    setUsers([
      'bad-entry',
      `bad space:${sha256('ignored')}`,
      'juan:not-a-hash',
      `juan:${sha256('valid-token')}`,
      `ops:${sha256('ops-token')}`,
    ].join(','));

    expect(adminIntakeConfigured()).toBe(false);
    expect(verifyAdminIntakeCredentials('juan', 'valid-token')).toEqual({
      actorId: 'juan',
      actorKind: 'named_admin',
    });
    expect(adminIntakeCookieValue({ actorId: 'juan', actorKind: 'named_admin' })).toBe('');

    setSigningSecret('too-short');
    expect(adminIntakeConfigured()).toBe(false);

    setSigningSecret('0123456789abcdef0123456789abcdef');
    expect(adminIntakeConfigured()).toBe(true);
  });

  it('verifies credentials and signs tamper-resistant named admin cookies', () => {
    setUsers([
      `juan:${sha256('valid-token')}`,
      `ops:${sha256('ops-token')}`,
    ].join(','));
    setSigningSecret('0123456789abcdef0123456789abcdef');

    expect(verifyAdminIntakeCredentials('juan', 'wrong-token')).toBeNull();
    expect(verifyAdminIntakeCredentials('missing', 'valid-token')).toBeNull();
    expect(verifyAdminIntakeCredentials('juan', 'valid-token')).toEqual({
      actorId: 'juan',
      actorKind: 'named_admin',
    });

    const cookie = adminIntakeCookieValue({ actorId: 'juan', actorKind: 'named_admin' });
    expect(cookie).toMatch(/^v2\.[^.]+\.[^.]+$/);
    expect(verifyAdminIntakeCookie(cookie)).toEqual({
      actorId: 'juan',
      actorKind: 'named_admin',
    });

    const [version, payload, signature] = cookie.split('.');
    expect(verifyAdminIntakeCookie(`${version}.${payload}.bad${signature}`)).toBeNull();
  });

  it('invalidates sessions when signing secrets, admins, or tokens rotate', () => {
    setUsers(`juan:${sha256('valid-token')}`);
    setSigningSecret('0123456789abcdef0123456789abcdef');
    const cookie = adminIntakeCookieValue({ actorId: 'juan', actorKind: 'named_admin' });

    setSigningSecret('fedcba9876543210fedcba9876543210');
    expect(verifyAdminIntakeCookie(cookie)).toBeNull();

    setSigningSecret('0123456789abcdef0123456789abcdef');
    setUsers(`ops:${sha256('ops-token')}`);
    expect(verifyAdminIntakeCookie(cookie)).toBeNull();

    setUsers(`juan:${sha256('rotated-token')}`);
    expect(verifyAdminIntakeCookie(cookie)).toBeNull();
    const rotatedCookie = adminIntakeCookieValue({ actorId: 'juan', actorKind: 'named_admin' });
    expect(verifyAdminIntakeCookie(rotatedCookie)).toEqual({
      actorId: 'juan',
      actorKind: 'named_admin',
    });
  });

  it('keeps runtime admin surfaces wired to named actors only', async () => {
    const [loginRouteSource, adminPageSource, csvRouteSource, accessLogSource] =
      await Promise.all([
        readFile(join(webRoot, 'src/app/admin/intake/login/route.ts'), 'utf8'),
        readFile(join(webRoot, 'src/app/admin/intake/page.tsx'), 'utf8'),
        readFile(join(webRoot, 'src/app/admin/intake/gap-report/[requestId]/csv/route.ts'), 'utf8'),
        readFile(join(webRoot, 'src/lib/admin-access-log.ts'), 'utf8'),
      ]);

    expect(loginRouteSource).toContain('verifyAdminIntakeCredentials(adminId, token)');
    expect(loginRouteSource).toContain('adminIntakeCookieValue(session)');
    expect(adminPageSource).toContain('name="adminId"');
    expect(adminPageSource).toContain('ADMIN_INTAKE_USERS');
    expect(adminPageSource).toContain('ADMIN_SESSION_SIGNING_SECRET');
    expect(csvRouteSource).toContain('actorId: adminSession.actorId');
    expect(csvRouteSource).toContain('actorKind: adminSession.actorKind');
    expect(accessLogSource).toContain("actorKind: 'named_admin'");

    const legacySharedActor = ['shared', 'admin', 'token'].join('-');
    expect([
      loginRouteSource,
      adminPageSource,
      csvRouteSource,
      accessLogSource,
    ].join('\n')).not.toContain(legacySharedActor);
  });
});
