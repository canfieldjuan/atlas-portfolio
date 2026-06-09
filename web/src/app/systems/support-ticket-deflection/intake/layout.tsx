import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

const baseMetadata = generatePageMetadata({
  title: 'FAQ Deflection Intake',
  description:
    'Start a deterministic FAQ deflection analysis from private support-ticket data.',
  path: '/systems/support-ticket-deflection/intake',
  keywords: [
    'Deflection Snapshot intake',
    'support ticket CSV upload',
    'support ticket deflection intake',
    'Zendesk CSV analysis',
    'support ticket deflection snapshot',
  ],
});

// Conversion pages should not surface in organic search, they're always
// reached via the marketing page or a direct outreach link. noindex prevents
// Google from ranking the intake form for unrelated queries.
export const metadata: Metadata = {
  ...baseMetadata,
  robots: { index: false, follow: false },
};

export default function IntakeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
