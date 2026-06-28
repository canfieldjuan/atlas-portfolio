import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST as auditRoutePOST } from '@/app/api/audit/route';
import {
  consumeDeflectionIdentifierRateLimit,
  consumeDeflectionRateLimit,
} from '@/lib/deflection-rate-limit';

const auditIntakeState = vi.hoisted(() => ({
  recordAuditIntake: vi.fn(async () => ({
    requestId: 'audit-unit',
    deliveries: ['database'],
    warnings: [],
  })),
}));

vi.mock('@/lib/audit-intake', () => ({
  AuditIntakePayload: undefined,
  recordAuditIntake: auditIntakeState.recordAuditIntake,
}));

let now = 1_700_000_000_000;

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

beforeEach(() => {
  resetStore();
  auditIntakeState.recordAuditIntake.mockClear();
  now = 1_700_000_000_000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
});

afterEach(() => {
  vi.restoreAllMocks();
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
        requestId: 'audit-unit',
        status: 'submitted',
        delivery: 'database',
        deliveries: ['database'],
        warnings: [],
        estimatedResponseHours: 48,
      },
    });
    expect(auditIntakeState.recordAuditIntake).toHaveBeenCalledTimes(1);
    expect(auditIntakeState.recordAuditIntake).toHaveBeenCalledWith(
      expect.objectContaining({ workEmail: 'buyer@example.com' }),
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
    expect(auditIntakeState.recordAuditIntake).not.toHaveBeenCalled();
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
    auditIntakeState.recordAuditIntake.mockClear();

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
    expect(auditIntakeState.recordAuditIntake).not.toHaveBeenCalled();
  });
});
