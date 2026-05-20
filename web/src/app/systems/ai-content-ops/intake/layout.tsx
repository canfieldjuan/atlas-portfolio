import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

const baseMetadata = generatePageMetadata({
  title: 'Upload Your CSV — FAQ Snapshot Intake',
  description:
    'Upload a CSV export of your last 90 days of closed support tickets. We will send back a free FAQ Snapshot in 24 hours: repeat questions, customer wording, and one sample FAQ entry.',
  path: '/systems/ai-content-ops/intake',
  keywords: [
    'FAQ Snapshot intake',
    'support ticket CSV upload',
    'AI help doc generator intake',
    'Zendesk CSV analysis',
    'help center gap analysis intake',
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
