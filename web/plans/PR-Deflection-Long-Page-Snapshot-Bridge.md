## Why this slice exists

atlas-portfolio#197 now has a short, additive Snapshot landing page, and
PR-Deflection-Snapshot-Offer-Focus explicitly deferred traffic routing from the
long deflection page to that shorter offer.

The public systems entry points already send visitors to the Snapshot route, but
the long `/systems/support-ticket-deflection` page still asks qualified visitors
to skip straight to intake from the hero and final CTA. This slice makes the
long page support the same Snapshot-first positioning without replacing the long
page or removing the direct intake path available in pricing.

## Scope (this PR)

Slice phase: Product polish

1. Route the long page hero CTA to
   `/systems/support-ticket-deflection/snapshot`.
2. Route the long page final CTA and footer CTA to the same Snapshot offer
   through the existing shared final CTA config.
3. Reword those CTA labels so they sell the free Snapshot offer, not an
   immediate upload step.
4. Preserve the long page route, Snapshot route, intake route, pricing cards,
   checkout, results, smoke scripts, and page implementation.

### Files touched

- `web/plans/PR-Deflection-Long-Page-Snapshot-Bridge.md`
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx`

## Mechanism

`landingConfig-v2.tsx` already centralizes the long page hero and final CTA
config. This slice adds a local Snapshot route constant and points only those
two top-level CTAs at it. The pricing tiers still come from the shared
`landingConfig` module, so deeper pricing-card CTAs continue to point directly
to intake for visitors who choose to upload from the long page.

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

## Deferred

- A/B testing, canonical-route decisions, and retiring the long page remain out
  of scope.
- Broader visual redesign of the long page remains out of scope.
- Parked hardening: none.

## Verification

Run before push:

- `rg -n "const SNAPSHOT_HREF|href: SNAPSHOT_HREF|See the free Deflection Snapshot" web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx web/plans/PR-Deflection-Long-Page-Snapshot-Bridge.md -S` - passed
- `npm --prefix web run lint` - passed
- `npm --prefix web run build` - passed
- Browser check of `/systems/support-ticket-deflection` at 127.0.0.1:3102 desktop and 390x844 mobile - passed; page rendered content, no Next.js error overlay appeared, and all three visible `See the free Deflection Snapshot` links pointed to `/systems/support-ticket-deflection/snapshot`.
- `bash scripts/local_pr_review.sh` - passed

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~68 |
| CTA config update | ~7 |
| Total | ~85 |
