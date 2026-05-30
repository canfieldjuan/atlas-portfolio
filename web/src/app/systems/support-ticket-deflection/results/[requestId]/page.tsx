import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DeflectionReportArtifactPage } from '@/components/landing/DeflectionReportArtifactPage';
import { DeflectionResultsPage } from '@/components/landing/DeflectionResultsPage';
import {
  DEMO_DEFLECTION_SNAPSHOT,
  type DeflectionSnapshot,
} from '@/lib/deflection-snapshot';
import {
  fetchDeflectionSnapshot,
  fetchDeflectionArtifact,
} from '@/lib/atlas-deflection-client';
import type { FAQDeflectionReportArtifact } from '@/lib/deflection-report-contract';

type PageProps = { params: Promise<{ requestId: string }> };

// Per-request results page — never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Live snapshot from ATLAS. 404 → notFound; upstream/parse failure → error page.
// When the service-account env is missing we ONLY fall back to the demo fixture
// in local development — in any deployed build (NODE_ENV=production) a missing
// config is a misconfiguration and we fail loudly rather than silently serve
// demo data as if it were the buyer's real snapshot.
async function getSnapshot(requestId: string): Promise<DeflectionSnapshot> {
  const result = await fetchDeflectionSnapshot(requestId);
  if (result.ok) return result.snapshot;
  if (result.reason === 'not_configured') {
    if (process.env.NODE_ENV !== 'production') return DEMO_DEFLECTION_SNAPSHOT;
    throw new Error('Results are temporarily unavailable. Please try again.');
  }
  if (result.reason === 'not_found') notFound();
  throw new Error('Could not load your snapshot right now. Please try again.');
}

// Fetch the paid-gated full report before the snapshot:
//   200 (ok)        -> render DeflectionReportArtifactPage (unlocked)
//   403 (locked)    -> null -> fall through to the snapshot + unlock CTA
//   404 / error / not_configured -> null -> snapshot (graceful; logged server-side)
async function getArtifact(requestId: string): Promise<FAQDeflectionReportArtifact | null> {
  const result = await fetchDeflectionArtifact(requestId);
  return result.ok ? result.artifact : null;
}

export default async function DeflectionResultsRoute({ params }: PageProps) {
  const { requestId } = await params;
  const artifact = await getArtifact(requestId);
  if (artifact) return <DeflectionReportArtifactPage artifact={artifact} />;

  const snapshot = await getSnapshot(requestId);
  return <DeflectionResultsPage snapshot={snapshot} />;
}
