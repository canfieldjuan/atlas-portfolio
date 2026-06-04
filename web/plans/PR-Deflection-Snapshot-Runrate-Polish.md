## Why this slice exists

Issue #206 asks for three snapshot polish tweaks on the unpaid deflection
results page: give the assisted-contact slider enough headroom, avoid repeating
the same top-five questions as a separate SEO list, and make the annual
run-rate visibly adjacent to the one-time report price without salesy alarm
styling. Current `main` already has the slider max at `$75`, so this slice
focuses the remaining work on copy/layout polish that keeps the existing card
structure and all cost hedges intact.

## Scope (this PR)

Slice phase: Product polish

1. Reword the ranked-question section so the top-five cards are explicitly the
   Help-desk SEO targeting list, not a second duplicated list.
2. Strengthen the offer panel's annual run-rate versus one-time report-price
   comparison while keeping the estimate slider-driven and hedged.
3. Keep `ASSISTED_CONTACT_COST_MAX = 75` unchanged because current `main`
   already satisfies the requested slider headroom.
4. Extend the hosted-results smoke marker contract to catch the new run-rate
   comparison copy on the unpaid snapshot page and its browser-upload wrapper
   fixture.

### Files touched

- `web/src/components/landing/DeflectionResultsPage.tsx` — unpaid snapshot copy/layout polish.
- `web/scripts/smoke-deflection-hosted-results.mjs` — hosted snapshot render marker.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` — hosted-results smoke fixture marker.
- `web/scripts/test-deflection-browser-upload-smoke.mjs` — browser-upload smoke fixture for hosted-results verification.
- `web/plans/PR-Deflection-Snapshot-Runrate-Polish.md` — this plan doc.

## Mechanism

The ranked-question section keeps one canonical `top_questions` render. The
section label still says `Help-desk SEO targeting list`, and the heading/copy
make clear those ranked rows already include target phrases from the uploaded
tickets and no volume/rank/traffic claims.

The offer panel keeps the existing `annualSupportTaxEstimate` calculation and
renders the slider-driven estimate directly above the one-time full-report
price. Copy stays explicitly hedged with `estimated`, `possibly`, current pace,
and the active assisted-contact cost. No hardcoded cost number is introduced.

## Intentional

- No snapshot payload parsing, checkout, paid report, ATLAS, or Stripe logic
  changes.
- No slider constant change because `ASSISTED_CONTACT_COST_MAX` is already
  `$75` on current `main`, matching the issue's suggested headroom.
- No alarm-red styling. The annual number uses size/weight and the existing
  restrained primary treatment.

## Deferred

- A larger snapshot page redesign remains out of scope; this keeps the current
  card structure.
- If future reports need a separate SEO export table, that should be a paid
  report section, not a second duplicated free top-five list.
- Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-hosted-results-smoke` — passed.
- `npm --prefix web run test:deflection-browser-upload-smoke` — passed.
- `rg -n "ASSISTED_CONTACT_COST_MAX = 75|This backlog at current pace|visible rows|one-time report price" web/src/components/landing/DeflectionResultsPage.tsx web/scripts` — passed with expected matches.
- `npm --prefix web run lint` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Snapshot copy/layout | ~45 |
| Smoke marker updates | ~15 |
| Plan doc | ~80 |
| Total | ~140 |
