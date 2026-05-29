# Plan: Compact the landing-page calculator

## Why this slice exists

The support-ticket-deflection landing page now embeds the leaky-bucket
calculator after the cost section, but the full calculator presentation is too
large in that context. The calculator should support the cost claim without
overpowering the page or creating oversized spacing between sections.

## Scope (this PR)

Slice phase: Product polish

1. Add a compact presentation mode to the shared `SupportTaxCalculator`.
2. Use compact mode only on the public landing-page embed.
3. Reduce the vertical section padding around the embedded calculator.
4. Leave the standalone `/calculator` route and `/demo` calculator instance
   full-size.

### Files touched

- `web/plans/PR-Compact-Landing-Calculator.md` — this plan doc.
- `web/src/components/deflection-demo/SupportTaxCalculator.tsx` — compact presentation prop and size classes.
- `web/src/components/landing/DeflectionLandingPage.tsx` — pass compact mode and use tighter calculator section spacing.

## Mechanism

`SupportTaxCalculator` gains an optional `compact` boolean prop. The math,
state, labels, CTA destination, and output values stay unchanged. Compact mode
only changes spacing and type scale: smaller shell padding, tighter header and
grid gaps, smaller input/output card padding, and a reduced annual-leak metric.

`DeflectionLandingPage` passes `compact` for the embedded calculator and uses a
dedicated calculator section class instead of the global `section-band`, cutting
the vertical padding for this one embed while leaving the rest of the landing
page rhythm unchanged.

## Intentional

- No copy changes in this slice.
- No calculator math changes.
- The standalone calculator and demo route keep the larger layout because there
  the calculator is the primary surface, not supporting evidence in a landing
  page.
- No global `.section-band` change; that would affect unrelated sections and
  pages.

## Deferred

- Further calculator copy alignment.
- Moving the demo/calculator order or changing the broader page sequence.
- Parked hardening: none

## Verification

- `rg -n "<SupportTaxCalculator|function SupportTaxCalculator|export function SupportTaxCalculator" web/src` — confirmed compact mode is passed only by the landing-page embed; the standalone calculator and demo route keep the default full-size call.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed; `/systems/support-ticket-deflection`, `/calculator`, and `/demo` prerendered successfully.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` — desktop and 390px mobile loaded without framework overlay, had page content, reported no browser errors, and had no horizontal overflow. The calculator section now reports `64px` desktop padding and `48px` mobile padding, down from the global `section-band` rhythm.
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~75 |
| Calculator compact presentation classes | ~80 |
| Landing embed spacing/prop | ~4 |
| Total | ~160 |

Well under the 400-LOC soft cap.
