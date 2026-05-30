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

// Live snapshot from ATLAS when the service-account env is configured; the
// preview fixture otherwise (local/preview deploys without secrets) so the page
// still renders for review. 404 → notFound; upstream/parse failure → error page.
async function getSnapshot(requestId: string): Promise<DeflectionSnapshot> {
  const result = await fetchDeflectionSnapshot(requestId);
  if (result.ok) return result.snapshot;
  if (result.reason === 'not_configured') return DEMO_DEFLECTION_SNAPSHOT;
  if (result.reason === 'not_found') notFound();
  throw new Error('Could not load your snapshot right now. Please try again.');
}

export default async function DeflectionResultsRoute({ params }: PageProps) {
  const { requestId } = await params;
  const snapshot = await getSnapshot(requestId);
  return <DeflectionResultsPage snapshot={snapshot} />;
}
