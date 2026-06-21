## Why this slice exists

#1612 is turning the paid deflection report into an actionable operating view.
#345, #348, and #349 landed the first three bounded action sections:
`priority_fix_queue`, `top_unresolved_repeats`, and `drafted_resolutions`.
The next smallest vertical is `already_covered_still_recurring`: show the
buyer where an answer already exists, but reopened-ticket or CSAT signals imply
customers still need discoverability, search wording, macro-use, or answer
quality work.

This is a single-section continuation of the same safe action-section pattern.
The ATLAS producer emits `items` plus `top_item_count` from the shared action-row
pipeline, so the portfolio page should validate the real shape, construct the
buyer payload through the existing allowlist projection, and render only the
bounded summary fields.

## Scope (this PR)

Slice phase: Vertical slice

1. Add fail-closed web validation for `already_covered_still_recurring`.
2. Construct `already_covered_still_recurring` page data through the shared safe
   action-item projection.
3. Render a bounded hosted result-page section for already-covered recurring
   questions.
4. Extend the model-backed full-report smoke marker so current paid reports must
   include the covered-recurring section.
5. Add focused regression coverage for malformed covered-recurring shapes and
   export-only field stripping.

### Files touched

- `web/plans/PR-Deflection-Covered-Recurring-Vertical.md` - this plan.
- `web/src/lib/atlas-deflection-client.ts` - report-model validation and safe construction for the new section.
- `web/src/components/landing/DeflectionReportModelPage.tsx` - result-page rendering for covered recurring questions.
- `web/scripts/smoke-deflection-hosted-results.mjs` - required model-backed full-report marker.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - smoke marker fixture coverage.
- `web/scripts/test-deflection-report-model-result-page.mjs` - parser/projection/render regression coverage.

## Mechanism

`atlas-deflection-client.ts` accepts `already_covered_still_recurring` only when
the section data has a valid action-row array and a `top_item_count` that
matches the projected row count. Once validated, the section is passed through
`constructSafeActionSection`, which keeps only the fields the hosted page uses:
rank, question, status, owner lane, confidence, recommended action, ticket
count, estimated support cost, priority score, priority drivers, and the bounded
CSAT signal.

`DeflectionReportModelPage` renders a capped `Already Covered but Still
Recurring` table for web sections only. It emphasizes why the row matters:
customers are still returning even though there is evidence of an answer, so
the next action is discoverability, macro usage, answer quality, or wording
work. Raw source IDs, evidence quotes, representative phrasing, and backend-only
fields stay out of the page model and remain in the export/detail surfaces.

The smoke test adds a stable marker for model-backed full reports. The model
test extends the exact-key allowlist regression across all action sections so
backend-only fields cannot leak through this new section.

## Intentional

- This PR does not make `already_covered_still_recurring` required for every
  parsed model. The hosted smoke is the current-report acceptance check; older
  report models can still render without this optional section.
- The hosted page shows action summaries only. Full source evidence and complete
  ticket IDs remain export/detail concerns.
- The section reuses the shared action-row validator and projection instead of
  introducing a fourth action-section payload contract.
- No backlog table, report delta, macro writeback, email, or PDF changes are
  included here.

## Deferred

- `backlog_table` remains a separate bounded paid backlog slice.
- Email/PDF restructuring, report deltas, and macro-writeback upsell fields are
  deferred until the hosted action-section contract is stable.
- Cross-run delta identity (`repeat_key` / `cluster_id`) remains tracked in
  canfieldjuan/ATLAS#1316 and should land before customer-facing delta reports.
- Parked hardening: none.

## Verification

- Pass: `npm --prefix web run test:deflection-report-model-result-page`
- Pass: `npm --prefix web run test:deflection-hosted-results-smoke`
- Pass: `npm --prefix web run lint -- src/lib/atlas-deflection-client.ts src/components/landing/DeflectionReportModelPage.tsx scripts/smoke-deflection-hosted-results.mjs scripts/test-deflection-hosted-results-smoke.mjs scripts/test-deflection-report-model-result-page.mjs`
- Pass: `rg -n "Already Covered but Still Recurring|coveredRecurring|already_covered_still_recurring|COVERED_RECURRING_LIMIT" web/src web/scripts web/plans/PR-Deflection-Covered-Recurring-Vertical.md`
- Pass: `bash scripts/local_pr_review.sh`

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Covered-Recurring-Vertical.md` | +100 / -0 |
| `web/src/lib/atlas-deflection-client.ts` | +21 / -1 |
| `web/src/components/landing/DeflectionReportModelPage.tsx` | +74 / -0 |
| `web/scripts/smoke-deflection-hosted-results.mjs` | +1 / -0 |
| `web/scripts/test-deflection-hosted-results-smoke.mjs` | +14 / -0 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | +118 / -2 |
| Total | ~331 LOC |
