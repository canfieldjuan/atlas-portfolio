import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

const baseMetadata = generatePageMetadata({
  title: 'Resolution Audit Intake',
  description:
    'Upload a support-ticket export to start the deterministic Resolution Audit intake.',
  path: '/systems/support-ticket-deflection/intake',
  keywords: [
    'Resolution Audit intake',
    'support ticket CSV upload',
    'support ticket audit intake',
    'support ticket cost exposure',
    'support ticket CSV audit',
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
