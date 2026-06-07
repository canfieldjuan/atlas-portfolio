const LIVE_GA_MEASUREMENT_ID = 'G-RYN3S1R1RK';

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || LIVE_GA_MEASUREMENT_ID;
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || '';

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;
type GtagCommand = 'config' | 'event' | 'set';
type Gtag = (command: GtagCommand, target: string, params?: AnalyticsParams) => void;
const ANALYTICS_PATH_REDACTIONS = [
  {
    pattern: /^\/systems\/support-ticket-deflection\/results\/[^/?#]+/,
    replacement: '/systems/support-ticket-deflection/results/[requestId]',
  },
  {
    pattern: /^\/admin\/intake\/gap-report\/[^/?#]+/,
    replacement: '/admin/intake/gap-report/[requestId]',
  },
] as const;
export type FaqReportComebackAgeBucket =
  | 'same_day'
  | 'day_1_3'
  | 'day_4_7'
  | 'day_8_30'
  | 'over_30_days'
  | 'unknown';

export type FaqReportResultsAnalyticsContext = {
  submissionAgeBucket?: FaqReportComebackAgeBucket;
  priceVariant?: string;
  checkoutStatus?: string;
  generatedQuestionCount?: number;
  draftedAnswerCount?: number;
  lockedQuestionCount?: number;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

function canTrack() {
  return Boolean(
    GA_MEASUREMENT_ID &&
      typeof window !== 'undefined' &&
      typeof window.gtag === 'function'
  );
}

function safeDimension(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return (trimmed || fallback).slice(0, 100);
}

function safeCount(value: number | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : undefined;
}

export function redactAnalyticsPath(path: string) {
  let redactedPath = path || '/';

  for (const { pattern, replacement } of ANALYTICS_PATH_REDACTIONS) {
    redactedPath = redactedPath.replace(pattern, replacement);
  }

  return redactedPath;
}

function currentAnalyticsPageParams(): AnalyticsParams {
  const safePath = redactAnalyticsPath(`${window.location.pathname}${window.location.search}`);
  return {
    page_path: safePath,
    page_location: `${window.location.origin}${safePath}`,
  };
}

export function trackPageView(path: string) {
  if (!canTrack()) {
    return;
  }

  const safePath = redactAnalyticsPath(path);

  window.gtag?.('config', GA_MEASUREMENT_ID, {
    page_path: safePath,
    page_location: `${window.location.origin}${safePath}`,
    page_title: document.title,
  });
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (!canTrack()) {
    return;
  }

  window.gtag?.('event', eventName, {
    ...params,
    ...currentAnalyticsPageParams(),
  });
}

export function trackAuditRequestSubmitted({
  projectInterest,
  sourcePage,
  sourceOffer,
  status,
  delivery,
}: {
  projectInterest: string;
  sourcePage?: string;
  sourceOffer?: string;
  status?: string;
  delivery?: string;
}) {
  trackEvent('audit_request_submitted', {
    project_interest: safeDimension(projectInterest, 'unknown'),
    source_page: safeDimension(sourcePage, 'direct'),
    source_offer: safeDimension(sourceOffer, 'none'),
    submission_status: safeDimension(status, 'submitted'),
    delivery_path: safeDimension(delivery, 'unknown'),
  });
}

export function trackFaqReportCsvSubmitted({
  supportPlatform,
  sourcePage,
  sourceOffer,
  status,
}: {
  supportPlatform?: string;
  sourcePage?: string;
  sourceOffer?: string;
  status?: string;
}) {
  trackEvent('faq_report_csv_submitted', {
    support_platform: safeDimension(supportPlatform, 'unknown'),
    source_page: safeDimension(sourcePage, 'direct'),
    source_offer: safeDimension(sourceOffer, 'none'),
    submission_status: safeDimension(status, 'submitted'),
  });
}

function faqReportResultsParams(context: FaqReportResultsAnalyticsContext) {
  return {
    submission_age_bucket: safeDimension(context.submissionAgeBucket, 'unknown'),
    price_variant: safeDimension(context.priceVariant, 'standard'),
    checkout_status: safeDimension(context.checkoutStatus, 'none'),
    generated_questions: safeCount(context.generatedQuestionCount),
    drafted_answers: safeCount(context.draftedAnswerCount),
    locked_questions: safeCount(context.lockedQuestionCount),
  };
}

export function trackFaqReportResultsViewed(context: FaqReportResultsAnalyticsContext) {
  trackEvent('faq_report_results_viewed', faqReportResultsParams(context));
}

export function trackFaqReportUnlockClicked(context: FaqReportResultsAnalyticsContext) {
  trackEvent('faq_report_unlock_clicked', faqReportResultsParams(context));
}
