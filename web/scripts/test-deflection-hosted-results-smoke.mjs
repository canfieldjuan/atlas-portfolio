import assert from 'node:assert/strict';
import { runDeflectionHostedResultsSmoke } from './smoke-deflection-hosted-results.mjs';

const REQUEST_ID = 'content-ops-unit-123';
const GOOD_HTML = [
  '<main>',
  '<span>YOUR DEFLECTION SNAPSHOT</span>',
  '<h1>We found <span>7</span> repeat questions hiding in your queue.</h1>',
  '<p>Support Tax projection</p>',
  '<p>Help-desk SEO targeting list</p>',
  '<p>This backlog at current pace</p>',
  '<p>One drafted answer you can inspect before paying</p>',
  '<h2>Unlock your full Backlog Report</h2>',
  '</main>',
].join('');

function makeFetchMock(response) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (response.reject) {
      throw new Error(response.reject);
    }
    return new Response(response.body ?? '', { status: response.status });
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

async function run(options, response) {
  const fetchImpl = makeFetchMock(response);
  const result = await runDeflectionHostedResultsSmoke(options, {
    fetchImpl,
    now: () => '2026-05-31T16:00:00.000Z',
  });
  return { result, fetchImpl };
}

{
  const { result, fetchImpl } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/' },
    { status: 200, body: `${GOOD_HTML}<template>This page could not be found</template>` },
  );
  assert.equal(result.ok, true);
  assert.equal(result.requestId, REQUEST_ID);
  assert.equal(
    result.url,
    'https://portfolio.example.com/systems/support-ticket-deflection/results/content-ops-unit-123',
  );
  assert.deepEqual(result.markers, {
    snapshotBadge: true,
    headline: true,
    keywordReframe: true,
    runRateComparison: true,
    teaserAnswer: true,
    supportTax: true,
    unlockCta: true,
  });
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fetchImpl.calls[0].init.cache, 'no-store');
}

{
  const { result, fetchImpl } = await run(
    { requestId: '../bad', baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: GOOD_HTML },
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Hosted results smoke request id is invalid.');
  assert.equal(result.apiCalls, false);
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl } = await run(
    { requestId: REQUEST_ID, baseUrl: 'http://evil.example.com' },
    { status: 200, body: GOOD_HTML },
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Hosted results smoke base URL is invalid.');
  assert.equal(result.apiCalls, false);
  assert.equal(fetchImpl.calls.length, 0);
}

{
  const { result, fetchImpl } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { status: 404, body: 'not found' },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'fetch');
  assert.equal(result.error, 'Hosted results page failed with HTTP 404.');
  assert.equal(fetchImpl.calls.length, 1);
}

{
  const { result, fetchImpl } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { reject: 'network reset' },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'fetch');
  assert.equal(result.error, 'Hosted results page fetch failed before an HTTP response.');
  assert.equal(fetchImpl.calls.length, 1);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: GOOD_HTML.replace('YOUR DEFLECTION SNAPSHOT', '') },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.error, 'Hosted results page is missing required render markers.');
  assert.deepEqual(result.missing, ['snapshotBadge']);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: GOOD_HTML.replace('Support Tax projection', '') },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.deepEqual(result.missing, ['supportTax']);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: GOOD_HTML.replace('Help-desk SEO targeting list', '') },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.deepEqual(result.missing, ['keywordReframe']);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: GOOD_HTML.replace('This backlog at current pace', '') },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.deepEqual(result.missing, ['runRateComparison']);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: GOOD_HTML.replace('Unlock your full Backlog Report', '') },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.deepEqual(result.missing, ['unlockCta']);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: 'Application error' },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.error, 'Hosted results page rendered an error marker: Application error.');
}

console.log('Deflection hosted results smoke tests passed.');
