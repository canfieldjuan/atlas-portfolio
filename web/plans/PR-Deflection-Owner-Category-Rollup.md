# PR-Deflection-Owner-Category-Rollup

## Why this slice exists

Issue #384 asks the paid report to move from topic-level routing toward buyer
accountability: what cost sits with content/support enablement versus
product/support experience. The current portfolio owner-cost summary groups by
`owner_lane`, but ATLAS now keeps `owner_lane` as the routeable topic/area and
emits the new additive `owner_category` contract field for the accountability
bucket.

Root cause: the portfolio summary still treats `owner_lane` as the owner
rollup key. That was the right placeholder before ATLAS #1867 landed, but now
it would quietly preserve the old semantic mismatch: topic labels would be
shown as accountability buckets even though the backend has a safer field.

## Scope (this PR)

Slice phase: Vertical slice

1. Regenerate the portfolio deflection report-model contract from merged ATLAS
   so hosted paid action rows admit optional `owner_category`.
2. Group the paid-page owner-cost summary by `owner_category`, falling back to
   `owner_lane || "Unknown"` for legacy stored reports that predate the field.
3. Keep `owner_lane` visible on row-level owner/evidence cells as the routeable
   topic/area; do not repurpose it.
4. Update behavior coverage for category grouping, legacy fallback, overflow
   bucketing, and generated contract admission.

### Files touched

- `web/plans/PR-Deflection-Owner-Category-Rollup.md` - this plan.
- `web/src/lib/deflection-report-model-contract.ts` - regenerated ATLAS report-model contract.
- `web/src/lib/deflection-demo-example.ts` - regenerated ATLAS demo report example.
- `web/src/lib/deflection-owner-cost-summary.mjs` - owner-category aggregation helper.
- `web/src/components/landing/DeflectionReportModelPage.tsx` - paid-page summary labels/copy.
- `web/scripts/test-deflection-report-model-result-page.mjs` - behavior coverage for grouping and rendering.
- `web/scripts/test-deflection-snapshot-contract-generator.mjs` - generator fixture coverage for `owner_category`.

## Mechanism

`npm --prefix web run generate:deflection-contracts` refreshes the generated
report contract and demo example from the merged ATLAS contract. This slice
uses explicit `--source` paths written from ATLAS `origin/main` because the
local ATLAS checkout is on another branch. The hosted projection keeps
`owner_category` optional because persisted paid `deflection.v1` reports
generated before ATLAS #1867 do not have it.

`ownerCostCards()` keeps using the same visible backlog rows as the paid table,
but its grouping key becomes `owner_category` first and `owner_lane` second.
The returned display field stays generic enough for the component to render the
buyer-facing accountability bucket, while legacy reports still render the old
topic value instead of dropping into `Unknown`.

`OwnerEvidenceCell` continues to show `owner_lane` on individual rows because
that field is still the routeable topic/area. The summary copy is updated from
"Owner Lane" to "Owner Category" so the page does not imply that topic labels
and accountability buckets are the same thing. The report-model test stubs the
hosted field shapes with `owner_category` so projection coverage matches the
generated contract instead of silently simulating the old shape.

## Intentional

- No `owner_lane` semantic change. Row-level routing still shows the topic/area.
- No policy category invention. If ATLAS does not emit policy as a deterministic
  category, portfolio does not infer it.
- No person/team routing. The summary remains category-level accountability, not
  an assignment to an individual or department.
- Legacy reports fall back to `owner_lane` because old persisted reports cannot
  be expected to have `owner_category`.

## Deferred

- Policy as a distinct owner category remains deferred until ATLAS emits a
  deterministic policy signal.
- Person/team routing remains deferred until an assignee/group export field or
  operator owner map is accepted.
- A richer visual split between accountability category and routeable topic is
  deferred; this slice only corrects the summary grouping key.

Parked hardening: none

## Verification

- `tmpdir=$(mktemp -d /tmp/atlas-owner-category-contract.XXXXXX); git -C /home/juan-canfield/Desktop/Atlas show origin/main:portfolio-ui/src/types/deflectionSnapshot.ts > "$tmpdir/deflectionSnapshot.ts"; git -C /home/juan-canfield/Desktop/Atlas show origin/main:portfolio-ui/src/types/deflectionReportModel.ts > "$tmpdir/deflectionReportModel.ts"; git -C /home/juan-canfield/Desktop/Atlas show origin/main:docs/frontend/content_ops_faq_deflection_report_example.json > "$tmpdir/content_ops_faq_deflection_report_example.json"; git -C /home/juan-canfield/Desktop/Atlas show origin/main:docs/frontend/content_ops_faq_deflection_snapshot_example.json > "$tmpdir/content_ops_faq_deflection_snapshot_example.json"; npm --prefix web run generate:deflection-contracts -- --source "$tmpdir/deflectionSnapshot.ts" --report-model-source "$tmpdir/deflectionReportModel.ts" --demo-report-source "$tmpdir/content_ops_faq_deflection_report_example.json" --demo-snapshot-source "$tmpdir/content_ops_faq_deflection_snapshot_example.json"` - passed; regenerated the portfolio contract/example from ATLAS `origin/main`.
- `npm --prefix web run test:deflection-snapshot-contract-generator` - passed.
- `npm --prefix web run test:deflection-report-model-result-page` - passed.
- `npm exec eslint -- src/components/landing/DeflectionReportModelPage.tsx src/lib/deflection-owner-cost-summary.mjs scripts/test-deflection-report-model-result-page.mjs scripts/test-deflection-snapshot-contract-generator.mjs` from `web/` - passed.
- `rg -n "Cost by Owner Lane|ownerLane|Other \\([^)]* lane|Owner lane is not a person-level" web/src web/scripts` - passed; no stale live code/test usage.
- `rg -n "Cost by Owner Lane|Other \\([^)]* lane|Owner lane is not a person-level" web/plans` - historical prior plan `web/plans/PR-Deflection-Owner-Cost-Summary.md` still names the old slice output; not changed because plan docs are historical artifacts.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Owner-Category-Rollup.md` | ~105 |
| `web/src/lib/deflection-report-model-contract.ts` | ~132 |
| `web/src/lib/deflection-demo-example.ts` | ~2 |
| `web/src/lib/deflection-owner-cost-summary.mjs` | ~18 |
| `web/src/components/landing/DeflectionReportModelPage.tsx` | ~12 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | ~67 |
| `web/scripts/test-deflection-snapshot-contract-generator.mjs` | ~9 |
| Total | ~345 |

Under the 400 LOC soft cap.
