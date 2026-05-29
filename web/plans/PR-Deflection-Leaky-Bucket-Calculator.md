# Plan: Deflection leaky bucket calculator

## Why this slice exists

The current `/systems/support-ticket-deflection/calculator` page is a smaller
"Support Tax" estimate. The operator-provided
`SEO-Ticket-Deflection-Template-Docs/leaky-bucket-calculator.html` defines a
stronger calculator frame: repeated tickets leak budget through context
assembly, burnout/attrition, and reclaimable self-service opportunity. This
slice aligns the in-app calculator with that leaky-bucket model and the current
landing-page offer.

## Scope (this PR)

Slice phase: Product polish

1. Revoice the calculator page and metadata around the leaky-bucket support cost
   frame.
2. Replace the current single-output support-tax calculator with a compact
   React version of the leaky-bucket model: context assembly leak, attrition tax,
   and self-service opportunity.
3. Add a clear intake CTA from the calculator to the free Deflection Snapshot.
4. Leave global navigation/footer behavior, landing-page placement, demo
   placement, and intake form behavior unchanged.

### Files touched

- `web/plans/PR-Deflection-Leaky-Bucket-Calculator.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/calculator/layout.tsx` — calculator metadata copy.
- `web/src/app/systems/support-ticket-deflection/calculator/page.tsx` — calculator page headline/body copy.
- `web/src/components/deflection-demo/SupportTaxCalculator.tsx` — leaky-bucket calculator model, UI copy, outputs, and CTA.

## Mechanism

Use the standalone HTML calculator as the model reference, then implement the
same three-budget-leak framing inside the existing `SupportTaxCalculator`
component. The React component keeps local slider state, derives outputs from a
single calculation block, and routes the CTA to
`/systems/support-ticket-deflection/intake`.

## Intentional

The calculator remains an estimate from user-entered assumptions, not a promise
of savings or ticket reduction. The disclaimer says it is not a forecast of what
the report will save.

The standalone template supports multiple presets and many advanced assumptions.
This slice keeps one focused B2B SaaS model to avoid shipping an oversized port
before the page is aligned to the offer.

The existing global navigation and footer remain in place. The operator flagged
funnel distractions, but that should be handled as a separate route-chrome slice
so calculator math/copy changes stay reviewable.

## Deferred

Adding the calculator to the landing page, adding the demo to the landing page,
full standalone-template parity, global navigation/footer removal, and broader
funnel exit cleanup remain out of scope.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "Support Tax Calculator|What are repeat tickets costing you|cost per Tier-1 ticket|ready-to-publish|AI|leaky bucket|Leaky Bucket|free Deflection Snapshot" web/src/app/systems/support-ticket-deflection/calculator web/src/components/deflection-demo/SupportTaxCalculator.tsx web/plans/PR-Deflection-Leaky-Bucket-Calculator.md` — confirmed the old active calculator title/copy is gone and the leaky-bucket language plus free snapshot CTA appear in active source.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection/calculator` on the existing local dev server — page loaded, framework error overlay check returned `OK`, the leaky-bucket headline and CTA render, and `agent-browser errors` returned no page errors.
- Calculator interaction check — changed monthly ticket volume from `3000` to `6000`; the annual visible leak output updated from `$316,622` to `$520,543`.
- Mobile browser check at 390px width — calculator page renders without horizontal overflow; `agent-browser errors` returned no page errors.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~86 |
| Calculator metadata/page copy | ~14 |
| Calculator component | ~320 |
| Total | ~420 |

This exceeds the 400-LOC soft cap because the calculator component changes from a
single-output support-tax estimate to the three-output leaky-bucket model in one
reviewable surface. Splitting the math and UI would leave the calculator in a
half-aligned state.
