import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  trackFaqReportResultsViewed,
  trackFaqReportUnlockClicked,
} from './analytics';

function assertIncludes(haystack: string, needle: string, context: string) {
  expect(haystack, `${context}: expected ${needle}`).toContain(needle);
}

function assertNotIncludes(haystack: string, needle: string, context: string) {
  expect(haystack, `${context}: unexpected ${needle}`).not.toContain(needle);
}

function sliceBetween(haystack: string, start: string, end: string, context: string) {
  const startIndex = haystack.indexOf(start);
  expect(startIndex, `${context}: missing start marker ${start}`).not.toBe(-1);
  const endIndex = haystack.indexOf(end, startIndex);
  expect(endIndex, `${context}: missing end marker ${end}`).not.toBe(-1);
  return haystack.slice(startIndex, endIndex);
}

describe('deflection comeback analytics guard', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('emits privacy-bounded results analytics through the real helpers', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', {
      location: {
        origin: 'https://juancanfield.com',
        pathname: '/systems/support-ticket-deflection/results/req_sensitive_123',
        search: '?checkout=success&priceVariant=standard',
      },
      gtag,
    });

    trackFaqReportResultsViewed({
      submissionAgeBucket: 'day_8_30',
      priceVariant: 'standard',
      checkoutStatus: 'success',
      generatedQuestionCount: 12.4,
      draftedAnswerCount: 3.6,
      lockedQuestionCount: -1,
    });
    trackFaqReportUnlockClicked({
      submissionAgeBucket: 'same_day',
      priceVariant: 'partner',
      checkoutStatus: 'none',
      generatedQuestionCount: 7,
      draftedAnswerCount: 1,
      lockedQuestionCount: 6,
    });

    expect(gtag).toHaveBeenCalledTimes(2);
    expect(gtag).toHaveBeenNthCalledWith(
      1,
      'event',
      'faq_report_results_viewed',
      expect.objectContaining({
        checkout_status: 'success',
        drafted_answers: 4,
        generated_questions: 12,
        locked_questions: undefined,
        page_location:
          'https://juancanfield.com/systems/support-ticket-deflection/results/[requestId]?checkout=success&priceVariant=standard',
        page_path:
          '/systems/support-ticket-deflection/results/[requestId]?checkout=success&priceVariant=standard',
        price_variant: 'standard',
        submission_age_bucket: 'day_8_30',
      }),
    );
    expect(gtag.mock.calls[1]?.[1]).toBe('faq_report_unlock_clicked');
    expect(gtag.mock.calls[1]?.[2]).toEqual(expect.objectContaining({
      checkout_status: 'none',
      generated_questions: 7,
      locked_questions: 6,
      price_variant: 'partner',
    }));

    const emittedPayloads = gtag.mock.calls.map((call) => JSON.stringify(call));
    for (const payload of emittedPayloads) {
      expect(payload).not.toContain('req_sensitive_123');
    }
  });

  it('keeps comeback analytics route, database, and client wiring intact', async () => {
    const [
      analytics,
      database,
      prePushWorkflow,
      resultsRoute,
      resultsPage,
    ] = await Promise.all([
      readFile(new URL('./analytics.ts', import.meta.url), 'utf8'),
      readFile(new URL('./gap-report-intake-database.ts', import.meta.url), 'utf8'),
      readFile(new URL('../../../.github/workflows/pre_push_audit.yml', import.meta.url), 'utf8'),
      readFile(
        new URL('../app/systems/support-ticket-deflection/results/[requestId]/page.tsx', import.meta.url),
        'utf8',
      ),
      readFile(new URL('../components/landing/DeflectionResultsPage.tsx', import.meta.url), 'utf8'),
    ]);

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
      'export async function getGapReportSubmittedAtByReportRequestId',
      'report-request submitted-at lookup',
    );
    const submittedAtLookup = sliceBetween(
      database,
      'export async function getGapReportSubmittedAtByReportRequestId',
      'export async function getGapReportPriceVariantByReportRequestId',
      'report-request submitted-at lookup',
    );
    assertIncludes(
      submittedAtLookup,
      "WHERE payload->>'reportRequestId' = $1",
      'report-request submitted-at lookup',
    );
    assertIncludes(submittedAtLookup, 'AS submitted_at', 'submitted-at lookup column');
    for (const forbidden of ['email', 'company_name', 'csv_blob_url']) {
      assertNotIncludes(submittedAtLookup, forbidden, 'submitted-at lookup privacy');
    }

    assertIncludes(resultsRoute, 'function comebackAgeBucket', 'results age bucketing');
    assertIncludes(resultsRoute, "return 'same_day'", 'same-day bucket');
    assertIncludes(resultsRoute, "return 'day_8_30'", 'late-comeback bucket');
    assertIncludes(
      resultsRoute,
      'getGapReportSubmittedAtByReportRequestId(requestId)',
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
    assertIncludes(resultsPage, 'useMemo(', 'stable analytics context memo');
    assertIncludes(resultsPage, 'resultsViewTracked.current', 'one-shot view guard');
    assertIncludes(resultsPage, "checkoutStatus: checkoutStatus ?? 'none'", 'checkout status dimension');
    expect(resultsPage.indexOf('trackFaqReportUnlockClicked(trackedResultsContext)')).toBeLessThan(
      resultsPage.indexOf("fetch('/api/deflection-checkout'"),
    );

    assertIncludes(
      prePushWorkflow,
      'npm --prefix web run test:deflection-comeback-analytics',
      'CI enrollment',
    );
  });
});
