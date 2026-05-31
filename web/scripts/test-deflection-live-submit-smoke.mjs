import assert from 'node:assert/strict';
import { runDeflectionLiveSubmitSmoke } from './smoke-deflection-live-submit.mjs';

const baseOptions = {
  csvPath: '/tmp/support-export.csv',
  companyName: 'Effingham Office Maids',
  contactEmail: 'ops@example.com',
  platform: 'helpscout',
};

const baseEnv = {
  ATLAS_API_BASE_URL: 'https://atlas.example.com/',
  ATLAS_B2B_JWT: 'jwt_unit',
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
    },
    top_questions: [
      {
        rank: 1,
        question: 'How do I export reports?',
        customer_wording: 'export reports',
        weighted_frequency: 4,
      },
    ],
  };
}

function makeFetchMock(responses) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    const next = responses.shift();
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
  return { result, fetchImpl };
}

{
  const { result, fetchImpl } = await run(baseOptions, [
    { status: 200, body: { request_id: 'content-ops-unit-123' } },
    { status: 200, body: snapshotPayload() },
    { status: 403 },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.requestId, 'content-ops-unit-123');
  assert.equal(
    result.resultsUrl,
    'https://juancanfield.com/systems/support-ticket-deflection/results/content-ops-unit-123',
  );
  assert.equal(result.artifactStatus, 'locked');
  assert.equal(fetchImpl.calls.length, 3);
  assert.equal(
    fetchImpl.calls[0].url,
    'https://atlas.example.com/api/v1/content-ops/deflection-reports/submit',
  );
  assert.equal(fetchImpl.calls[0].init.headers.Authorization, 'Bearer jwt_unit');
  assert.equal(fetchImpl.calls[0].init.headers['Content-Type'], undefined);
  assert.equal(fetchImpl.calls[0].init.body.get('support_platform'), 'help_scout');
  assert.equal(fetchImpl.calls[0].init.body.get('company_name'), 'Effingham Office Maids');
  assert.equal(fetchImpl.calls[0].init.body.get('contact_email'), 'ops@example.com');
  assert.equal(fetchImpl.calls[0].init.body.get('csv_file').name, 'support-export.csv');
  assert.equal(
    fetchImpl.calls[1].url,
    'https://atlas.example.com/api/v1/content-ops/deflection-reports/content-ops-unit-123/snapshot',
  );
  assert.equal(
    fetchImpl.calls[2].url,
    'https://atlas.example.com/api/v1/content-ops/deflection-reports/content-ops-unit-123/artifact',
  );
}

{
  const { result, fetchImpl } = await run(baseOptions, [], { env: {} });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Deflection live submit smoke environment is incomplete.');
  assert.deepEqual(result.missing, ['ATLAS_API_BASE_URL', 'ATLAS_B2B_JWT']);
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl } = await run(
    { ...baseOptions, platform: 'freshdesk' },
    [{ status: 200, body: { request_id: '../../bad' } }],
  );
  assert.equal(fetchImpl.calls[0].init.body.get('support_platform'), 'other');
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'submit');
  assert.equal(result.error, 'ATLAS submit response did not include a valid request_id.');
}

{
  const { result, fetchImpl } = await run(baseOptions, [
    { status: 200, body: { request_id: 'content-ops-unit-123' } },
    { status: 500, body: { error: 'upstream failed' } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'snapshot');
  assert.equal(result.error, 'ATLAS snapshot fetch failed with HTTP 500.');
  assert.equal(fetchImpl.calls.length, 2);
}

{
  const { result, fetchImpl } = await run(baseOptions, [
    { status: 200, body: { request_id: 'content-ops-unit-123' } },
    { reject: 'network reset' },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'snapshot');
  assert.equal(result.requestId, 'content-ops-unit-123');
  assert.equal(result.apiCalls, true);
  assert.equal(result.mutations, true);
  assert.equal(result.error, 'ATLAS snapshot fetch failed before an HTTP response.');
  assert.equal(fetchImpl.calls.length, 2);
}

{
  const { result } = await run(baseOptions, [
    { status: 200, body: { request_id: 'content-ops-unit-123' } },
    { status: 200, body: { summary: { generated: '3' }, top_questions: [] } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'snapshot');
  assert.equal(result.error, 'ATLAS snapshot response shape was rejected.');
}

{
  const { result } = await run(baseOptions, [
    { status: 200, body: { request_id: 'content-ops-unit-123' } },
    { status: 200, body: snapshotPayload() },
    { status: 200, body: { markdown: '# already paid' } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'artifact');
  assert.equal(result.error, 'Expected locked artifact HTTP 403, got HTTP 200.');
}

{
  const { result, fetchImpl } = await run(baseOptions, [
    { status: 200, body: { request_id: 'content-ops-unit-123' } },
    { status: 200, body: snapshotPayload() },
    { reject: 'tls failure' },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'artifact');
  assert.equal(result.requestId, 'content-ops-unit-123');
  assert.equal(result.apiCalls, true);
  assert.equal(result.mutations, true);
  assert.equal(result.error, 'ATLAS artifact fetch failed before an HTTP response.');
  assert.equal(fetchImpl.calls.length, 3);
}

{
  const { result, fetchImpl } = await run(
    { ...baseOptions, csvPath: '/tmp/support-export.txt' },
    [],
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Deflection live submit smoke options are invalid.');
  assert.deepEqual(result.errors, ['--csv must point to a .csv file']);
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl } = await run(baseOptions, [], {
    readFileImpl: async () => {
      throw new Error('missing file');
    },
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'CSV file could not be read.');
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl } = await run(baseOptions, [
    { status: 503, body: { error: 'unavailable' } },
  ]);
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'submit');
  assert.equal(result.error, 'ATLAS submit failed with HTTP 503.');
  assert.equal(fetchImpl.calls.length, 1);
}

console.log('Deflection live submit smoke tests passed.');
