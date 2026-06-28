import { createHash } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as loginRoutePOST } from '@/app/admin/intake/login/route';
import { ADMIN_INTAKE_COOKIE } from '@/lib/admin-intake-auth';
import {
  ADMIN_INTAKE_LOGIN_RATE_LIMIT,
  checkAdminIntakeLoginRateLimit,
  clearAdminIntakeLoginFailures,
  recordAdminIntakeLoginFailure,
} from '@/lib/admin-intake-rate-limit';

const ENV_KEYS = ['ADMIN_INTAKE_USERS', 'ADMIN_SESSION_SIGNING_SECRET'] as const;
const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const TEST_SIGNING_SECRET = ['test-admin', 'intake-session', 'signing-secret'].join('-');
let now = 1_700_000_000_000;

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

function testHeaders({
  realIp = '203.0.113.10',
  forwardedFor,
  cfIp,
}: { realIp?: string; forwardedFor?: string; cfIp?: string } = {}) {
  const headers = new Headers();
  if (realIp) headers.set('x-real-ip', realIp);
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);
  if (cfIp) headers.set('cf-connecting-ip', cfIp);
  return headers;
}

function resetStore() {
  delete globalThis.__atlasAdminIntakeLoginRateLimitStore;
}

function restoreEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
    if (originalEnv[key] !== undefined) process.env[key] = originalEnv[key];
  }
}

function configureAdminAuth() {
  process.env.ADMIN_INTAKE_USERS = `juan:${sha256('valid-token')}`;
  process.env.ADMIN_SESSION_SIGNING_SECRET = TEST_SIGNING_SECRET;
}

function makeLoginRequest(token: string, ip = '203.0.113.44') {
  return {
    headers: testHeaders({ realIp: ip, forwardedFor: '198.51.100.200' }),
    url: 'https://example.com/admin/intake/login',
    async formData() {
      const formData = new FormData();
      formData.set('adminId', 'juan');
      formData.set('token', token);
      return formData;
    },
  };
}

function makeThrowingFormRequest(ip = '203.0.113.55') {
  return {
    headers: testHeaders({ realIp: ip }),
    url: 'https://example.com/admin/intake/login',
    async formData(): Promise<FormData> {
      throw new Error('form parse failed');
    },
  };
}

function readRedirect(response: Response) {
  const location = new URL(response.headers.get('Location') ?? '');
  return {
    error: location.searchParams.get('error'),
    pathname: location.pathname,
    retryAfter: response.headers.get('Retry-After'),
    setCookie: response.headers.get('Set-Cookie'),
    status: response.status,
  };
}

beforeEach(() => {
  restoreEnv();
  configureAdminAuth();
  resetStore();
  now = 1_700_000_000_000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
});

afterAll(() => {
  vi.restoreAllMocks();
  resetStore();
  restoreEnv();
});

describe('admin intake login rate-limit helper', () => {
  it('locks out an IP after the configured failure limit until the window resets', () => {
    expect(ADMIN_INTAKE_LOGIN_RATE_LIMIT.failureLimit).toBe(5);
    expect(ADMIN_INTAKE_LOGIN_RATE_LIMIT.windowMs).toBe(900_000);

    for (let index = 0; index < 5; index += 1) {
      expect(checkAdminIntakeLoginRateLimit(testHeaders())).toEqual({ ok: true });
      recordAdminIntakeLoginFailure(testHeaders());
    }
    expect(checkAdminIntakeLoginRateLimit(testHeaders())).toEqual({
      ok: false,
      retryAfterSeconds: 900,
    });
    expect(checkAdminIntakeLoginRateLimit(testHeaders({ realIp: '198.51.100.7' }))).toEqual({
      ok: true,
    });

    now += 900_000;
    expect(checkAdminIntakeLoginRateLimit(testHeaders())).toEqual({ ok: true });
  });

  it('keys by trusted direct IP and falls back to Cloudflare IP when real IP is absent', () => {
    for (let index = 0; index < 5; index += 1) {
      recordAdminIntakeLoginFailure(
        testHeaders({
          realIp: '203.0.113.10',
          forwardedFor: `198.51.100.${index}`,
        }),
      );
    }
    expect(
      checkAdminIntakeLoginRateLimit(
        testHeaders({
          realIp: '203.0.113.10',
          forwardedFor: '198.51.100.200',
        }),
      ),
    ).toEqual({
      ok: false,
      retryAfterSeconds: 900,
    });
    expect(
      checkAdminIntakeLoginRateLimit(
        testHeaders({
          realIp: '203.0.113.99',
          forwardedFor: '198.51.100.200',
        }),
      ),
    ).toEqual({ ok: true });

    resetStore();
    for (let index = 0; index < 5; index += 1) {
      recordAdminIntakeLoginFailure(
        testHeaders({
          realIp: '',
          forwardedFor: `198.51.100.${index}`,
          cfIp: '203.0.113.88',
        }),
      );
    }
    expect(
      checkAdminIntakeLoginRateLimit(
        testHeaders({
          realIp: '',
          forwardedFor: '198.51.100.200',
          cfIp: '203.0.113.88',
        }),
      ),
    ).toEqual({
      ok: false,
      retryAfterSeconds: 900,
    });
  });

  it('fails closed when the active bucket store is full and clears failures on success', () => {
    for (let index = 0; index < 5; index += 1) {
      recordAdminIntakeLoginFailure(testHeaders({ realIp: '203.0.113.10' }));
    }
    for (let index = 0; index < 999; index += 1) {
      recordAdminIntakeLoginFailure(testHeaders({ realIp: `198.51.100.${index}` }));
    }
    expect(checkAdminIntakeLoginRateLimit(testHeaders({ realIp: '192.0.2.200' }))).toEqual({
      ok: false,
      retryAfterSeconds: 900,
    });
    expect(checkAdminIntakeLoginRateLimit(testHeaders({ realIp: '203.0.113.10' }))).toEqual({
      ok: false,
      retryAfterSeconds: 900,
    });

    resetStore();
    for (let index = 0; index < 5; index += 1) {
      recordAdminIntakeLoginFailure(testHeaders());
    }
    expect(checkAdminIntakeLoginRateLimit(testHeaders()).ok).toBe(false);
    clearAdminIntakeLoginFailures(testHeaders());
    expect(checkAdminIntakeLoginRateLimit(testHeaders())).toEqual({ ok: true });
  });
});

describe('admin intake login route rate limiting', () => {
  it('redirects without parsing credentials when the request is already locked out', async () => {
    for (let index = 0; index < 5; index += 1) {
      recordAdminIntakeLoginFailure(testHeaders({ realIp: '203.0.113.44' }));
    }

    const response = readRedirect(
      await loginRoutePOST(makeLoginRequest('valid-token') as never),
    );

    expect(response.status).toBe(303);
    expect(response.pathname).toBe('/admin/intake');
    expect(response.error).toBe('rate_limited');
    expect(response.retryAfter).toBe('900');
    expect(response.setCookie).toBeNull();
  });

  it('records an attempt before parsing submitted form data', async () => {
    await expect(loginRoutePOST(makeThrowingFormRequest() as never)).rejects.toThrow(
      'form parse failed',
    );

    for (let index = 0; index < 4; index += 1) {
      recordAdminIntakeLoginFailure(testHeaders({ realIp: '203.0.113.55' }));
    }
    expect(checkAdminIntakeLoginRateLimit(testHeaders({ realIp: '203.0.113.55' }))).toEqual({
      ok: false,
      retryAfterSeconds: 900,
    });
  });

  it('records invalid credentials without setting a cookie', async () => {
    const response = readRedirect(await loginRoutePOST(makeLoginRequest('bad-token') as never));

    expect(response.status).toBe(303);
    expect(response.pathname).toBe('/admin/intake');
    expect(response.error).toBe('invalid');
    expect(response.retryAfter).toBeNull();
    expect(response.setCookie).toBeNull();

    for (let index = 0; index < 4; index += 1) {
      recordAdminIntakeLoginFailure(testHeaders({ realIp: '203.0.113.44' }));
    }
    expect(checkAdminIntakeLoginRateLimit(testHeaders({ realIp: '203.0.113.44' })).ok).toBe(
      false,
    );
  });

  it('clears failures and sets a signed named-admin cookie on successful login', async () => {
    recordAdminIntakeLoginFailure(testHeaders({ realIp: '203.0.113.44' }));
    const response = readRedirect(await loginRoutePOST(makeLoginRequest('valid-token') as never));

    expect(response.status).toBe(303);
    expect(response.pathname).toBe('/admin/intake');
    expect(response.error).toBeNull();
    expect(response.setCookie).toContain(`${ADMIN_INTAKE_COOKIE}=`);
    expect(response.setCookie).toContain('HttpOnly');
    expect(response.setCookie).toContain('Path=/admin');
    expect(checkAdminIntakeLoginRateLimit(testHeaders({ realIp: '203.0.113.44' }))).toEqual({
      ok: true,
    });
  });
});
