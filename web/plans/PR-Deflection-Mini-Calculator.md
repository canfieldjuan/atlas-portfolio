# Plan: Deflection mini calculator

## Why this slice exists

The support-ticket landing page currently embeds the full leaky-bucket
calculator immediately after the cost section. That calculator is useful for
budget owners, but it asks for too much before a general visitor has seen the
mechanism or the report demo. The landing page needs a smaller cost-personalizing
calculator while the full calculator remains available as the deeper executive
asset.

## Scope (this PR)

Slice phase: Product polish

1. Add a compact two-input Support Tax mini calculator based on the existing
   30-second calculator artifact.
2. Replace only the landing-page inline calculator with the mini calculator.
3. Keep the full `/systems/support-ticket-deflection/calculator` page unchanged.
4. Preserve existing page copy outside the calculator swap.

### Files touched

- `HARDENING.md` - parked sibling calculator input-resync follow-up.
- `web/plans/PR-Deflection-Mini-Calculator.md` - this plan doc.
- `web/src/components/deflection-demo/SupportTaxMiniCalculator.tsx` - new compact calculator component.
- `web/src/components/landing/DeflectionLandingPage.tsx` - swap the inline landing embed to the mini calculator.

## Mechanism

The new component is client-side and uses the same simplified math as the
30-second support-tax artifact:

- monthly repeat volume = monthly ticket volume * 40%
- monthly support tax = repeat volume * cost per ticket
- annual support tax = monthly support tax * 12
- monthly hours wasted = repeat volume * 0.2

It exposes two inputs, monthly ticket volume and fully loaded cost per Tier-1
ticket, and links to both the full calculator and the intake flow. The existing
full `SupportTaxCalculator` remains in place for the standalone calculator route
and demo route.

## Intentional

- No landing section copy is rewritten in this slice; only the inline calculator
  component changes.
- The mini calculator remains directional and uses fixed assumptions so it does
  not become a full ROI model.
- The raw standalone HTML artifact is left untouched and uncommitted.

## Deferred

- A dedicated simple-calculator route is deferred until we decide whether the
  mini calculator should be public SEO material or outreach-only collateral.
- No outreach CSVs or campaign assets are updated in this slice.
- Existing sibling calculator input resync hardening is parked in
  `HARDENING.md` as `DEFLECTION-CALC-INPUT-RESYNC-1`.

Parked hardening: DEFLECTION-CALC-INPUT-RESYNC-1.

## Verification

- `npm --prefix web run lint` - passed.
- `git diff --check` - passed.
- `rg -n "SupportTaxCalculator|SupportTaxMiniCalculator" web/src/components/landing/DeflectionLandingPage.tsx web/src/app/systems/support-ticket-deflection/calculator/page.tsx web/src/app/systems/support-ticket-deflection/demo/page.tsx` - confirmed the landing page imports/renders `SupportTaxMiniCalculator`, while the standalone calculator and demo routes still import/render `SupportTaxCalculator`.
- Review fix: the mini calculator includes the same explicit "not a forecast"
  disclaimer pattern used by the other calculator surfaces.
- Review fix: blank or invalid mini-calculator number inputs restore the previous
  visible value on blur, matching the existing full-calculator input pattern.
- Review fix: out-of-range mini-calculator number inputs write the clamped value
  back to the visible input even when the clamped state update is a no-op.
- `bash scripts/local_pr_review.sh` - passed. This ran the plan-doc audit bundle,
  cross-session drift audit, `npm --prefix web run lint`,
  `npm --prefix web run build`, and `git diff --check`.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Hardening entry | ~9 |
| Plan doc | ~75 |
| Mini calculator component | ~261 |
| Landing embed swap | ~4 |
| **Total** | ~349 |
