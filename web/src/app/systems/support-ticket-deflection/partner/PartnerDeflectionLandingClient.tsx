'use client';

import {
  type DiagnosticFaqItem,
  type DiagnosticPricingTier,
} from '@/components/landing/LandingPrimitives';
import { DeflectionLandingPage } from '@/components/landing/DeflectionLandingPage';
import {
  DEFLECTION_PARTNER_PRICE_VARIANT,
  DEFLECTION_PRICE_UNAVAILABLE_LABEL,
} from '@/lib/deflection-pricing';
import { landingPageConfigV2, makeProblemAgitation, makeProblemCost } from '../landingConfig-v2';
import { pricingFaqs, pricingTiers } from '../landingConfig';

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
const partnerPricingCopyById: Record<string, Partial<DiagnosticPricingTier>> = {
  snapshot: {
    title: 'Deflection Snapshot',
    description:
      'Upload your last 30 days of tickets. We send back enough to show you the pattern: the repeat questions, customer wording, and one review-ready answer when your tickets contain resolution evidence.',
    includes: [
      'Your top 5 repeat questions, ranked by how often they were asked',
      'Customer wording examples',
      '1 review-ready answer when your tickets contain resolution evidence',
      'No card required, no contract',
    ],
    note: 'The free snapshot is the gate. It shows whether the pattern is there before you commit to the full report.',
    cta: 'Get the free snapshot',
  },
  'full-report': {
    title: 'Full Deflection Report',
    description:
      'For the first 30-day batch. We turn the repeat questions into a full Deflection Report your team can use to decide what to fix and publish first.',
    includes: [
      'Every recurring question, ranked by how often it was asked (typically 50+)',
      'Customer wording clusters and self-service title targets',
      "A review-ready draft for every gap your tickets already solve, using your team's resolved replies",
      'A "no proven answer yet" list, the frequent questions you have not cracked',
      'Priority ranking and source ticket IDs on every finding',
    ],
    note: 'This is the paid expansion: enough detail to actually update the help center.',
    cta: 'Start the full report',
  },
  'quarterly-refresh': {
    includes: [
      'Full Deflection Report every 90 days',
      'What changed since the last report',
      'Questions that are still coming back',
      'New review-ready answers to review and publish',
      'Cancel any time after the next report',
    ],
    note: 'Best after the first full Deflection Report proves the work is useful.',
  },
};

const partnerFaqCopyByQuestion: Record<string, DiagnosticFaqItem> = {
  'What do I get in the free Snapshot?': {
    q: 'What do I get in the free Deflection Snapshot?',
    a: 'You get your top 5 repeat questions ranked from your ticket history, examples of the exact customer wording, and one review-ready answer when your tickets contain resolution evidence. It is enough to show whether the repeat pattern is real before you pay for the full report. It is not the full report.',
  },
  'What do I get in the full Resolution Audit?': {
    q: 'What do I get in the full Deflection Report?',
    a: 'You get the working list: every recurring question ranked by volume, customer wording clusters, documentation gaps, source ticket IDs, review-ready drafts for gaps your tickets already solve, and a "no proven answer yet" list for frequent questions without enough answer evidence.',
  },
  'Do we have to sign up for quarterly reports?': {
    q: 'Do we have to sign up for quarterly reports?',
    a: 'No. Start with the free Deflection Snapshot. If it shows a useful repeat-question pattern, you can pay for the full Deflection Report. Quarterly refreshes are only for teams that want to keep updating the help center as new repeat questions appear.',
  },
};

function partnerPricingFaqs(): DiagnosticFaqItem[] {
  return pricingFaqs.map((faq) => partnerFaqCopyByQuestion[faq.q] ?? faq);
}

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
        href: '/systems/support-ticket-deflection/intake',
      };
    }
    return {
      ...partnerTier,
      price: DEFLECTION_PRICE_UNAVAILABLE_LABEL,
      standardPriceSource: undefined,
      atlasPriceVariant: DEFLECTION_PARTNER_PRICE_VARIANT.id,
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
  const partnerFaqItems = partnerPricingFaqs();
  const partnerHero = {
    ...landingPageConfigV2.hero,
    eyebrow: 'DESIGN PARTNER ACCESS',
    title: 'See whether your repeat tickets justify a full Deflection Report.',
    intro:
      'Upload 30 days of closed tickets and get a free Deflection Snapshot that shows the repeat pattern, customer wording, and one review-ready answer when your tickets contain resolution evidence.',
    body:
      'If the pattern is strong, the partner-priced full Deflection Report expands the audit into a ranked, source-backed action queue of questions, answers, and no-proven-answer gaps. If the data is thin, you know before committing.',
    cta: partnerSnapshotCta,
  };
  const partnerFinalCta = {
    ...landingPageConfigV2.finalCta,
    label: 'START WITH THE FREE SNAPSHOT',
    title: 'Use the Snapshot as the gate.',
    body: [
      'The free Deflection Snapshot shows whether your ticket history contains enough repeated questions to justify a full Deflection Report.',
      'If the data warrants it, the partner-priced report turns your ticket history into a ranked, source-backed action queue. It does not promise guaranteed savings; it promises a usable audit trail.',
    ],
    cta: partnerSnapshotCta,
  };
  const partnerConfig = {
    ...landingPageConfigV2,
    structuredData: undefined,
    hero: partnerHero,
    finalCta: partnerFinalCta,
    problemAgitation: makeProblemAgitation(),
    problemCost: makeProblemCost(),
    calculator: undefined, // keep the partner funnel focused on the partner offer
    pricing: {
      ...landingPageConfigV2.pricing,
      title: 'Start with the snapshot. Upgrade when the repeat pattern is clear.',
      description:
        'The free Deflection Snapshot shows whether your tickets contain enough repeated questions to justify the full Deflection Report. If the pattern is real, the full report gives your team the ranked questions, customer wording, documentation gaps, source evidence, and review-ready drafts to publish first.',
      tiers: partnerPricingTiers(hasPartnerAccess, intakeHref),
    },
    faq: {
      ...landingPageConfigV2.faq,
      items: partnerFaqItems,
    },
  };
  return <DeflectionLandingPage config={partnerConfig} />;
}
