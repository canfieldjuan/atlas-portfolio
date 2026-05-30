import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DeflectionResultsPage } from '@/components/landing/DeflectionResultsPage';
import {
  DEMO_DEFLECTION_SNAPSHOT,
  type DeflectionSnapshot,
} from '@/lib/deflection-snapshot';
import { fetchDeflectionSnapshot } from '@/lib/atlas-deflection-client';

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

export default async function DeflectionResultsRoute({ params }: PageProps) {
  const { requestId } = await params;
  const snapshot = await getSnapshot(requestId);
  return <DeflectionResultsPage snapshot={snapshot} />;
}
