import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as auditRoutePOST } from '@/app/api/audit/route';
import {
  consumeDeflectionIdentifierRateLimit,
  consumeDeflectionRateLimit,
} from '@/lib/deflection-rate-limit';

let now = 1_700_000_000_000;
let tempDir = '';
let auditFallbackPath = '';

const INTAKE_DELIVERY_ENV_KEYS = [
  'AUDIT_INTAKE_DATABASE_URL',
  'DATABASE_URL',
  'POSTGRES_URL',
  'AUDIT_INTAKE_WEBHOOK_URL',
  'AUDIT_INTAKE_ATLAS_BASE_URL',
  'AUDIT_INTAKE_ATLAS_AUTH_TOKEN',
  'AUDIT_NOTIFICATION_TO_EMAIL',
  'AUDIT_NOTIFICATION_RESEND_API_KEY',
  'ATLAS_CAMPAIGN_SEQ_RESEND_API_KEY',
  'AUDIT_NOTIFICATION_FROM_EMAIL',
  'ATLAS_CAMPAIGN_SEQ_RESEND_FROM_EMAIL',
  'ATLAS_EMAIL_DEFAULT_FROM',
];

function testHeaders(value?: string) {
  return new Headers(value ? { 'x-forwarded-for': value } : {});
}

function resetStore() {
  delete globalThis.__atlasDeflectionRateLimitStore;
}

function validAuditBody(overrides: Record<string, unknown> = {}) {
  return {
    fullName: 'Ada Buyer',
    workEmail: ' buyer@example.com ',
    companyOrProjectUrl: 'https://example.com',
    roleAndDecisionScope: 'Owner',
    projectInterest: 'content-generation',
    biggestBottleneck: 'Manual intake triage',
    automationDataSources: 'Tickets and CRM',
    desiredTimeline: 'quarter',
    securityRequirement: 'unsure',
    anticipatedInvestmentRange: 'phase1',
    ...overrides,
  };
}

function makeAuditRequest({
  body = validAuditBody(),
  ip = '203.0.113.44',
  onJson,
}: {
  body?: Record<string, unknown>;
  ip?: string;
  onJson?: () => void;
} = {}) {
  return {
    headers: testHeaders(ip),
    async json() {
      onJson?.();
      return body;
    },
  };
}

async function readRouteResponse(response: Response) {
  return {
    status: response.status,
    body: await response.json(),
    retryAfter: response.headers.get('Retry-After'),
  };
}

async function readFallbackRecords() {
  try {
    const content = await readFile(auditFallbackPath, 'utf8');
    return content
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    ) {
      return [];
    }
    throw error;
  }
}

beforeEach(async () => {
  resetStore();
  tempDir = await mkdtemp(path.join(tmpdir(), 'atlas-audit-rate-limit-'));
  auditFallbackPath = path.join(tempDir, 'audit-intake.ndjson');
  for (const key of INTAKE_DELIVERY_ENV_KEYS) {
    vi.stubEnv(key, '');
  }
  vi.stubEnv('AUDIT_INTAKE_ALLOW_FILE_FALLBACK', 'true');
  vi.stubEnv('AUDIT_INTAKE_FILE_PATH', auditFallbackPath);
  now = 1_700_000_000_000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await rm(tempDir, { recursive: true, force: true });
  resetStore();
});

describe('deflection rate-limit helper', () => {
  it('limits repeated requests by first forwarded IP and request id until the window resets', () => {
    const tightConfig = { scope: 'unit', limit: 2, windowMs: 1_000 };

    expect(consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', tightConfig))
      .toEqual({ ok: true });
    expect(consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', tightConfig))
      .toEqual({ ok: true });
    expect(consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', tightConfig))
      .toEqual({ ok: false, retryAfterSeconds: 1 });

    now += 1_000;
    expect(consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', tightConfig))
      .toEqual({ ok: true });
  });

  it('isolates buckets by request id and client IP', () => {
    const singleUseConfig = { scope: 'unit', limit: 1, windowMs: 60_000 };

    expect(
      consumeDeflectionRateLimit(
        testHeaders('203.0.113.10, 198.51.100.4'),
        'report-a',
        singleUseConfig,
      ),
    ).toEqual({ ok: true });
    expect(consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-a', singleUseConfig))
      .toEqual({ ok: false, retryAfterSeconds: 60 });
    expect(consumeDeflectionRateLimit(testHeaders('203.0.113.10'), 'report-b', singleUseConfig))
      .toEqual({ ok: true });
    expect(consumeDeflectionRateLimit(testHeaders('198.51.100.4'), 'report-a', singleUseConfig))
      .toEqual({ ok: true });
  });

  it('normalizes identifier buckets before enforcing the limit', () => {
    const singleUseConfig = { scope: 'unit', limit: 1, windowMs: 60_000 };

    expect(consumeDeflectionIdentifierRateLimit(' buyer@example.com ', singleUseConfig))
      .toEqual({ ok: true });
    expect(consumeDeflectionIdentifierRateLimit('BUYER@example.com', singleUseConfig))
      .toEqual({ ok: false, retryAfterSeconds: 60 });
    expect(consumeDeflectionIdentifierRateLimit('other@example.com', singleUseConfig))
      .toEqual({ ok: true });
  });

  it('fails closed when the active bucket store is full and reopens after expiry', () => {
    const cappedStoreConfig = { scope: 'unit', limit: 2, windowMs: 60_000 };

    for (let index = 0; index < 1_000; index += 1) {
      expect(
        consumeDeflectionRateLimit(
          testHeaders('203.0.113.20'),
          `random-report-${index}`,
          cappedStoreConfig,
        ),
      ).toEqual({ ok: true });
    }
    expect(
      consumeDeflectionRateLimit(
        testHeaders('203.0.113.20'),
        'random-report-over-cap',
        cappedStoreConfig,
      ),
    ).toEqual({ ok: false, retryAfterSeconds: 60 });

    now += 60_000;
    expect(
      consumeDeflectionRateLimit(
        testHeaders('203.0.113.20'),
        'random-report-after-expiry',
        cappedStoreConfig,
      ),
    ).toEqual({ ok: true });
  });
});

describe('audit route deflection rate limiting', () => {
  it('records valid audit intake after the real IP and email limiters allow it', async () => {
    const auditResponse = await readRouteResponse(
      await auditRoutePOST(makeAuditRequest() as never),
    );

    expect(auditResponse).toEqual({
      status: 200,
      retryAfter: null,
      body: {
        ok: true,
        requestId: expect.any(String),
        status: 'submitted_with_warnings',
        delivery: 'file',
        deliveries: ['file'],
        warnings: [expect.stringContaining('no persistent intake sink')],
        estimatedResponseHours: 48,
      },
    });
    const records = await readFallbackRecords();
    expect(records).toHaveLength(1);
    expect(records[0]).toEqual(
      expect.objectContaining({
        requestId: auditResponse.body.requestId,
        fullName: 'Ada Buyer',
        workEmail: 'buyer@example.com',
      }),
    );
  });

  it('returns a generic 429 before parsing the body when the audit IP bucket is exhausted', async () => {
    for (let index = 0; index < 3; index += 1) {
      expect(
        consumeDeflectionRateLimit(testHeaders('203.0.113.44'), 'audit', {
          scope: 'audit-intake-ip',
          limit: 3,
          windowMs: 600_000,
        }),
      ).toEqual({ ok: true });
    }

    let jsonCalls = 0;
    const auditResponse = await readRouteResponse(
      await auditRoutePOST(makeAuditRequest({ onJson: () => { jsonCalls += 1; } }) as never),
    );

    expect(auditResponse).toEqual({
      status: 429,
      retryAfter: '600',
      body: {
        ok: false,
        error: 'Too many audit requests. Please try again later.',
      },
    });
    expect(jsonCalls).toBe(0);
    expect(await readFallbackRecords()).toEqual([]);
  });

  it('returns a generic 429 after parsing the body when the normalized email bucket is exhausted', async () => {
    for (let index = 0; index < 3; index += 1) {
      const auditResponse = await readRouteResponse(
        await auditRoutePOST(
          makeAuditRequest({
            body: validAuditBody({ workEmail: ' buyer@example.com ' }),
            ip: `203.0.113.${index + 10}`,
          }) as never,
        ),
      );
      expect(auditResponse.status).toBe(200);
    }
    await rm(auditFallbackPath, { force: true });

    let jsonCalls = 0;
    const auditResponse = await readRouteResponse(
      await auditRoutePOST(
        makeAuditRequest({
          body: validAuditBody({ workEmail: 'BUYER@example.com' }),
          ip: '203.0.113.99',
          onJson: () => { jsonCalls += 1; },
        }) as never,
      ),
    );

    expect(auditResponse).toEqual({
      status: 429,
      retryAfter: '600',
      body: {
        ok: false,
        error: 'Too many audit requests. Please try again later.',
      },
    });
    expect(jsonCalls).toBe(1);
    expect(await readFallbackRecords()).toEqual([]);
  });
});
