## Why this slice exists

Issue #384 asks the report to move from row-level owner routing toward an
accountability view: what cost sits with each owner lane. Recent slices already
render owner metadata on paid report rows, but the hosted page still leaves the
buyer to add up those costs manually.

This slice adds the smallest portfolio-side rollup: a paid-page summary grouped
by the existing `owner_lane` value from `backlog_table.items`.

## Scope (this PR)

Slice phase: Vertical slice

1. Add a "Cost by Owner Lane" summary to the paid report-model page.
2. Compute the summary only from `backlog_table.items`, the existing bounded work
   queue, so the page does not double-count rows repeated across priority and
   vertical sections.
3. Keep `owner_lane` semantics unchanged and add no required report fields.
4. Add behavior coverage that the owner summary uses the same visible backlog
   rows as the table, buckets overflow lanes, and keeps a stable smoke marker.

### Files touched

- `web/plans/PR-Deflection-Owner-Cost-Summary.md` - this plan.
- `web/src/lib/deflection-owner-cost-summary.mjs` - shared visible-row and owner-cost aggregation helpers.
- `web/src/components/landing/DeflectionReportModelPage.tsx` - paid-page owner-lane cost rollup.
- `web/scripts/test-deflection-report-model-result-page.mjs` - behavior and source-level coverage for the rollup contract.

## Mechanism

`visibleBacklogRows()` applies the same `default_limit` / local cap that the
backlog table uses. `OwnerCostSummary` and `BacklogTable` both consume that
helper, so the summary can only include rows whose evidence appears in the
visible table below.

`ownerCostCards()` groups those visible rows by `owner_lane || "Unknown"`, sums
`estimated_support_cost`, `ticket_count`, and row count per lane, sorts lanes by
cost descending, and renders a compact summary immediately after the support-tax
summary. When more than six owner lanes are visible, the first six lanes stay
separate and the remaining visible lanes are preserved in an explicit
`Other (N lanes)` card.

The component intentionally does not inspect `priority_fix_queue`,
`top_unresolved_repeats`, `drafted_resolutions`,
`already_covered_still_recurring`, or `suppressed_repeat_review_queue`. Those
sections can overlap with the backlog, so using them for a rollup would risk
presenting inflated ownership cost.

## Intentional

- No schema or contract change. This consumes existing optional hosted data.
- No `owner_lane` semantic change. The page labels the field as an owner lane and
  does not claim person/team-level assignment.
- No fallback rollup from overlapping sections. If the report has no visible
  backlog rows, the summary does not render.
- No policy-lane classification in this portfolio slice. Policy as a distinct
  deterministic gap type remains an ATLAS/report-generation concern.

## Deferred

- ATLAS-side policy classification and owner-lane derivation remain part of the
  backend #384 arc.
- Person/team routing remains deferred until an assignee/group export field or
  operator owner map is accepted.

Parked hardening: none

## Verification

Ran locally:

- `npm --prefix web run test:deflection-report-model-result-page` - passed, including the review-follow-up fixture for visible-row scoping and `Other (N lanes)` bucketing.
- `npm exec eslint -- src/components/landing/DeflectionReportModelPage.tsx src/lib/deflection-owner-cost-summary.mjs scripts/test-deflection-report-model-result-page.mjs` from `web/` - passed.
- `npm --prefix web run check:dead-code` - passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run build` - passed.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | Estimate |
|---|---:|
| `web/plans/PR-Deflection-Owner-Cost-Summary.md` | ~66 |
| `web/src/lib/deflection-owner-cost-summary.mjs` | ~70 |
| `web/src/components/landing/DeflectionReportModelPage.tsx` | ~80 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | ~70 |
| Total | ~286 |

Under the 400 LOC soft cap.
