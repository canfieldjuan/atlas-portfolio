const LIVE_GA_MEASUREMENT_ID = 'G-RYN3S1R1RK';

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || LIVE_GA_MEASUREMENT_ID;
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || '';

type AnalyticsValue = string | number | boolean | null | undefined;
type AnalyticsParams = Record<string, AnalyticsValue>;
type GtagCommand = 'config' | 'event' | 'set';
type Gtag = (command: GtagCommand, target: string, params?: AnalyticsParams) => void;

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

export function trackPageView(path: string) {
  if (!canTrack()) {
    return;
  }

  window.gtag?.('config', GA_MEASUREMENT_ID, {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  });
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (!canTrack()) {
    return;
  }

  window.gtag?.('event', eventName, params);
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
