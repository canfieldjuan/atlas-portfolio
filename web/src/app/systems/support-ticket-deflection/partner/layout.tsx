import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo';

const baseMetadata = generatePageMetadata({
  title: 'Support Ticket Deflection, Design Partner',
  description:
    'Design-partner access to the Support Ticket Deflection Report. Upload 30 days of closed support tickets; we send back a free Deflection Snapshot in 24 hours, and the full report is $1,000 for the first 5 design partners.',
  path: '/systems/support-ticket-deflection/partner',
  keywords: [
    'support ticket deflection design partner',
    'support ticket deflection report',
    'support ticket deflection partner pricing',
  ],
});

// The partner URL is shared only in outbound (D-025) and must not surface in
// search, noindex keeps the $1,000 design-partner price out of organic results.
export const metadata: Metadata = {
  ...baseMetadata,
  robots: { index: false, follow: false },
};

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
