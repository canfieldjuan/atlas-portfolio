import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

const baseMetadata = generatePageMetadata({
  title: 'Send Your CSV — The Gap Report Intake',
  description:
    'Upload a CSV export of your last 90 days of closed support tickets. We will send back the full Gap Report in 48 hours — ranked questions, gap callouts, deflection math, and 3 publish-ready FAQ drafts.',
  path: '/systems/ai-content-ops/intake',
  keywords: [
    'Gap Report intake',
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
