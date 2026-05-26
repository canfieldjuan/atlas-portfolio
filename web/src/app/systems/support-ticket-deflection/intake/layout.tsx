import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

const baseMetadata = generatePageMetadata({
  title: 'Upload Your CSV — Deflection Snapshot Intake',
  description:
    'Upload a CSV export of your last 3–6 months of closed support tickets. We will send back a free Deflection Snapshot in 24 hours: repeat questions, customer wording, and one sample self-service answer.',
  path: '/systems/support-ticket-deflection/intake',
  keywords: [
    'Deflection Snapshot intake',
    'support ticket CSV upload',
    'support ticket deflection intake',
    'Zendesk CSV analysis',
    'support ticket deflection snapshot',
  ],
});

// Conversion pages should not surface in organic search — they're always
// reached via the marketing page or a direct outreach link. noindex prevents
// Google from ranking the intake form for unrelated queries.
export const metadata: Metadata = {
  ...baseMetadata,
  robots: { index: false, follow: false },
};

export default function IntakeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
