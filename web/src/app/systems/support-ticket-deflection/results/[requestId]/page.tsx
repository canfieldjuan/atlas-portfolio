import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DeflectionReportArtifactPage } from '@/components/landing/DeflectionReportArtifactPage';
import { DeflectionReportModelPage } from '@/components/landing/DeflectionReportModelPage';
import { DeflectionResultsPage } from '@/components/landing/DeflectionResultsPage';
import { DeflectionResultsUnavailablePage } from '@/components/landing/DeflectionResultsUnavailablePage';
import type { DeflectionSnapshot } from '@/lib/deflection-snapshot';
import {
  fetchDeflectionSnapshot,
  fetchDeflectionArtifact,
  fetchDeflectionReportModel,
  type ReportModelFetchResult,
} from '@/lib/atlas-deflection-client';
import {
  resolveDeflectionSnapshotRouteState,
  type DeflectionSnapshotRouteState,
} from '@/lib/deflection-results-state';
import {
  DEFLECTION_DEFAULT_PRICE_VARIANT,
  DEFLECTION_DEFAULT_PRICE_VARIANT_ID,
  resolveDeflectionPriceVariant,
} from '@/lib/deflection-pricing';
import {
  getGapReportPriceVariantByReportRequestId,
  getGapReportSubmittedAtByReportRequestId,
} from '@/lib/gap-report-intake-database';
import type { FAQDeflectionReportArtifact } from '@/lib/deflection-report-contract';
import type {
  FaqReportComebackAgeBucket,
  FaqReportResultsAnalyticsContext,
} from '@/lib/analytics';

type PageProps = {
  params: Promise<{ requestId: string }>;
  searchParams?: Promise<{ checkout?: string | string[]; priceVariant?: string | string[] }>;
};

// Per-request results page — never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export const maxDuration = 90;

// Live snapshot from ATLAS. 404 -> notFound; expected upstream/config failures
// render an explicit unavailable state instead of throwing a production 500.
// Missing service-account env still falls back to the demo fixture only in local
// development, never for a deployed buyer request.
async function getSnapshotState(requestId: string): Promise<DeflectionSnapshotRouteState> {
  const result = await fetchDeflectionSnapshot(requestId);
  return resolveDeflectionSnapshotRouteState(result);
}

// Prefer the paid structured model. Only legacy no-model rows fall back to the
// full artifact path; locked/error states proceed to the snapshot/unlock view.
async function getReportModel(requestId: string): Promise<ReportModelFetchResult> {
  return fetchDeflectionReportModel(requestId);
}

// Legacy fallback for paid reports generated before the structured model route.
async function getArtifact(requestId: string): Promise<FAQDeflectionReportArtifact | null> {
  const result = await fetchDeflectionArtifact(requestId);
  return result.ok ? result.artifact : null;
}

function checkoutStatus(value: string | string[] | undefined): 'success' | 'cancel' | undefined {
  const checkout = Array.isArray(value) ? value[0] : value;
  return checkout === 'success' || checkout === 'cancel' ? checkout : undefined;
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function comebackAgeBucket(
  submittedAt: string | undefined,
  now = new Date(),
): FaqReportComebackAgeBucket {
  if (!submittedAt) return 'unknown';
  const submittedMs = Date.parse(submittedAt);
  if (!Number.isFinite(submittedMs)) return 'unknown';
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - submittedMs) / 86_400_000));
  if (elapsedDays === 0) return 'same_day';
  if (elapsedDays <= 3) return 'day_1_3';
  if (elapsedDays <= 7) return 'day_4_7';
  if (elapsedDays <= 30) return 'day_8_30';
  return 'over_30_days';
}

async function getServerBoundPriceVariantId(requestId: string) {
  try {
    return await getGapReportPriceVariantByReportRequestId(requestId);
  } catch (error) {
    console.error(
      'deflection results: failed to load saved price variant:',
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

async function getResultsAnalyticsContext(
  requestId: string,
): Promise<FaqReportResultsAnalyticsContext> {
  try {
    const submittedAt = await getGapReportSubmittedAtByReportRequestId(requestId);
    return {
      submissionAgeBucket: comebackAgeBucket(submittedAt ?? undefined),
    };
  } catch (error) {
    console.error(
      'deflection results: failed to load submission analytics context:',
      error instanceof Error ? error.message : error,
    );
    return { submissionAgeBucket: 'unknown' };
  }
}

export default async function DeflectionResultsRoute({ params, searchParams }: PageProps) {
  const { requestId } = await params;
  const modelResult = await getReportModel(requestId);
  if (modelResult.ok) return <DeflectionReportModelPage model={modelResult.model} />;

  const artifact = modelResult.reason === 'not_found' ? await getArtifact(requestId) : null;
  if (artifact) return <DeflectionReportArtifactPage artifact={artifact} />;

  const snapshotState = await getSnapshotState(requestId);
  if (snapshotState.kind === 'not_found') notFound();
  if (snapshotState.kind === 'unavailable') return <DeflectionResultsUnavailablePage />;
  const snapshot: DeflectionSnapshot = snapshotState.snapshot;
  const query = searchParams ? await searchParams : undefined;
  const savedPriceVariantId = await getServerBoundPriceVariantId(requestId);
  const analyticsContext = await getResultsAnalyticsContext(requestId);
  const requestedPriceVariant = resolveDeflectionPriceVariant(firstParam(query?.priceVariant));
  if (
    process.env.NODE_ENV === 'production' &&
    !savedPriceVariantId &&
    requestedPriceVariant &&
    requestedPriceVariant.id !== DEFLECTION_DEFAULT_PRICE_VARIANT_ID
  ) {
    throw new Error('Results are temporarily unavailable. Please try again.');
  }
  const priceVariant =
    resolveDeflectionPriceVariant(
      savedPriceVariantId ||
        (process.env.NODE_ENV !== 'production' ? requestedPriceVariant?.id : undefined),
    ) ||
    DEFLECTION_DEFAULT_PRICE_VARIANT;
  return (
    <DeflectionResultsPage
      snapshot={snapshot}
      requestId={requestId}
      checkoutStatus={checkoutStatus(query?.checkout)}
      priceVariant={priceVariant}
      analyticsContext={analyticsContext}
    />
  );
}
