import { DeflectionSnapshotLandingPage } from '@/components/landing/DeflectionSnapshotLandingPage';
import { generatePageMetadata } from '@/lib/seo';

export const metadata = generatePageMetadata({
  title: 'The Resolution Audit: Find Support Ticket Cost Exposure',
  description:
    'Upload your support-ticket export for a forensic Snapshot of repeat contacts, ranked question clusters, estimated Support Tax, one agent-backed answer, and one unresolved finding.',
  path: '/systems/support-ticket-deflection/snapshot',
  keywords: [
    'Resolution Audit',
    'support ticket audit',
    'support ticket cost exposure',
    'support ticket CSV audit',
    'ranked support questions',
    'customer wording analysis',
    'Support Tax estimate',
  ],
});

export default function SupportTicketDeflectionSnapshotPage() {
  return <DeflectionSnapshotLandingPage />;
}
