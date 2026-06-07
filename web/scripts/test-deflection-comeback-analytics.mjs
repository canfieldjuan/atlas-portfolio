import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), 'utf8');
}

function assertIncludes(haystack, needle, context) {
  assert.ok(haystack.includes(needle), `${context}: expected ${needle}`);
}

function assertNotIncludes(haystack, needle, context) {
  assert.equal(haystack.includes(needle), false, `${context}: unexpected ${needle}`);
}

function sliceBetween(haystack, start, end, context) {
  const startIndex = haystack.indexOf(start);
  assert.notEqual(startIndex, -1, `${context}: missing start marker ${start}`);
  const endIndex = haystack.indexOf(end, startIndex);
  assert.notEqual(endIndex, -1, `${context}: missing end marker ${end}`);
  return haystack.slice(startIndex, endIndex);
}

const analytics = await source('src/lib/analytics.ts');
const database = await source('src/lib/gap-report-intake-database.ts');
const resultsRoute = await source(
  'src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx',
);
const resultsPage = await source('src/components/landing/DeflectionResultsPage.tsx');

const paramsBlock = sliceBetween(
  analytics,
  'function faqReportResultsParams',
  'export function trackFaqReportResultsViewed',
  'analytics payload',
);

assertIncludes(analytics, 'faq_report_results_viewed', 'results-view event name');
assertIncludes(analytics, 'faq_report_unlock_clicked', 'unlock-click event name');
assertIncludes(paramsBlock, 'submission_age_bucket', 'age-bucket dimension');
assertIncludes(paramsBlock, 'price_variant', 'price-variant dimension');
assertIncludes(paramsBlock, 'checkout_status', 'checkout-status dimension');
assertIncludes(paramsBlock, 'generated_questions', 'aggregate question count');
assertIncludes(paramsBlock, 'drafted_answers', 'aggregate drafted count');
assertIncludes(paramsBlock, 'locked_questions', 'aggregate locked count');
for (const forbidden of [
  'requestId',
  'request_id',
  'email',
  'companyName',
  'company_name',
  'csvBlobUrl',
  'csv_blob_url',
  'submittedAt',
  'submitted_at',
]) {
  assertNotIncludes(paramsBlock, forbidden, 'analytics payload privacy');
}

assertIncludes(
  database,
  'export async function getGapReportSubmissionByReportRequestId',
  'report-request submission lookup',
);
assertIncludes(
  database,
  "WHERE payload->>'reportRequestId' = $1",
  'report-request submission lookup',
);

assertIncludes(resultsRoute, 'function comebackAgeBucket', 'results age bucketing');
assertIncludes(resultsRoute, "return 'same_day'", 'same-day bucket');
assertIncludes(resultsRoute, "return 'day_8_30'", 'late-comeback bucket');
assertIncludes(
  resultsRoute,
  'getGapReportSubmissionByReportRequestId(requestId)',
  'results route submission lookup',
);
assertIncludes(
  resultsRoute,
  "return { submissionAgeBucket: 'unknown' }",
  'results analytics fail-open fallback',
);
assertIncludes(
  resultsRoute,
  'analyticsContext={analyticsContext}',
  'results analytics client prop',
);

assertIncludes(
  resultsPage,
  'trackFaqReportResultsViewed(trackedResultsContext)',
  'results-view tracking call',
);
assertIncludes(
  resultsPage,
  'trackFaqReportUnlockClicked(trackedResultsContext)',
  'unlock-click tracking call',
);
assertIncludes(resultsPage, 'resultsViewTracked.current', 'one-shot view guard');
assertIncludes(resultsPage, "checkoutStatus: checkoutStatus ?? 'none'", 'checkout status dimension');
assert.ok(
  resultsPage.indexOf('trackFaqReportUnlockClicked(trackedResultsContext)') <
    resultsPage.indexOf("fetch('/api/deflection-checkout'"),
  'unlock click should be tracked before checkout session creation',
);

console.log('Deflection comeback analytics tests passed.');
