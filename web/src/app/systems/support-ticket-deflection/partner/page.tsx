'use client';

import { type DiagnosticPricingTier } from '@/components/landing/LandingPrimitives';
import {
  DiagnosticReportLandingPage,
} from '@/components/landing/DiagnosticReportLandingPage';
import { landingPageConfig, pricingTiers } from '../landingConfig';

// Partner-priced twin of the public wedge (D-025): identical in every section
// except the Full Deflection Report is $1,000 for the first 5 design partners.
// This URL is shared only in outbound (never linked from the public page); the
// noindex in layout.tsx keeps the $1,000 price out of search. Reuses the shared
// landingConfig so wedge copy edits propagate here automatically — no drift.
const partnerPricingTiers: DiagnosticPricingTier[] = pricingTiers.map((tier) =>
  tier.id === 'full-report'
    ? {
        ...tier,
        price: '$1,000',
        badge: 'FIRST 5 DESIGN PARTNERS',
        note: 'Partner price for the first 5 design partners — early teams that collaborate on direction and are OK sharing anonymized patterns as a case study.',
      }
    : tier,
);

const partnerConfig = {
  ...landingPageConfig,
  pricing: { ...landingPageConfig.pricing, tiers: partnerPricingTiers },
};

export default function SupportTicketDeflectionPartnerPage() {
  return <DiagnosticReportLandingPage config={partnerConfig} />;
}
