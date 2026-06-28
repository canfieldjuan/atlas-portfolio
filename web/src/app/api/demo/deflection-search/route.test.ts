import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/app/api/demo/deflection-search/route';
import { runDeflectionUploadedSearchSmoke } from '../../../../../scripts/smoke-deflection-uploaded-search.mjs';

type FetchResponse =
  | { status: number; body: unknown }
  | { reject: string };

type FetchCall = {
  url: string;
  init: RequestInit;
};

const ENV_KEYS = [
  'DEFLECTION_UPLOADED_SEARCH_ENABLED',
  'ATLAS_API_BASE_URL',
  'ATLAS_B2B_SERVICE_TOKEN',
  'VERCEL_ENV',
] as const;

const originalEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;

const atlasBaseUrl = 'https://atlas.example.test';
const atlasToken = 'service-token';
const requestId = 'content-ops-unit';

const atlasMatch = {
  topic: 'Reporting friction',
  question: 'How do I export attribution reports?',
  ticket_count: 4,
  opportunity_score: 12,
  answer: 'Open Analytics, choose the report, then export it.',
  steps: ['Open Analytics.', 'Choose Export.'],
  action_items: ['Document export path'],
  answer_evidence_status: 'resolution_evidence',
  when_to_contact_support: 'Contact support if export is missing.',
  source_ids: ['ticket-1', 'ticket-2'],
  source_labels: ['ticket-1 - How do I export?'],
  term_mappings: [
    {
      customer_term: 'export',
      documentation_term: 'Download report',
      suggestion: 'Add export phrasing.',
    },
  ],
};

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

function enableUploadedSearch() {
  process.env.DEFLECTION_UPLOADED_SEARCH_ENABLED = 'true';
  process.env.ATLAS_API_BASE_URL = atlasBaseUrl;
  process.env.ATLAS_B2B_SERVICE_TOKEN = atlasToken;
  delete process.env.VERCEL_ENV;
}

function resetRateLimitStore() {
  globalThis.__atlasDeflectionRateLimitStore = undefined;
}

function makeGetRequest(url: string) {
  return { nextUrl: new URL(url) };
}

function makePostRequest(body: unknown, headers: HeadersInit = {}) {
  return {
    headers: new Headers({ 'x-forwarded-for': '203.0.113.10', ...headers }),
    async json() {
      return body;
    },
  };
}

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function queueFetch(responses: FetchResponse[]) {
  const calls: FetchCall[] = [];
  const queue = [...responses];
  const fetchImpl = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = input instanceof Request ? input.url : String(input);
    calls.push({ url, init });
    const response = queue.shift();
    if (!response) throw new Error(`Unexpected fetch: ${url}`);
    if ('reject' in response) throw new Error(response.reject);
    return Response.json(response.body, { status: response.status });
  });

  vi.stubGlobal('fetch', fetchImpl);
  return { fetchImpl, calls };
}

function modelOkResponse() {
  return {
    schema_version: 'deflection.v1',
    title: 'Resolution Snapshot',
    summary: {},
    sections: [
      {
        id: 'support_tax',
        title: 'Support tax',
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
    ],
  };
}

function searchResponse(match: unknown = atlasMatch) {
  return {
    results: match === null ? [] : [match],
  };
}

function expectAtlasHeaders(init: RequestInit) {
  const headers = new Headers(init.headers);
  expect(headers.get('authorization')).toBe(`Bearer ${atlasToken}`);
  expect(headers.get('accept')).toBe('application/json');
}

describe('deflection uploaded search route', () => {
  beforeEach(() => {
    restoreEnv();
    resetRateLimitStore();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restoreEnv();
    resetRateLimitStore();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if (originalFetch) {
      globalThis.fetch = originalFetch;
    } else {
      Reflect.deleteProperty(globalThis, 'fetch');
    }
  });

  it('uses the real local matcher for GET searches', async () => {
    const response = await GET(makeGetRequest('https://portfolio.test/api/demo/deflection-search?q=export reports') as never);
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.source).toBe('local');
    expect(body.match).toMatchObject({
      topic: 'Reporting friction',
      question: 'How do I export attribution reports?',
    });
  });

  it('keeps POST disabled when uploaded search is not configured', async () => {
    delete process.env.DEFLECTION_UPLOADED_SEARCH_ENABLED;
    delete process.env.ATLAS_API_BASE_URL;
    delete process.env.ATLAS_B2B_SERVICE_TOKEN;
    const { fetchImpl } = queueFetch([]);

    const response = await POST(makePostRequest({ requestId, q: 'export' }) as never);
    const body = await readJson(response);

    expect(response.status).toBe(404);
    expect(body).toMatchObject({
      match: null,
      source: 'atlas',
      error: 'Uploaded report search is not enabled.',
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('checks access through the real ATLAS client before searching the uploaded report', async () => {
    enableUploadedSearch();
    const longQuery = `${'x'.repeat(300)}   `;
    const { calls } = queueFetch([
      { status: 200, body: modelOkResponse() },
      { status: 200, body: searchResponse() },
    ]);

    const response = await POST(makePostRequest({ requestId, q: longQuery }) as never);
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({ match: atlasMatch, source: 'atlas' });
    expect(calls).toHaveLength(2);
    expect(calls[0].url).toBe(`${atlasBaseUrl}/api/v1/content-ops/deflection-reports/${requestId}/report-model`);
    expect(calls[0].init.cache).toBe('no-store');
    expectAtlasHeaders(calls[0].init);
    expect(calls[1].url).toBe(`${atlasBaseUrl}/api/v1/content-ops/deflection-reports/${requestId}/search`);
    expect(calls[1].init.method).toBe('POST');
    expect(calls[1].init.cache).toBe('no-store');
    expectAtlasHeaders(calls[1].init);
    expect(new Headers(calls[1].init.headers).get('content-type')).toBe('application/json');
    expect(JSON.parse(String(calls[1].init.body))).toEqual({
      q: 'x'.repeat(256),
      limit: 5,
    });
  });

  it('allows explicit enablement even when service env is incomplete', async () => {
    process.env.DEFLECTION_UPLOADED_SEARCH_ENABLED = 'true';
    delete process.env.ATLAS_API_BASE_URL;
    delete process.env.ATLAS_B2B_SERVICE_TOKEN;
    const { fetchImpl } = queueFetch([]);

    const response = await POST(makePostRequest({ requestId, q: 'export' }) as never);
    const body = await readJson(response);

    expect(response.status).toBe(503);
    expect(body.error).toBe('Uploaded report search is temporarily unavailable. Please try again.');
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns a successful Atlas envelope when the uploaded search has no match', async () => {
    enableUploadedSearch();
    queueFetch([
      { status: 200, body: modelOkResponse() },
      { status: 200, body: searchResponse(null) },
    ]);

    const response = await POST(makePostRequest({ requestId, q: 'missing' }) as never);
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body).toEqual({ match: null, source: 'atlas' });
  });

  it('does not search when the uploaded report is locked', async () => {
    enableUploadedSearch();
    const { calls } = queueFetch([{ status: 403, body: { error: 'locked' } }]);

    const response = await POST(makePostRequest({ requestId, q: 'export' }) as never);
    const body = await readJson(response);

    expect(response.status).toBe(403);
    expect(body.error).toBe('Uploaded report search is temporarily unavailable. Please try again.');
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${atlasBaseUrl}/api/v1/content-ops/deflection-reports/${requestId}/report-model`);
  });

  it('rate limits before ATLAS access checks', async () => {
    enableUploadedSearch();
    const { fetchImpl } = queueFetch([]);

    let response: Response | null = null;
    for (let index = 0; index < 21; index += 1) {
      response = await POST(makePostRequest({ requestId, q: 'export' }) as never);
    }
    expect(response).not.toBeNull();
    const body = await readJson(response as Response);

    expect(response?.status).toBe(429);
    expect(body.error).toBe('Too many searches. Please try again later.');
    expect(fetchImpl).toHaveBeenCalledTimes(20);
  });

  it('keeps the uploaded-search smoke helper behavior intact', async () => {
    const fetchImpl = vi.fn(async () => {
      return Response.json({ match: atlasMatch, source: 'atlas' }, { status: 200 });
    });

    const result = await runDeflectionUploadedSearchSmoke(
      {
        requestId,
        query: 'export reports',
        baseUrl: 'https://portfolio.example.com/',
      },
      {
        fetchImpl,
        now: () => '2026-06-20T18:30:00.000Z',
      },
    );

    expect(result).toMatchObject({
      ok: true,
      status: 'atlas_match_renderable',
      requestId,
      queryLength: 'export reports'.length,
    });
    expect(result.match).toMatchObject({
      topicLength: atlasMatch.topic.length,
      stepsCount: 2,
      sourceIdsCount: 2,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://portfolio.example.com/api/demo/deflection-search',
      expect.objectContaining({
        method: 'POST',
        cache: 'no-store',
        body: JSON.stringify({ requestId, q: 'export reports' }),
      }),
    );
  });

  it('keeps the uploaded-search smoke helper validation failures intact', async () => {
    const fetchImpl = vi.fn();

    await expect(
      runDeflectionUploadedSearchSmoke(
        { requestId: '../bad', query: 'export reports', baseUrl: 'https://portfolio.example.com/' },
        { fetchImpl },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: 'Uploaded search smoke request id is invalid.',
      apiCalls: false,
    });
    await expect(
      runDeflectionUploadedSearchSmoke(
        { requestId, query: 'export reports', baseUrl: 'http://evil.example.com' },
        { fetchImpl },
      ),
    ).resolves.toMatchObject({
      ok: false,
      error: 'Uploaded search smoke base URL is invalid.',
      apiCalls: false,
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
