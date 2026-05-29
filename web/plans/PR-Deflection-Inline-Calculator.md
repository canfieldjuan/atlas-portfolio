# Plan: Embed the leaky-bucket calculator on the landing page

## Why this slice exists

The calculator has been aligned to the current leaky-bucket offer, but the public
landing page still sends buyers away to use it. The operator wants to see how the
calculator reads when it is embedded directly in the page. This slice adds it in
the highest-context spot: immediately after "What It Costs," where buyers are
already thinking about repeat-ticket budget leak.

## Scope (this PR)

Slice phase: Product polish

1. Add an optional calculator flag to the deflection landing-page config.
2. Render the existing `SupportTaxCalculator` inline after the cost section.
3. Remove the public cost-section calculator text link so the page does not show
   both an embedded calculator and a duplicate route link.
4. Leave calculator math, standalone calculator route, intake behavior, demo
   placement, pricing, and FAQ behavior unchanged.
5. Preserve the partner page's no-calculator behavior by opting it out of the
   public inline calculator block.

### Files touched

- `web/plans/PR-Deflection-Inline-Calculator.md` — this plan doc.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — enable the inline calculator and stop passing the calculator link into the cost copy.
- `web/src/app/systems/support-ticket-deflection/partner/page.tsx` — opt the partner funnel out of the inline calculator.
- `web/src/components/landing/DeflectionLandingPage.tsx` — render the inline calculator when configured.

## Mechanism

`DeflectionLandingPageConfig` gains an optional `calculator` flag. The landing
component imports the existing `SupportTaxCalculator` client component and
renders it between the problem-cost section and the current-way comparison when
`config.calculator` is true. The calculator remains the same component used by
the standalone `/calculator` route, so this slice changes page placement only.
The partner page explicitly sets `calculator: undefined` so the public-page
experiment does not change the partner funnel.

## Intentional

- The calculator sits after "What It Costs," not under the demo, because it
  quantifies the cost leak rather than proving the report artifact.
- The standalone `/systems/support-ticket-deflection/calculator` route remains
  available for direct access and sitemap traffic.
- The public landing page no longer renders the "Run the numbers on your own
  volume" text link because the calculator is now already on-page.
- The embedded calculator still has its own CTA to the Deflection Snapshot
  intake; this keeps the calculator tied to the offer.

## Deferred

- Final decision on whether the embedded calculator stays after visual review.
- Moving the demo near the offer section or rebuilding the demo artifact to match
  the generated report shape.
- Any route-chrome changes for calculator, intake, demo, or partner subroutes.
- Parked hardening: none

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; `/systems/support-ticket-deflection`
  still prerenders.
- `git diff --check` — passed.
- `rg -n "makeProblemCost\\('/systems/support-ticket-deflection/calculator'\\)|Run the numbers on your own volume|LEAKY BUCKET CALCULATOR|calculator: undefined|SupportTaxCalculator" web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx web/src/app/systems/support-ticket-deflection/partner/page.tsx web/src/components/landing/DeflectionLandingPage.tsx web/plans/PR-Deflection-Inline-Calculator.md` — confirmed the old public `makeProblemCost('/systems/support-ticket-deflection/calculator')` call is gone, the partner opt-out is present, and the inline calculator render is present.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` —
  no framework overlay, no page errors, and the inline calculator renders after
  "What It Costs" with no duplicate wrapper heading.
- Link-surface browser check — landing-page links are intake CTAs only after the
  calculator is embedded; the previous calculator route link is no longer
  rendered.
- Calculator interaction check — keyboarding the monthly-ticket slider updates
  the visible annual leak total from `$316,622` to `$527,340`.
- Mobile browser check at 390px — inline calculator renders without horizontal
  overflow and `agent-browser errors` returned no page errors.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~70 |
| Landing config calculator flag | ~3 |
| Partner opt-out | ~2 |
| Landing component section | ~20 |
| Total | ~95 |

Well under the 400-LOC soft cap.
