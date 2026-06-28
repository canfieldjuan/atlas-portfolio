import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/deflection-review-decisions/route';

type FetchResponse = { status: number; body: unknown };
type FetchCall = { url: string; init: RequestInit };
type Decision = 'keep_suppressed' | 'promote_to_review';
type DecisionRecord = {
  requestId: string;
  reviewKey: string;
  decision: Decision;
  updatedAt: string;
};

const dbState = vi.hoisted(() => ({
  records: [] as DecisionRecord[],
  listError: null as Error | null,
  upsertError: null as Error | null,
  queries: [] as Array<{ sql: string; params: unknown[] }>,
  neon: vi.fn(),
}));

vi.mock('@neondatabase/serverless', () => ({
  neon: dbState.neon,
}));

const ENV_KEYS = [
  'ATLAS_API_BASE_URL',
  'ATLAS_B2B_SERVICE_TOKEN',
  'DEFLECTION_REVIEW_DECISIONS_DATABASE_URL',
  'GAP_REPORT_DATABASE_URL',
  'AUDIT_INTAKE_DATABASE_URL',
  'DATABASE_URL',
  'POSTGRES_URL',
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
const atlasBaseUrl = 'https://atlas.example.test';
const atlasToken = 'service-token';
const databaseUrl = 'postgres://review-decisions-unit';
const requestId = 'content-ops-unit-123';
const reviewKey = 'review_0123456789abcdef01234567';
const otherReviewKey = 'review_ffffffffffffffffffffffff';
const updatedAt = '2026-06-24T00:00:00.000Z';

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

function resetRateLimitStore() {
  globalThis.__atlasDeflectionRateLimitStore = undefined;
}

function resetDatabaseState() {
  dbState.records = [];
  dbState.listError = null;
  dbState.upsertError = null;
  dbState.queries = [];
  dbState.neon.mockClear();
}

function enableAtlas() {
  process.env.ATLAS_API_BASE_URL = atlasBaseUrl;
  process.env.ATLAS_B2B_SERVICE_TOKEN = atlasToken;
}

function enableDatabase() {
  process.env.DEFLECTION_REVIEW_DECISIONS_DATABASE_URL = databaseUrl;
}

function disableDatabase() {
  delete process.env.DEFLECTION_REVIEW_DECISIONS_DATABASE_URL;
  delete process.env.GAP_REPORT_DATABASE_URL;
  delete process.env.AUDIT_INTAKE_DATABASE_URL;
  delete process.env.DATABASE_URL;
  delete process.env.POSTGRES_URL;
}

function rowFromRecord(record: DecisionRecord) {
  return {
    request_id: record.requestId,
    review_key: record.reviewKey,
    decision: record.decision,
    updated_at: record.updatedAt,
  };
}

async function query(sql: string, params: unknown[]) {
  dbState.queries.push({ sql, params });
  if (/^\s*SELECT/i.test(sql)) {
    if (dbState.listError) throw dbState.listError;
    return dbState.records
      .filter((record) => record.requestId === params[0])
      .map(rowFromRecord);
  }
  if (/^\s*INSERT/i.test(sql)) {
    if (dbState.upsertError) throw dbState.upsertError;
    const [recordRequestId, recordReviewKey, decision] = params as [string, string, Decision];
    const record = {
      requestId: recordRequestId,
      reviewKey: recordReviewKey,
      decision,
      updatedAt,
    };
    dbState.records = dbState.records.filter(
      (candidate) =>
        candidate.requestId !== record.requestId || candidate.reviewKey !== record.reviewKey,
    );
    dbState.records.unshift(record);
    return [rowFromRecord(record)];
  }
  throw new Error(`Unexpected SQL: ${sql}`);
}

dbState.neon.mockImplementation(() => ({ query }));

function queueFetch(responses: FetchResponse[]) {
  const calls: FetchCall[] = [];
  const queue = [...responses];
  const fetchImpl = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = input instanceof Request ? input.url : String(input);
    calls.push({ url, init });
    const response = queue.shift();
    if (!response) throw new Error(`Unexpected fetch: ${url}`);
    return Response.json(response.body, { status: response.status });
  });
  vi.stubGlobal('fetch', fetchImpl);
  return { fetchImpl, calls };
}

function model(reviewKeys = [reviewKey]) {
  return {
    schema_version: 'deflection.v1',
    title: 'Report',
    summary: {},
    sections: [
      {
        id: 'support_tax',
        title: 'Support Tax',
        priority: 10,
        surfaces: ['web'],
        default_limit: null,
        required_data: [
          'repeat_ticket_count',
          'non_repeat_ticket_count',
          'generated_question_count',
          'assisted_contact_cost',
          'estimated_support_cost',
          'source_date_window',
          'drafted_answer_count',
          'no_proven_answer_count',
          'ticket_source_count',
        ],
        snapshot_safe_fields: [],
        data: {
          repeat_ticket_count: 4,
          non_repeat_ticket_count: 1,
          generated_question_count: 2,
          assisted_contact_cost: 13.5,
          estimated_support_cost: 54,
          source_date_window: {
            source_date_start: '2026-06-01',
            source_date_end: '2026-06-30',
            source_window_days: 30,
          },
          drafted_answer_count: 1,
          no_proven_answer_count: 0,
          ticket_source_count: 5,
        },
      },
      {
        id: 'priority_fix_queue',
        title: 'Priority fix queue',
        priority: 20,
        surfaces: ['web'],
        default_limit: null,
        required_data: [
          'items',
          'status_counts',
          'result_page_limit',
          'pdf_limit',
          'backlog_limit',
          'support_cost_basis',
        ],
        snapshot_safe_fields: [],
        data: {
          items: [],
          status_counts: {},
          result_page_limit: 10,
          pdf_limit: 25,
          backlog_limit: 50,
          support_cost_basis: { status: 'configured' },
        },
      },
      {
        id: 'suppressed_repeat_review_queue',
        title: 'Suppressed Review Queue',
        priority: 41,
        surfaces: ['web'],
        default_limit: 25,
        required_data: ['items'],
        snapshot_safe_fields: [],
        data: {
          items: reviewKeys.map((key, index) => ({
            rank: index + 1,
            review_key: key,
            question: 'Customer wording must not be persisted.',
            status: 'suppressed',
            owner_lane: 'Docs',
            confidence: 'medium',
            recommended_action: 'Review suppression decision.',
            ticket_count: 3,
            estimated_support_cost: 40.5,
            priority_score: 7,
            priority_drivers: ['suppressed_repeat'],
            csat_signal: {
              status: 'not_available',
              csat_present_count: 0,
              negative_csat_ticket_count: 0,
              numeric_average: null,
            },
            suppression_reason: 'below_threshold',
            suppression_reason_label: 'Below threshold',
          })),
          total_item_count: reviewKeys.length,
          default_limit: 25,
          reason_counts: { below_threshold: reviewKeys.length },
        },
      },
    ],
  };
}

function modelResponse(reviewKeys = [reviewKey]) {
  return { status: 200, body: model(reviewKeys) };
}

function postRequest(body: unknown) {
  return new Request('https://unit.test/api/deflection-review-decisions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.44',
    },
    body: JSON.stringify(body),
  });
}

function getRequest(id = requestId) {
  return new Request(
    `https://unit.test/api/deflection-review-decisions?requestId=${encodeURIComponent(id)}`,
    { headers: { 'x-forwarded-for': '203.0.113.44' } },
  );
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe('deflection review decisions route', () => {
  beforeEach(() => {
    restoreEnv();
    enableAtlas();
    enableDatabase();
    resetDatabaseState();
    resetRateLimitStore();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreEnv();
    resetDatabaseState();
    resetRateLimitStore();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      Reflect.deleteProperty(globalThis, 'fetch');
    }
  });

  it('rejects invalid POST payloads before ATLAS, rate-limit, or database work', async () => {
    const { fetchImpl } = queueFetch([]);

    const response = await POST(
      postRequest({ requestId: '../bad', reviewKey, decision: 'promote_to_review' }),
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toEqual({ error: 'Invalid request.' });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(dbState.neon).not.toHaveBeenCalled();
    expect(dbState.queries).toEqual([]);
  });

  it('rejects writes when the report is locked', async () => {
    const { calls } = queueFetch([{ status: 403, body: { error: 'locked' } }]);

    const response = await POST(
      postRequest({ requestId, reviewKey, decision: 'promote_to_review' }),
    );

    expect(response.status).toBe(403);
    expect(await readJson(response)).toEqual({ error: 'Report is locked.' });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${atlasBaseUrl}/api/v1/content-ops/deflection-reports/${requestId}/report-model`);
    expect(dbState.queries).toEqual([]);
  });

  it('rejects unknown review keys from the real parsed report model', async () => {
    queueFetch([modelResponse([reviewKey])]);

    const response = await POST(
      postRequest({ requestId, reviewKey: otherReviewKey, decision: 'promote_to_review' }),
    );

    expect(response.status).toBe(404);
    expect(await readJson(response)).toEqual({ error: 'Review key not found.' });
    expect(dbState.queries).toEqual([]);
  });

  it('persists only the review decision tuple for valid writes', async () => {
    queueFetch([modelResponse()]);

    const response = await POST(
      postRequest({ requestId, reviewKey, decision: 'promote_to_review' }),
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({
      decision: {
        requestId,
        reviewKey,
        decision: 'promote_to_review',
        updatedAt,
      },
    });
    expect(dbState.records).toEqual([
      { requestId, reviewKey, decision: 'promote_to_review', updatedAt },
    ]);
    expect(JSON.stringify(dbState.queries[0].params)).not.toContain('Customer wording');
  });

  it('lists only persisted decisions whose review key remains present in the report model', async () => {
    dbState.records = [
      { requestId, reviewKey, decision: 'keep_suppressed', updatedAt },
      { requestId, reviewKey: otherReviewKey, decision: 'promote_to_review', updatedAt },
    ];
    queueFetch([modelResponse([reviewKey])]);

    const response = await GET(getRequest());

    expect(response.status).toBe(200);
    expect(await readJson(response)).toEqual({
      decisions: [{ requestId, reviewKey, decision: 'keep_suppressed', updatedAt }],
      persistence: 'configured',
    });
  });

  it('reports unconfigured storage after validating report access', async () => {
    disableDatabase();
    const { calls } = queueFetch([modelResponse()]);

    const response = await POST(
      postRequest({ requestId, reviewKey, decision: 'keep_suppressed' }),
    );

    expect(response.status).toBe(503);
    expect(await readJson(response)).toEqual({
      error: 'Review decision storage is not configured.',
    });
    expect(calls).toHaveLength(1);
    expect(dbState.neon).not.toHaveBeenCalled();
  });

  it('maps list storage failures to the storage unavailable response', async () => {
    dbState.listError = new Error('relation does not exist');
    queueFetch([modelResponse()]);

    const response = await GET(getRequest());

    expect(response.status).toBe(503);
    expect(await readJson(response)).toEqual({
      error: 'Review decision storage is unavailable.',
    });
  });

  it('maps write storage failures to the storage unavailable response', async () => {
    dbState.upsertError = new Error('connection reset');
    queueFetch([modelResponse()]);

    const response = await POST(
      postRequest({ requestId, reviewKey, decision: 'keep_suppressed' }),
    );

    expect(response.status).toBe(503);
    expect(await readJson(response)).toEqual({
      error: 'Review decision storage is unavailable.',
    });
  });

  it('rate limits before ATLAS access checks', async () => {
    queueFetch(Array.from({ length: 40 }, () => modelResponse()));

    let response: Response | null = null;
    for (let index = 0; index < 41; index += 1) {
      response = await GET(getRequest());
    }

    expect(response).not.toBeNull();
    expect(response?.status).toBe(429);
    expect(response?.headers.get('retry-after')).toBe('60');
    expect(await readJson(response as Response)).toEqual({
      error: 'Too many review decision requests. Please try again later.',
    });
    expect(globalThis.fetch).toHaveBeenCalledTimes(40);
  });
});
