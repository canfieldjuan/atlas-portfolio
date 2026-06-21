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
  '<p>3 of them already have a publishable answer drafted</p>',
  '<p>One drafted answer you can inspect before paying</p>',
  '<h2>Unlock your full Backlog Report</h2>',
  '</main>',
].join('');
const NO_PROVEN_ANSWER_HTML = GOOD_HTML.replace(
  '<p>3 of them already have a publishable answer drafted</p>',
  '<p>0 of them already have a publishable answer drafted</p>',
).replace(
  '<p>One drafted answer you can inspect before paying</p>',
  '<p>0 drafted answers built from your team resolved tickets</p>',
);
const FULL_REPORT_HTML = [
  '<main>',
  '<span>MODEL-BACKED REPORT</span>',
  '<h1>Your Support Tax report is ready.</h1>',
  '<div>Paid report dashboard</div>',
  '<section>Priority Fix Queue</section>',
  '<section>Top Unresolved Repeats</section>',
  '<section>Drafted Resolutions</section>',
  '<section>Already Covered but Still Recurring</section>',
  '<section>Backlog Table</section>',
  '<section>Help-desk SEO targeting list</section>',
  '<strong>Ranked question opportunities</strong>',
  '<div>Top publishable answers and gaps</div>',
  '</main>',
].join('');
const LEGACY_FULL_REPORT_HTML = [
  '<main>',
  '<span>FULL BACKLOG REPORT</span>',
  '<h1>Your complete Support Tax report is ready.</h1>',
  '<div>Paid report contents</div>',
  '<section>Your Help-Desk SEO Targeting List</section>',
  '<strong>Publishable Help-Center Copy</strong>',
  '<div>Reviewer guidance</div>',
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
  assert.equal(result.expectedState, 'snapshot');
  assert.equal(
    result.url,
    'https://portfolio.example.com/systems/support-ticket-deflection/results/content-ops-unit-123',
  );
  assert.deepEqual(result.markers, {
    snapshotBadge: true,
    headline: true,
    keywordReframe: true,
    runRateComparison: true,
    snapshotAnswerState: true,
    supportTax: true,
    unlockCta: true,
  });
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fetchImpl.calls[0].init.cache, 'no-store');
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/' },
    { status: 200, body: `${NO_PROVEN_ANSWER_HTML}<template>This page could not be found</template>` },
  );
  assert.equal(result.ok, true);
  assert.deepEqual(result.markers, {
    snapshotBadge: true,
    headline: true,
    keywordReframe: true,
    runRateComparison: true,
    snapshotAnswerState: true,
    supportTax: true,
    unlockCta: true,
  });
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
    {
      status: 200,
      body: GOOD_HTML.replace('One drafted answer you can inspect before paying', '').replace(
        'no proven answer yet',
        '',
      ),
    },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.error, 'Hosted results page is missing required render markers.');
  assert.deepEqual(result.missing, ['snapshotAnswerState']);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    {
      status: 200,
      body: GOOD_HTML.replace('One drafted answer you can inspect before paying', '').replace(
        '3 of them already have a publishable answer drafted',
        '0 of them already have a publishable answer drafted',
      ),
    },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.error, 'Hosted results page is missing required render markers.');
  assert.deepEqual(result.missing, ['snapshotAnswerState']);
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

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: '404: This page could not be found.' },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.error, 'Hosted results page rendered an error marker: This page could not be found.');
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
    { status: 200, body: 'SNAPSHOT TEMPORARILY UNAVAILABLE' },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(
    result.error,
    'Hosted results page rendered an error marker: SNAPSHOT TEMPORARILY UNAVAILABLE.',
  );
}

{
  const { result, fetchImpl } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'full-report' },
    { status: 200, body: FULL_REPORT_HTML },
  );
  assert.equal(result.ok, true);
  assert.equal(result.expectedState, 'full-report');
  assert.deepEqual(result.markers, {
    backlogTable: true,
    coveredRecurring: true,
    draftedResolutions: true,
    paidHeadline: true,
    paidReportBadge: true,
    priorityFixQueue: true,
    rankedQuestions: true,
    reportContents: true,
    reviewerGuidance: true,
    seoTargeting: true,
    topUnresolvedRepeats: true,
  });
  assert.equal(fetchImpl.calls.length, 1);
  assert.equal(fetchImpl.calls[0].init.cache, 'no-store');
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'full-report' },
    { status: 200, body: LEGACY_FULL_REPORT_HTML },
  );
  assert.equal(result.ok, true);
  assert.equal(result.expectedState, 'full-report');
  assert.deepEqual(result.markers, {
    paidHeadline: true,
    paidReportBadge: true,
    rankedQuestions: true,
    reportContents: true,
    reviewerGuidance: true,
    seoTargeting: true,
  });
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'full-report' },
    { status: 200, body: FULL_REPORT_HTML.replace('Paid report dashboard', '') },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.expectedState, 'full-report');
  assert.equal(result.error, 'Hosted results page is missing required render markers.');
  assert.deepEqual(result.missing, ['reportContents']);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'full-report' },
    { status: 200, body: FULL_REPORT_HTML.replace('Priority Fix Queue', '') },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.expectedState, 'full-report');
  assert.equal(result.error, 'Hosted results page is missing required render markers.');
  assert.deepEqual(result.missing, ['priorityFixQueue']);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'full-report' },
    { status: 200, body: FULL_REPORT_HTML.replace('Top Unresolved Repeats', '') },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.expectedState, 'full-report');
  assert.equal(result.error, 'Hosted results page is missing required render markers.');
  assert.deepEqual(result.missing, ['topUnresolvedRepeats']);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'full-report' },
    { status: 200, body: FULL_REPORT_HTML.replace('Drafted Resolutions', '') },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.expectedState, 'full-report');
  assert.equal(result.error, 'Hosted results page is missing required render markers.');
  assert.deepEqual(result.missing, ['draftedResolutions']);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'full-report' },
    { status: 200, body: FULL_REPORT_HTML.replace('Already Covered but Still Recurring', '') },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.expectedState, 'full-report');
  assert.equal(result.error, 'Hosted results page is missing required render markers.');
  assert.deepEqual(result.missing, ['coveredRecurring']);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'full-report' },
    { status: 200, body: FULL_REPORT_HTML.replace('Backlog Table', '') },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.expectedState, 'full-report');
  assert.equal(result.error, 'Hosted results page is missing required render markers.');
  assert.deepEqual(result.missing, ['backlogTable']);
}

{
  const { result } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'full-report' },
    { status: 200, body: `${FULL_REPORT_HTML}<button>Unlock your full Backlog Report</button>` },
  );
  assert.equal(result.ok, false);
  assert.equal(result.stage, 'render');
  assert.equal(result.expectedState, 'full-report');
  assert.equal(result.error, 'Hosted results page rendered the locked snapshot instead of the full report.');
  assert.deepEqual(result.lockedMarkers, ['Unlock your full Backlog Report']);
}

{
  const { result, fetchImpl } = await run(
    { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'summary' },
    { status: 200, body: GOOD_HTML },
  );
  assert.equal(result.ok, false);
  assert.equal(result.error, 'Hosted results smoke expected state is invalid.');
  assert.equal(result.apiCalls, false);
  assert.equal(fetchImpl.calls.length, 0);
}

console.log('Deflection hosted results smoke tests passed.');
