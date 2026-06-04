'use client';

import { type DiagnosticPricingTier } from '@/components/landing/LandingPrimitives';
import { DeflectionLandingPage } from '@/components/landing/DeflectionLandingPage';
import {
  DEFLECTION_DEFAULT_PRICE_VARIANT,
  DEFLECTION_PARTNER_PRICE_VARIANT,
} from '@/lib/deflection-pricing';
import { landingPageConfigV2, makeProblemAgitation, makeProblemCost } from '../landingConfig-v2';
import { pricingTiers } from '../landingConfig';

const PARTNER_TOKEN_PARAM = 'partnerToken';

function partnerIntakeHref(token: string | undefined) {
  const params = new URLSearchParams({
    priceVariant: DEFLECTION_PARTNER_PRICE_VARIANT.id,
    [PARTNER_TOKEN_PARAM]: token || '',
  });
  return `/systems/support-ticket-deflection/intake?${params.toString()}`;
}

// Partner-priced twin of the public wedge (D-025): identical to the rewritten
// landing except (1) the Full Deflection Report can be $1,000 for validated
// design-partner links, and (2) the embedded public calculator is omitted to
// keep the noindex partner funnel focused on the partner offer. This URL is
// shared only in outbound (never linked from the public page); the noindex in
// layout.tsx keeps the partner funnel out of search.
// Reuses landingPageConfigV2 + the shared pricingTiers so the rewritten wedge
// copy + pricing edits propagate here automatically, no drift.
function partnerPricingTiers(
  hasPartnerAccess: boolean,
  intakeHref: string,
): DiagnosticPricingTier[] {
  return pricingTiers.map((tier) => {
    if (tier.id !== 'full-report') return { ...tier, href: intakeHref };
    if (!hasPartnerAccess) {
      return {
        ...tier,
        price: DEFLECTION_DEFAULT_PRICE_VARIANT.priceLabel,
        href: '/systems/support-ticket-deflection/intake',
      };
    }
    return {
      ...tier,
      price: DEFLECTION_PARTNER_PRICE_VARIANT.priceLabel,
      href: intakeHref,
      badge: 'FIRST 5 DESIGN PARTNERS',
      note: 'Partner price for the first 5 design partners, early teams that collaborate on direction and are OK sharing anonymized patterns as a case study.',
    };
  });
}

export function PartnerDeflectionLandingClient({
  hasPartnerAccess,
  partnerToken,
}: {
  hasPartnerAccess: boolean;
  partnerToken?: string;
}) {
  const intakeHref = hasPartnerAccess
    ? partnerIntakeHref(partnerToken)
    : '/systems/support-ticket-deflection/intake';
  const partnerSnapshotCta = {
    label: 'Upload your tickets, get a free Deflection Snapshot',
    href: intakeHref,
  };
  const partnerConfig = {
    ...landingPageConfigV2,
    hero: { ...landingPageConfigV2.hero, cta: partnerSnapshotCta },
    finalCta: { ...landingPageConfigV2.finalCta, cta: partnerSnapshotCta },
    problemAgitation: makeProblemAgitation(),
    problemCost: makeProblemCost(),
    calculator: undefined, // keep the partner funnel focused on the partner offer
    pricing: {
      ...landingPageConfigV2.pricing,
      tiers: partnerPricingTiers(hasPartnerAccess, intakeHref),
    },
  };
  return <DeflectionLandingPage config={partnerConfig} />;
}
