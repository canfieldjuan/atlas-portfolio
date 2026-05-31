'use client';

import { type DiagnosticPricingTier } from '@/components/landing/LandingPrimitives';
import { DeflectionLandingPage } from '@/components/landing/DeflectionLandingPage';
import { landingPageConfigV2, makeProblemAgitation, makeProblemCost } from '../landingConfig-v2';
import { pricingTiers } from '../landingConfig';

// Partner-priced twin of the public wedge (D-025): identical to the rewritten
// landing except (1) the Full Deflection Report is $1,000 for the first 5 design
// partners, and (2) the embedded public calculator is omitted to keep the
// noindex partner funnel focused on the partner offer. This URL is shared only in
// outbound (never linked from the public page); the noindex in layout.tsx keeps
// the $1,000 price out of search.
// Reuses landingPageConfigV2 + the shared pricingTiers so the rewritten wedge copy
// + pricing edits propagate here automatically, no drift.
const partnerPricingTiers: DiagnosticPricingTier[] = pricingTiers.map((tier) =>
  tier.id === 'full-report'
    ? {
        ...tier,
        price: '$1,000',
        badge: 'FIRST 5 DESIGN PARTNERS',
        note: 'Partner price for the first 5 design partners, early teams that collaborate on direction and are OK sharing anonymized patterns as a case study.',
      }
    : tier,
);

const partnerConfig = {
  ...landingPageConfigV2,
  problemAgitation: makeProblemAgitation(),
  problemCost: makeProblemCost(),
  calculator: undefined, // keep the partner funnel focused on the partner offer
  pricing: { ...landingPageConfigV2.pricing, tiers: partnerPricingTiers },
};

export default function SupportTicketDeflectionPartnerPage() {
  return <DeflectionLandingPage config={partnerConfig} />;
}
