## Why this slice exists

atlas-portfolio#197 now has a short, additive Snapshot landing page, and
PR-Deflection-Snapshot-Offer-Focus explicitly deferred traffic routing from the
long deflection page to that shorter offer.

The public systems entry points already send visitors to the Snapshot route, but
the long `/systems/support-ticket-deflection` page still asks qualified visitors
to skip straight to intake from the hero and final CTA. This slice makes the
long page support the same Snapshot-first positioning without replacing the long
page or removing the direct intake path available in pricing.

Review flagged the partner page as a shared-config inheritance edge: it spreads
`landingPageConfigV2`, so the public CTA change would otherwise leak into the
noindex partner funnel. This slice keeps that partner funnel intake-direct.

## Scope (this PR)

Slice phase: Product polish

1. Route the long page hero CTA to
   `/systems/support-ticket-deflection/snapshot`.
2. Route the long page final CTA and footer CTA to the same Snapshot offer
   through the existing shared final CTA config.
3. Reword those CTA labels so they sell the free Snapshot offer, not an
   immediate upload step.
4. Override the noindex partner page hero and final CTA back to the intake route
   so partner traffic does not leave the partner funnel.
5. Preserve the long page route, Snapshot route, intake route, pricing cards,
   checkout, results, smoke scripts, and page implementation.

### Files touched

- `web/plans/PR-Deflection-Long-Page-Snapshot-Bridge.md`
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx`
- `web/src/app/systems/support-ticket-deflection/partner/page.tsx`

## Mechanism

`landingConfig-v2.tsx` already centralizes the long page hero and final CTA
config. This slice adds a local Snapshot route constant and points only those
two top-level CTAs at it. The pricing tiers still come from the shared
`landingConfig` module, so deeper pricing-card CTAs continue to point directly
to intake for visitors who choose to upload from the long page.

The partner page already builds its own config object. This slice extends that
existing override pattern to replace `hero.cta` and `finalCta.cta` with the
original intake-direct Snapshot CTA while still inheriting the rest of the v2
copy.

No component shape changes are required because the existing `PrimaryCta`
primitive renders whatever `DiagnosticLandingCta` the config supplies.

## Intentional

- This does not redirect or delete `/systems/support-ticket-deflection`.
- This does not change any Snapshot page CTA; the Snapshot page still sends
  visitors to intake.
- This does not change pricing cards, checkout, results, ATLAS integration,
  smoke scripts, or no-chrome route behavior.
- The long page remains a deeper explanation page; this slice only aligns its
  first and final conversion paths with the Snapshot-first funnel.
- The partner page keeps inheriting v2 copy and pricing-card behavior, but its
  hero/final CTAs stay intake-direct.

## Deferred

- A/B testing, canonical-route decisions, and retiring the long page remain out
  of scope.
- Broader visual redesign of the long page remains out of scope.
- Parked hardening: none.

## Verification

Run before push:

- `rg -n "const SNAPSHOT_HREF|href: SNAPSHOT_HREF|See the free Deflection Snapshot|partnerSnapshotCta|GAP_REPORT_INTAKE_HREF" web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx web/src/app/systems/support-ticket-deflection/partner/page.tsx web/plans/PR-Deflection-Long-Page-Snapshot-Bridge.md -S` - passed
- `npm --prefix web run lint` - passed
- `npm --prefix web run build` - passed
- Browser check of `/systems/support-ticket-deflection` and `/systems/support-ticket-deflection/partner` at 127.0.0.1:3103 desktop and 390x844 mobile - passed; public long-page `See the free Deflection Snapshot` links pointed to `/systems/support-ticket-deflection/snapshot`, partner `Upload your tickets, get a free Deflection Snapshot` links stayed on `/systems/support-ticket-deflection/intake`, and no Next.js error overlay appeared.
- `bash scripts/local_pr_review.sh` - passed

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~87 |
| CTA config update | ~7 |
| Partner CTA override | ~9 |
| Total | ~108 |
