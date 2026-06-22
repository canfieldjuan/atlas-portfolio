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

// Partner-priced twin of the public wedge (D-025): keeps the legacy
// design-partner offer copy while sharing the public page structure. This URL is
// shared only in outbound (never linked from the public page); the noindex in
// layout.tsx keeps the partner funnel out of search.
const partnerPricingCopyById = {
  snapshot: {
    title: 'Deflection Snapshot',
    description:
      'Upload your last 30 days of tickets. We send back enough to show you the pattern: the repeat questions, customer wording, and one self-service answer so you can see if the full report is worth doing.',
    includes: [
      'Your top 5 repeat questions, ranked by how often they were asked',
      'Customer wording examples',
      '1 sample self-service answer',
      'No card required, no contract',
    ],
    note: 'The free snapshot proves whether the pattern is there. It is not the full report.',
    cta: 'Get the free snapshot',
  },
  'full-report': {
    title: 'Full Deflection Report',
    description:
      'For the first 30 day batch. We turn the repeat questions into a full Support Ticket Deflection Report your team can use to decide what to fix and publish first.',
    includes: [
      'Every recurring question, ranked by how often it was asked (typically 50+)',
      'Customer wording clusters, the long-tail keywords needed to rank',
      "A drafted, publishable answer for every gap your tickets already solve, your team's own resolved replies, 100% deterministic, no AI",
      'A "no proven answer yet" list, the frequent questions you have not cracked',
      'Priority ranking and source ticket IDs on every finding',
    ],
    note: 'This is the paid version of the work: enough detail to actually update the help center.',
    cta: 'Start the full report',
  },
  'quarterly-refresh': {
    includes: [
      'Full Deflection Report every 90 days',
      'What changed since the last report',
      'Questions that are still coming back',
      'New self-service answers to review and publish',
      'Cancel any time after the next report',
    ],
  },
} satisfies Partial<Record<string, Partial<DiagnosticPricingTier>>>;

function partnerPricingTiers(
  hasPartnerAccess: boolean,
  intakeHref: string,
): DiagnosticPricingTier[] {
  return pricingTiers.map((tier) => {
    const partnerTier = { ...tier, ...partnerPricingCopyById[tier.id] };
    if (tier.id !== 'full-report') return { ...partnerTier, href: intakeHref };
    if (!hasPartnerAccess) {
      return {
        ...partnerTier,
        price: DEFLECTION_DEFAULT_PRICE_VARIANT.priceLabel,
        href: '/systems/support-ticket-deflection/intake',
      };
    }
    return {
      ...partnerTier,
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
      title: 'Start with the snapshot. Upgrade when the repeat pattern is clear.',
      description:
        'The free snapshot shows whether your tickets contain enough repeated questions to justify the full report. If the pattern is real, the full report gives your team the ranked questions, customer wording, documentation gaps, source evidence, and review-ready drafts to publish first.',
      tiers: partnerPricingTiers(hasPartnerAccess, intakeHref),
    },
  };
  return <DeflectionLandingPage config={partnerConfig} />;
}
