# Plan: Embed the deflection demo on the public landing page

## Why this slice exists

The public support-ticket-deflection landing page explains the report, the cost
leak, and the offer, but it does not let the buyer try the existing interactive
demo in the main funnel. The separate `/demo` route exists, but linking away from
the landing page would add another off-ramp. This slice brings the demo into the
page instead.

## Scope (this PR)

Slice phase: Product polish

1. Add a focused demo section to the v2 landing config.
2. Render the existing `DeflectionDemo` component inline after the mechanism
   section, before the offer section.
3. Keep the landing page's exit paths unchanged: intake CTAs plus the existing
   calculator link only.

### Files touched

- `web/plans/PR-Deflection-Inline-Demo.md` — this plan doc.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — add demo section copy.
- `web/src/components/landing/DeflectionLandingPage.tsx` — render the inline demo section.

## Mechanism

`DeflectionLandingPageConfig` gains a `demo` block with `label`, `title`, and
`description`. The shared landing component imports `DeflectionDemo` and renders
that block between the mechanism pipeline and the offer section. The existing
demo component owns its own input, chips, states, and sample-result rendering, so
this slice only composes it into the landing page.

## Intentional

- The separate `/systems/support-ticket-deflection/demo` route remains available
  for direct access and sitemap traffic, but this slice does not add a new link
  to it from the landing page.
- The demo stays sample-backed and visibly illustrative. This slice does not
  change search data, Atlas wiring, demo labels, or result behavior.
- The calculator remains a link instead of an inline embed. The operator called
  it out as the one acceptable path away from the landing page.

## Deferred

- Changing or removing the separate demo route.
- Wiring the demo to live Atlas-backed public data.
- Reworking the demo result badge once live data is enabled. Existing parked
  hardening considered but not promoted: `DEFLECTION-BADGE-1 — result badge is a static "Illustrative · sample dataset"`.
- Any further calculator placement or route-chrome changes.
- Parked hardening: none

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; `/systems/support-ticket-deflection`
  still prerenders.
- `git diff --check` — passed.
- `rg -n "systems/support-ticket-deflection/demo|href=|href:" web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx web/src/components/landing/DeflectionLandingPage.tsx` — confirmed no new outbound demo link; active landing links remain the existing calculator href plus intake CTAs.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` —
  no framework overlay, the inline demo section renders, and `agent-browser
  errors` returned no page errors.
- Interaction check — clicking the `export attribution reports` chip fills the
  demo input and renders the sample result.
- Desktop and 390px mobile overflow checks — no horizontal overflow.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~65 |
| Landing config demo copy | ~10 |
| Landing component section | ~35 |
| Total | ~110 |

Well under the 400-LOC soft cap.
