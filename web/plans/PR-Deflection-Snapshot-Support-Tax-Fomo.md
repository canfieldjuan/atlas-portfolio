## Why this slice exists

atlas-portfolio#196 says the Snapshot should feel like a valuable diagnostic:
repeat-ticket volume, benchmark cost, mined customer wording, answer-quality
proof, and locked follow-up value. The current short landing page already sells
the free Snapshot first, but its lower artifact panel still treats locked ranks
as a generic paywall note and labels the demo fixture only as representative.

This slice sharpens the Snapshot landing presentation so visitors understand
that the free Snapshot exposes enough pain and evidence to make the full report
decision obvious, while still keeping every number clearly framed as a
representative benchmark estimate.

## Scope (this PR)

Slice phase: Product polish

1. Reframe the cost band around a visible `Support Tax estimate` benchmark,
   not a savings promise.
2. Add locked-rank FOMO rows to the representative Snapshot artifact: rank,
   repeat-ticket count, and benchmark estimate stay visible while the question
   text stays withheld.
3. Tighten the representative demo labels to say `Representative labeled-synthetic support set`.
4. Preserve the Snapshot route, CTA destination, intake, results, checkout,
   smoke scripts, payload types, and pricing constants.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Support-Tax-Fomo.md`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`

## Mechanism

`DeflectionSnapshotLandingPage` already receives
`DEMO_DEFLECTION_SNAPSHOT.locked_questions` with rank and `ticket_count`.
This slice adds a small locked-row renderer that derives a benchmark estimate
from `ticket_count * DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD` and renders the
question text as withheld. It changes only presentation copy and derived display
values; no snapshot contract, API call, checkout path, or CTA href changes.

The cost band keeps using the existing summary-level `repeat_ticket_count`
calculation. Copy changes make the benchmark math explicit: representative
repeat-ticket count multiplied by the assisted-contact benchmark, not a
customer-specific measurement or guaranteed savings claim.

## Intentional

- This is the landing-page artifact preview, not the live results-page redesign
  from #196.
- The locked rows are derived from existing demo snapshot fields; this does not
  add payload fields or change ATLAS contracts.
- The benchmark estimate remains labeled as representative and benchmark-based,
  not a measured customer outcome.
- No CTAs or funnel routes change in this slice.

## Deferred

- The live results-page #196 work remains separate: pre-filled projection,
  payload-backed locked rows, keyword reframe, and teaser placement on the
  actual uploaded Snapshot page.
- A/B testing, canonical-route decisions, and retiring the long page remain out
  of scope.
- Parked hardening: none.

## Verification

Run before push:

- `rg -n "Support Tax estimate|question text withheld|Representative labeled-synthetic support set|benchmark estimate" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/plans/PR-Deflection-Snapshot-Support-Tax-Fomo.md -S` - passed
- `npm --prefix web run lint` - passed
- `npm --prefix web run build` - passed
- Browser check of `/systems/support-ticket-deflection/snapshot` at 127.0.0.1:3104 desktop 1440x1100 and mobile 390x844 - passed; page rendered content, no Next.js error overlay appeared, `Support Tax estimate`, `Representative labeled-synthetic support set`, `question text withheld`, and `Rank #6` rendered, and there was no horizontal overflow.
- `bash scripts/local_pr_review.sh` - passed

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~81 |
| Snapshot landing polish | ~95 |
| Total | ~176 |
