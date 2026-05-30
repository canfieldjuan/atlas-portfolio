import type { Metadata } from 'next';
import { DeflectionReportArtifactPage } from '@/components/landing/DeflectionReportArtifactPage';
import { DeflectionResultsPage } from '@/components/landing/DeflectionResultsPage';
import {
  DEMO_DEFLECTION_SNAPSHOT,
  type DeflectionSnapshot,
} from '@/lib/deflection-snapshot';
import type { FAQDeflectionReportArtifact } from '@/lib/deflection-report-contract';

type PageProps = { params: Promise<{ requestId: string }> };

// Per-request results page — never indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// TODO(gated slice): fetch the live snapshot from ATLAS by requestId.
//   const res = await fetch(`${ATLAS_BASE}${deflectionSnapshotPath(requestId)}`, {
//     headers: { Authorization: `Bearer ${ATLAS_B2B_JWT}` }, cache: 'no-store',
//   });
//   if (res.status === 404) notFound();
//   return parseDeflectionSnapshot(await res.json());   // validate upstream shape
// Until the ATLAS host + B2B JWT are configured, render the preview fixture so
// the free-state page reviews like production.
async function getSnapshot(requestId: string): Promise<DeflectionSnapshot> {
  void requestId; // used by the live fetch above; unused while on the fixture
  return DEMO_DEFLECTION_SNAPSHOT;
}

// TODO(artifact hydration): fetch the paid artifact from ATLAS before the
// snapshot. Expected behavior once configured:
//   200 -> render DeflectionReportArtifactPage
//   403 -> paid artifact locked; render DeflectionResultsPage snapshot
//   404 -> no artifact yet; render DeflectionResultsPage snapshot
async function getArtifact(requestId: string): Promise<FAQDeflectionReportArtifact | null> {
  void requestId;
  return null;
}

export default async function DeflectionResultsRoute({ params }: PageProps) {
  const { requestId } = await params;
  const artifact = await getArtifact(requestId);
  if (artifact) return <DeflectionReportArtifactPage artifact={artifact} />;

  const snapshot = await getSnapshot(requestId);
  return <DeflectionResultsPage snapshot={snapshot} />;
}
