## Why this slice exists

Issue #206 calls out three remaining conversion-polish gaps on the free
Deflection Snapshot results page after the broader redesign landed. The
assisted-contact slider caps below realistic high-stakes support costs, the
same top-five questions appear twice across the ranked list and SEO phrase
section, and the strongest cost contrast is separated from the $1,500 unlock
price. This slice keeps the current card structure and claims doctrine intact
while making the snapshot offer sharper and more internally consistent.

## Scope (this PR)

Slice phase: Product polish

1. Raise the assisted-contact cost control above $50 while preserving the $13.50
   default benchmark and the existing min/step behavior.
2. Remove the duplicate standalone top-five SEO phrase list while preserving the
   SEO-targeting framing and no-volume/rank/traffic disclaimer.
3. Place the slider-driven annual run-rate adjacent to the $1,500 checkout price
   so the report price is compared against the same estimated support-tax value
   already shown in the projection panel.

### Files touched

- `web/plans/PR-Deflection-Results-Snapshot-Polish.md` - plan contract for this slice.
- `web/src/components/landing/DeflectionResultsPage.tsx` - slider range, SEO phrase framing, and annual-run-rate-to-price presentation.

## Mechanism

`SupportTaxProjection` already computes the batch, normalized monthly, annual,
and three-year run-rate values from `repeatTicketCount`, `sourceWindow`, and the
slider-controlled `assistedContactCost`. This slice raises
`ASSISTED_CONTACT_COST_MAX` to `$75` and computes the same annual estimate in
the parent component from `summary.repeat_ticket_count`, `sourceWindow`, and
`assistedContactCost`, so the checkout card can render the slider-driven value
next to the one-time `$1,500` price without introducing new state.

The standalone help-desk SEO targeting section is removed to avoid rendering the
same five top questions twice. The ranked question cards keep the existing
`target phrase from your tickets` line, and the "In your full report" box keeps
the complete phrase-list deliverable plus no-rank/traffic positioning.

## Intentional

- This does not change checkout behavior, API calls, snapshot parsing, or paid
  artifact gating.
- The annual cost remains slider-driven and visibly estimated; no hardcoded
  scare number is introduced.
- The standalone SEO section is removed only to avoid duplicate rows; the SEO
  targeting deliverable remains represented in the ranked cards and full-report
  bullets.

## Deferred

Further offer experiments, alternate price anchoring, or checkout-flow changes
remain separate follow-up slices.

Parked hardening: none

## Verification

1. `npm --prefix web run lint` - passed.
2. `npm --prefix web run build` - passed.
3. `rg -n "ASSISTED_CONTACT_COST_MAX = 40|These are the phrases customers already use|One-time payment|No bought keyword data or rank claims|\\$40</span>" web/src/components/landing/DeflectionResultsPage.tsx` - passed with no matches.
4. Browser check with `agent-browser` on `/systems/support-ticket-deflection/results/00000000-0000-4000-8000-000000000000` using local demo fixture fallback - passed; desktop render had no framework overlay, no horizontal overflow, one SEO-targeting section, stale duplicate phrase heading absent, slider max `75`, annual estimate and one-time report price present, and setting the cost input to `75` updated both the support-tax and annual estimate values.
5. Mobile browser check at 390px - passed; no framework overlay, no horizontal overflow, slider max `75`, and annual/price copy present.
6. `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Section | Size |
|---|---|
| web/plans/PR-Deflection-Results-Snapshot-Polish.md | ~65 lines added |
| web/src/components/landing/DeflectionResultsPage.tsx | ~140 lines modified |
| Total | ~220 |
