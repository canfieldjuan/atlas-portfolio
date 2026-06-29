import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { runDeflectionHostedResultsSmoke } from '../../scripts/smoke-deflection-hosted-results.mjs';

const REQUEST_ID = 'content-ops-unit-123';
const GOOD_HTML = [
  '<main>',
  '<span>YOUR RESOLUTION AUDIT SNAPSHOT</span>',
  '<h1>We found <span>7</span> repeat questions hiding in your queue.</h1>',
  '<p>Support Tax projection</p>',
  '<p>Help-desk SEO targeting list</p>',
  '<p>This backlog at current pace</p>',
  '<p>3 of them already have a publishable answer drafted</p>',
  '<p>One drafted answer you can inspect before paying</p>',
  '<h2>Unlock your full Resolution Audit</h2>',
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
  '<span>FULL RESOLUTION AUDIT</span>',
  '<h1>Your Resolution Audit is ready.</h1>',
  '<div>Full audit dashboard</div>',
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
const PARTNER_FULL_REPORT_HTML = FULL_REPORT_HTML.replace(
  'FULL RESOLUTION AUDIT',
  'FULL DEFLECTION REPORT',
).replace(
  'Your Resolution Audit is ready.',
  'Your Deflection Report is ready.',
).replace('Full audit dashboard', 'Full report dashboard');
const LEGACY_FULL_REPORT_HTML = [
  '<main>',
  '<span>FULL RESOLUTION AUDIT</span>',
  '<h1>Your Resolution Audit is ready.</h1>',
  '<div>Full audit contents</div>',
  '<section>Your Help-Desk SEO Targeting List</section>',
  '<strong>Publishable Help-Center Copy</strong>',
  '<div>Reviewer guidance</div>',
  '</main>',
].join('');
const PARTNER_LEGACY_FULL_REPORT_HTML = LEGACY_FULL_REPORT_HTML.replace(
  'FULL RESOLUTION AUDIT',
  'FULL DEFLECTION REPORT',
).replace(
  'Your Resolution Audit is ready.',
  'Your Deflection Report is ready.',
).replace('Full audit contents', 'Full report contents');

const SNAPSHOT_MARKERS = {
  snapshotBadge: true,
  headline: true,
  keywordReframe: true,
  runRateComparison: true,
  snapshotAnswerState: true,
  supportTax: true,
  unlockCta: true,
};
const MODEL_FULL_REPORT_MARKERS = {
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
};
const LEGACY_FULL_REPORT_MARKERS = {
  paidHeadline: true,
  paidReportBadge: true,
  rankedQuestions: true,
  reportContents: true,
  reviewerGuidance: true,
  seoTargeting: true,
};

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
  return { fetchImpl, result };
}

async function readResultPageSource() {
  return readFile(new URL('../components/landing/DeflectionResultsPage.tsx', import.meta.url), 'utf8');
}

function extractPartnerOfferCopyBranch(source) {
  const partnerMarker = 'if (priceVariant.id === DEFLECTION_PARTNER_PRICE_VARIANT_ID) {';
  const partnerStart = source.indexOf(partnerMarker);
  expect(partnerStart).not.toBe(-1);

  const publicMarker = "snapshotBadge: 'YOUR RESOLUTION AUDIT SNAPSHOT'";
  const publicStart = source.indexOf(publicMarker, partnerStart);
  expect(publicStart).not.toBe(-1);

  return source.slice(partnerStart, publicStart);
}

describe('deflection hosted results smoke guard', () => {
  it('pins partner offer copy to Deflection Snapshot wording', async () => {
    const resultPageSource = await readResultPageSource();
    const partnerOfferCopyBranch = extractPartnerOfferCopyBranch(resultPageSource);

    expect(partnerOfferCopyBranch).toMatch(/snapshotBadge: 'YOUR DEFLECTION SNAPSHOT'/);
    expect(partnerOfferCopyBranch).toMatch(/fullArtifactName: 'full Deflection Report'/);
    expect(partnerOfferCopyBranch).toMatch(/offerHeading: 'Unlock your full Deflection Report'/);
    expect(partnerOfferCopyBranch).not.toMatch(/Resolution Audit/);
  });

  it('verifies hosted snapshot render markers while ignoring dormant not-found payloads', async () => {
    const { fetchImpl, result } = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/' },
      { status: 200, body: `${GOOD_HTML}<template>This page could not be found</template>` },
    );

    expect(result).toMatchObject({
      ok: true,
      requestId: REQUEST_ID,
      expectedState: 'snapshot',
      url: 'https://portfolio.example.com/systems/support-ticket-deflection/results/content-ops-unit-123',
    });
    expect(result.markers).toEqual(SNAPSHOT_MARKERS);
    expect(fetchImpl.calls).toHaveLength(1);
    expect(fetchImpl.calls[0].init.cache).toBe('no-store');
  });

  it('accepts a no-proven-answer snapshot render state', async () => {
    const { result } = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/' },
      { status: 200, body: `${NO_PROVEN_ANSWER_HTML}<template>This page could not be found</template>` },
    );

    expect(result.ok).toBe(true);
    expect(result.markers).toEqual(SNAPSHOT_MARKERS);
  });

  it.each([
    {
      name: 'invalid request id',
      options: { requestId: '../bad', baseUrl: 'https://portfolio.example.com' },
      error: 'Hosted results smoke request id is invalid.',
    },
    {
      name: 'invalid base URL',
      options: { requestId: REQUEST_ID, baseUrl: 'http://evil.example.com' },
      error: 'Hosted results smoke base URL is invalid.',
    },
    {
      name: 'invalid expected state',
      options: { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'summary' },
      error: 'Hosted results smoke expected state is invalid.',
    },
  ])('fails closed before network calls for $name', async ({ error, options }) => {
    const { fetchImpl, result } = await run(options, { status: 200, body: GOOD_HTML });

    expect(result).toMatchObject({
      ok: false,
      error,
      apiCalls: false,
    });
    expect(fetchImpl.calls).toHaveLength(0);
  });

  it.each([
    {
      name: 'HTTP failure',
      response: { status: 404, body: 'not found' },
      error: 'Hosted results page failed with HTTP 404.',
    },
    {
      name: 'network failure',
      response: { reject: 'network reset' },
      error: 'Hosted results page fetch failed before an HTTP response.',
    },
  ])('reports hosted results fetch $name', async ({ error, response }) => {
    const { fetchImpl, result } = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
      response,
    );

    expect(result).toMatchObject({
      ok: false,
      stage: 'fetch',
      error,
    });
    expect(fetchImpl.calls).toHaveLength(1);
  });

  it.each([
    ['snapshotBadge', GOOD_HTML.replace('YOUR RESOLUTION AUDIT SNAPSHOT', '')],
    ['supportTax', GOOD_HTML.replace('Support Tax projection', '')],
    ['keywordReframe', GOOD_HTML.replace('Help-desk SEO targeting list', '')],
    ['runRateComparison', GOOD_HTML.replace('This backlog at current pace', '')],
    ['unlockCta', GOOD_HTML.replace('Unlock your full Resolution Audit', '')],
    [
      'snapshotAnswerState',
      GOOD_HTML.replace('One drafted answer you can inspect before paying', '').replace('no proven answer yet', ''),
    ],
    [
      'snapshotAnswerState',
      GOOD_HTML.replace('One drafted answer you can inspect before paying', '').replace(
        '3 of them already have a publishable answer drafted',
        '0 of them already have a publishable answer drafted',
      ),
    ],
  ])('reports missing snapshot marker %s exactly', async (missingMarker, body) => {
    const { result } = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
      { status: 200, body },
    );

    expect(result).toMatchObject({
      ok: false,
      stage: 'render',
      error: 'Hosted results page is missing required render markers.',
    });
    expect(result.missing).toEqual([missingMarker]);
  });

  it.each([
    ['Application error', 'Hosted results page rendered an error marker: Application error.'],
    ['404: This page could not be found.', 'Hosted results page rendered an error marker: This page could not be found.'],
    [
      'SNAPSHOT TEMPORARILY UNAVAILABLE',
      'Hosted results page rendered an error marker: SNAPSHOT TEMPORARILY UNAVAILABLE.',
    ],
  ])('reports visible error marker %s', async (body, error) => {
    const { result } = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com' },
      { status: 200, body },
    );

    expect(result).toMatchObject({
      ok: false,
      stage: 'render',
      error,
    });
  });

  it.each([
    ['full-report', FULL_REPORT_HTML],
    ['model-full-report', FULL_REPORT_HTML],
    ['model-full-report', PARTNER_FULL_REPORT_HTML],
  ])('verifies %s model-backed paid results markers', async (expectedState, body) => {
    const { fetchImpl, result } = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: expectedState },
      { status: 200, body },
    );

    expect(result).toMatchObject({
      ok: true,
      expectedState,
    });
    expect(result.markers).toEqual(MODEL_FULL_REPORT_MARKERS);
    expect(fetchImpl.calls).toHaveLength(1);
    expect(fetchImpl.calls[0].init.cache).toBe('no-store');
  });

  it.each([
    ['full-report', LEGACY_FULL_REPORT_HTML],
    ['full-report', PARTNER_LEGACY_FULL_REPORT_HTML],
  ])('verifies %s legacy paid artifact markers', async (expectedState, body) => {
    const { result } = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: expectedState },
      { status: 200, body },
    );

    expect(result).toMatchObject({
      ok: true,
      expectedState,
    });
    expect(result.markers).toEqual(LEGACY_FULL_REPORT_MARKERS);
  });

  it('rejects legacy artifact HTML when model-full-report is required', async () => {
    const { result } = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'model-full-report' },
      { status: 200, body: LEGACY_FULL_REPORT_HTML },
    );

    expect(result).toMatchObject({
      ok: false,
      expectedState: 'model-full-report',
    });
    expect(result.missing).toEqual([
      'reportContents',
      'priorityFixQueue',
      'topUnresolvedRepeats',
      'draftedResolutions',
      'coveredRecurring',
      'backlogTable',
      'seoTargeting',
      'rankedQuestions',
      'reviewerGuidance',
    ]);
  });

  it.each([
    ['reportContents', FULL_REPORT_HTML.replace('Full audit dashboard', ''), 'full-report'],
    ['priorityFixQueue', FULL_REPORT_HTML.replace('Priority Fix Queue', ''), 'full-report'],
    ['topUnresolvedRepeats', FULL_REPORT_HTML.replace('Top Unresolved Repeats', ''), 'full-report'],
    ['draftedResolutions', FULL_REPORT_HTML.replace('Drafted Resolutions', ''), 'full-report'],
    ['coveredRecurring', FULL_REPORT_HTML.replace('Already Covered but Still Recurring', ''), 'full-report'],
    ['backlogTable', FULL_REPORT_HTML.replace('Backlog Table', ''), 'full-report'],
    ['backlogTable', FULL_REPORT_HTML.replace('Backlog Table', ''), 'model-full-report'],
  ])('reports missing paid marker %s exactly for %s', async (missingMarker, body, expectedState) => {
    const { result } = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: expectedState },
      { status: 200, body },
    );

    expect(result).toMatchObject({
      ok: false,
      stage: 'render',
      expectedState,
      error: 'Hosted results page is missing required render markers.',
    });
    expect(result.missing).toEqual([missingMarker]);
  });

  it('fails full-report renders when locked snapshot markers leak into the paid page', async () => {
    const { result } = await run(
      { requestId: REQUEST_ID, baseUrl: 'https://portfolio.example.com/', expect: 'full-report' },
      { status: 200, body: `${FULL_REPORT_HTML}<button>Unlock your full Resolution Audit</button>` },
    );

    expect(result).toMatchObject({
      ok: false,
      stage: 'render',
      expectedState: 'full-report',
      error: 'Hosted results page rendered the locked snapshot instead of the full report.',
    });
    expect(result.lockedMarkers).toEqual(['Unlock your full Resolution Audit']);
  });
});
