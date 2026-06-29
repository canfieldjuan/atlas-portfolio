import { describe, expect, it } from 'vitest';
import { runDeflectionLiveSubmitSmoke } from '../../scripts/smoke-deflection-live-submit.mjs';

const baseOptions = {
  csvPath: '/tmp/support-export.csv',
  companyName: 'Effingham Office Maids',
  contactEmail: 'ops@example.com',
  platform: 'helpscout',
};

const baseEnv = {
  ATLAS_API_BASE_URL: 'https://atlas.example.com/',
  ATLAS_B2B_SERVICE_TOKEN: 'service_token_unit',
};

function csvReader() {
  return Buffer.from('ticket_id,message\n1,How do I export reports?\n');
}

function snapshotPayload() {
  return {
    summary: {
      generated: 3,
      drafted_answer_count: 2,
      no_proven_answer_count: 1,
      repeat_ticket_count: 9,
      source_date_start: '2026-05-01',
      source_date_end: '2026-05-09',
      source_window_days: 9,
    },
    top_questions: [
      {
        rank: 1,
        question: 'How do I export reports?',
        customer_wording: 'export reports',
        ticket_count: 5,
        weighted_frequency: 4,
      },
    ],
    locked_questions: [
      {
        rank: 2,
        ticket_count: 4,
      },
    ],
    teaser: {
      full_answer: {
        rank: 1,
        question: 'How do I export reports?',
        answer: 'Open Analytics and select Export.',
        steps: ['Open Analytics.', 'Select Export.'],
        answer_evidence_status: 'resolution_evidence',
        resolution_evidence_scope: 'scoped',
        weighted_frequency: 4,
        source_count: 2,
      },
      previews: [
        {
          rank: 2,
          question: 'Can I schedule the export?',
          answer_evidence_status: 'resolution_evidence',
          resolution_evidence_scope: 'scoped',
          weighted_frequency: 3,
          step_count: 2,
          source_count: 1,
          body_withheld: true,
        },
      ],
    },
  };
}

function makeFetchMock(responses) {
  const calls = [];
  const queue = [...responses];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const next = queue.shift();
    if (!next) {
      throw new Error(`unexpected fetch: ${url}`);
    }
    if (next.reject) {
      throw new Error(next.reject);
    }
    if (next.body === undefined) {
      return new Response(null, { status: next.status });
    }
    return Response.json(next.body, { status: next.status });
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

async function run(options, responses, extra = {}) {
  const fetchImpl = makeFetchMock(responses);
  const result = await runDeflectionLiveSubmitSmoke(options, {
    env: extra.env || baseEnv,
    fetchImpl,
    readFileImpl: extra.readFileImpl || csvReader,
    now: () => '2026-05-31T15:30:00.000Z',
    siteUrl: 'https://juancanfield.com',
  });
  return { fetchImpl, result };
}

describe('deflection live submit smoke guard', () => {
  it('submits the CSV to ATLAS, validates the snapshot, and confirms the artifact is locked', async () => {
    const { fetchImpl, result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: snapshotPayload() },
      { status: 403 },
    ]);

    expect(result).toMatchObject({
      ok: true,
      requestId: 'content-ops-unit-123',
      resultsUrl: 'https://juancanfield.com/systems/support-ticket-deflection/results/content-ops-unit-123',
      artifactStatus: 'locked',
    });
    expect(result.snapshot).toEqual({
      generated: 3,
      draftedAnswerCount: 2,
      noProvenAnswerCount: 1,
      repeatTicketCount: 9,
      sourceWindow: {
        startDate: '2026-05-01',
        endDate: '2026-05-09',
        days: 9,
      },
      topQuestionCount: 1,
      lockedQuestionCount: 1,
      hasFullTeaser: true,
      teaserPreviewCount: 1,
    });
    expect(fetchImpl.calls).toHaveLength(3);
    expect(fetchImpl.calls[0].url).toBe(
      'https://atlas.example.com/api/v1/content-ops/deflection-reports/submit',
    );
    expect(fetchImpl.calls[0].init.headers.Authorization).toBe('Bearer service_token_unit');
    expect(fetchImpl.calls[0].init.headers['Content-Type']).toBeUndefined();
    expect(fetchImpl.calls[0].init.body.get('support_platform')).toBe('help_scout');
    expect(fetchImpl.calls[0].init.body.get('company_name')).toBe('Effingham Office Maids');
    expect(fetchImpl.calls[0].init.body.get('contact_email')).toBe('ops@example.com');
    expect(fetchImpl.calls[0].init.body.get('csv_file').name).toBe('support-export.csv');
    expect(fetchImpl.calls[1].url).toBe(
      'https://atlas.example.com/api/v1/content-ops/deflection-reports/content-ops-unit-123/snapshot',
    );
    expect(fetchImpl.calls[2].url).toBe(
      'https://atlas.example.com/api/v1/content-ops/deflection-reports/content-ops-unit-123/artifact',
    );
  });

  it('omits the source window when ATLAS omits the window fields', async () => {
    const snapshotWithoutWindow = snapshotPayload();
    delete snapshotWithoutWindow.summary.source_date_start;
    delete snapshotWithoutWindow.summary.source_date_end;
    delete snapshotWithoutWindow.summary.source_window_days;
    const { result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: snapshotWithoutWindow },
      { status: 403 },
    ]);

    expect(result.ok).toBe(true);
    expect(result.snapshot.sourceWindow).toBeUndefined();
  });

  it('omits the source window when ATLAS sends only part of the window', async () => {
    const partialWindowSnapshot = snapshotPayload();
    delete partialWindowSnapshot.summary.source_date_end;
    const { result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: partialWindowSnapshot },
      { status: 403 },
    ]);

    expect(result.ok).toBe(true);
    expect(result.snapshot.sourceWindow).toBeUndefined();
  });

  it('omits the source window when ATLAS sends contradictory dates and day count', async () => {
    const contradictoryWindowSnapshot = snapshotPayload();
    contradictoryWindowSnapshot.summary.source_window_days = 30;
    const { result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: contradictoryWindowSnapshot },
      { status: 403 },
    ]);

    expect(result.ok).toBe(true);
    expect(result.snapshot.sourceWindow).toBeUndefined();
  });

  it('fails closed before network calls when required environment is missing', async () => {
    const { fetchImpl, result } = await run(baseOptions, [], { env: {} });

    expect(result).toEqual({
      ok: false,
      error: 'Deflection live submit smoke environment is incomplete.',
      missing: ['ATLAS_API_BASE_URL', 'ATLAS_B2B_SERVICE_TOKEN'],
      apiCalls: false,
      mutations: false,
    });
    expect(fetchImpl.calls).toHaveLength(0);
  });

  it('maps Freshdesk to other and rejects unsafe submit request IDs', async () => {
    const { fetchImpl, result } = await run(
      { ...baseOptions, platform: 'freshdesk' },
      [{ status: 200, body: { request_id: '../../bad' } }],
    );

    expect(fetchImpl.calls[0].init.body.get('support_platform')).toBe('other');
    expect(result).toMatchObject({
      ok: false,
      stage: 'submit',
      error: 'ATLAS submit response did not include a valid request_id.',
    });
  });

  it('reports submit network failures after the mutation boundary', async () => {
    const { fetchImpl, result } = await run(baseOptions, [{ reject: 'connection reset' }]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'submit',
      apiCalls: true,
      mutations: true,
      error: 'ATLAS submit failed before an HTTP response.',
    });
    expect(fetchImpl.calls).toHaveLength(1);
  });

  it('reports snapshot HTTP failures with the snapshot stage', async () => {
    const { fetchImpl, result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 500, body: { error: 'upstream failed' } },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'snapshot',
      error: 'ATLAS snapshot fetch failed with HTTP 500.',
    });
    expect(fetchImpl.calls).toHaveLength(2);
  });

  it('reports snapshot network failures with the request ID', async () => {
    const { fetchImpl, result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { reject: 'network reset' },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'snapshot',
      requestId: 'content-ops-unit-123',
      apiCalls: true,
      mutations: true,
      error: 'ATLAS snapshot fetch failed before an HTTP response.',
    });
    expect(fetchImpl.calls).toHaveLength(2);
  });

  it('rejects malformed snapshot summary types', async () => {
    const { result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: { summary: { generated: '3' }, top_questions: [] } },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'snapshot',
      error: 'ATLAS snapshot response shape was rejected.',
    });
  });

  it('rejects non-object top questions', async () => {
    const badSnapshot = snapshotPayload();
    badSnapshot.top_questions = [null];
    const { result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: badSnapshot },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'snapshot',
      error: 'ATLAS snapshot response shape was rejected.',
    });
  });

  it('rejects top questions missing required fields', async () => {
    const badSnapshot = snapshotPayload();
    badSnapshot.top_questions = [{ rank: 1, question: 'Missing fields' }];
    const { result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: badSnapshot },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'snapshot',
      error: 'ATLAS snapshot response shape was rejected.',
    });
  });

  it('accepts teaser payloads while dropping private teaser body fields', async () => {
    const snapshotWithExtraTeaserFields = snapshotPayload();
    snapshotWithExtraTeaserFields.teaser.full_answer.source_ids = ['ticket-1'];
    snapshotWithExtraTeaserFields.teaser.full_answer.evidence_quotes = ['private evidence'];
    snapshotWithExtraTeaserFields.teaser.previews[0].answer = 'Preview body must be dropped.';
    snapshotWithExtraTeaserFields.teaser.previews[0].source_ids = ['ticket-2'];
    const { result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: snapshotWithExtraTeaserFields },
      { status: 403 },
    ]);

    expect(result).toMatchObject({
      ok: true,
      snapshot: {
        hasFullTeaser: true,
        teaserPreviewCount: 1,
      },
    });
  });

  it('rejects snapshots missing repeat ticket count', async () => {
    const badSnapshot = snapshotPayload();
    delete badSnapshot.summary.repeat_ticket_count;
    const { result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: badSnapshot },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'snapshot',
      error: 'ATLAS snapshot response shape was rejected.',
    });
  });

  it('rejects locked questions missing ticket counts', async () => {
    const badSnapshot = snapshotPayload();
    badSnapshot.locked_questions = [{ rank: 2, question: 'Must not be enough' }];
    const { result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: badSnapshot },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'snapshot',
      error: 'ATLAS snapshot response shape was rejected.',
    });
  });

  it('rejects full teaser answers missing source counts', async () => {
    const badSnapshot = snapshotPayload();
    delete badSnapshot.teaser.full_answer.source_count;
    const { result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: badSnapshot },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'snapshot',
      error: 'ATLAS snapshot response shape was rejected.',
    });
  });

  it('fails when the artifact is already unlocked', async () => {
    const { result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: snapshotPayload() },
      { status: 200, body: { markdown: '# already paid' } },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'artifact',
      error: 'Expected locked artifact HTTP 403, got HTTP 200.',
    });
  });

  it('reports artifact network failures with the request ID', async () => {
    const { fetchImpl, result } = await run(baseOptions, [
      { status: 200, body: { request_id: 'content-ops-unit-123' } },
      { status: 200, body: snapshotPayload() },
      { reject: 'tls failure' },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'artifact',
      requestId: 'content-ops-unit-123',
      apiCalls: true,
      mutations: true,
      error: 'ATLAS artifact fetch failed before an HTTP response.',
    });
    expect(fetchImpl.calls).toHaveLength(3);
  });

  it('fails closed before network calls when the CSV path is invalid', async () => {
    const { fetchImpl, result } = await run(
      { ...baseOptions, csvPath: '/tmp/support-export.txt' },
      [],
    );

    expect(result).toEqual({
      ok: false,
      error: 'Deflection live submit smoke options are invalid.',
      errors: ['--csv must point to a .csv file'],
      apiCalls: false,
      mutations: false,
    });
    expect(fetchImpl.calls).toHaveLength(0);
  });

  it('fails closed before network calls when the CSV file cannot be read', async () => {
    const { fetchImpl, result } = await run(baseOptions, [], {
      readFileImpl: async () => {
        throw new Error('missing file');
      },
    });

    expect(result).toEqual({
      ok: false,
      error: 'CSV file could not be read.',
      apiCalls: false,
      mutations: false,
    });
    expect(fetchImpl.calls).toHaveLength(0);
  });

  it('reports submit HTTP failures after the mutation boundary', async () => {
    const { fetchImpl, result } = await run(baseOptions, [
      { status: 503, body: { error: 'unavailable' } },
    ]);

    expect(result).toMatchObject({
      ok: false,
      stage: 'submit',
      error: 'ATLAS submit failed with HTTP 503.',
    });
    expect(fetchImpl.calls).toHaveLength(1);
  });
});
