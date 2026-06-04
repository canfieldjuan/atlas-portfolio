import { DeflectionSnapshotLandingPage } from '@/components/landing/DeflectionSnapshotLandingPage';
import { generatePageMetadata } from '@/lib/seo';

export const metadata = generatePageMetadata({
  title: 'Free Deflection Snapshot: Find Repeat Support Tickets to Deflect First',
  description:
    'Upload 3 months of closed tickets and get a free Deflection Snapshot: ranked repeat-ticket issues, customer wording, a benchmark Support Tax estimate, and one sourced answer draft.',
  path: '/systems/support-ticket-deflection/snapshot',
  keywords: [
    'free Deflection Snapshot',
    'support ticket deflection snapshot',
    'repeat support ticket analysis',
    'support ticket CSV analysis',
    'ranked support questions',
    'customer wording analysis',
    'help center answer drafts',
  ],
});

export default function SupportTicketDeflectionSnapshotPage() {
  return <DeflectionSnapshotLandingPage />;
}
