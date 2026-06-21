## Why this slice exists

#1612 is reshaping the paid deflection report into an actionable operating
view. The four top action sections now render on the hosted result page through
the shared safe action-item projection. The remaining bounded action surface is
`backlog_table`: the broader paid backlog that lets a support lead scan beyond
the top three items without opening the full evidence export.

This slice keeps the same privacy boundary as #348-#350. The ATLAS producer
emits `items`, `total_item_count`, and `default_limit` from the shared action-row
pipeline, so the portfolio page should validate the real shape, construct the
buyer payload through the allowlist projection, and render only bounded summary
fields.

## Scope (this PR)

Slice phase: Vertical slice

1. Add fail-closed web validation for `backlog_table`.
2. Construct `backlog_table` page data through the shared safe action-item
   projection.
3. Render a bounded hosted result-page section for the broader backlog table.
4. Extend the model-backed full-report smoke marker so current paid reports must
   include the backlog section.
5. Add focused regression coverage for malformed backlog shapes and export-only
   field stripping.

### Files touched

- `web/plans/PR-Deflection-Backlog-Table-Vertical.md` - this plan.
- `web/src/lib/atlas-deflection-client.ts` - report-model validation and safe construction for the backlog section.
- `web/src/components/landing/DeflectionReportModelPage.tsx` - result-page rendering for the bounded backlog table.
- `web/scripts/smoke-deflection-hosted-results.mjs` - required model-backed full-report marker.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - smoke marker fixture coverage.
- `web/scripts/test-deflection-report-model-result-page.mjs` - parser/projection/render regression coverage.

## Mechanism

`atlas-deflection-client.ts` accepts `backlog_table` only when the section data
has valid action rows, a non-negative integer `total_item_count` that is at
least the projected item count, and a non-negative integer `default_limit`. Once
validated, the section is passed through `constructSafeActionSection`, which
keeps only the fields the hosted page uses: rank, question, status, owner lane,
confidence, recommended action, ticket count, estimated support cost, priority
score, priority drivers, and the bounded CSAT signal.

`DeflectionReportModelPage` renders a capped `Backlog Table` for web sections.
It uses `data.default_limit` / `section.default_limit` but clamps locally to the
page cap, then shows the broader backlog rows with status, repeat count, cost,
CSAT, owner lane, score, and action. Raw source IDs, evidence quotes,
representative phrasing, and backend-only fields stay out of the page model and
remain in export/detail surfaces.

The smoke test adds a stable marker for model-backed full reports. The model
test extends the exact-key allowlist regression across all action sections so
backend-only fields cannot leak through the backlog table.

## Intentional

- This PR does not make `backlog_table` required for every parsed model. The
  hosted smoke is the current-report acceptance check; older report models can
  still render without this optional section.
- The result page remains bounded even for the backlog table. Complete evidence
  and all source IDs remain export/detail concerns.
- The section reuses the shared action-row validator and projection instead of
  introducing a fifth action-section payload contract.
- No email/PDF redesign, report delta, macro writeback, or evidence-export
  changes are included here.

## Deferred

- Email/PDF restructuring is deferred to S4 after the hosted action-section
  contract is stable.
- Report deltas and macro-writeback upsell fields remain future subscription
  slices.
- Cross-run delta identity (`repeat_key` / `cluster_id`) remains tracked in
  canfieldjuan/ATLAS#1316 and should land before customer-facing delta reports.
- Parked hardening: none.

## Verification

- Pass: `npm --prefix web run test:deflection-report-model-result-page`
- Pass: `npm --prefix web run test:deflection-hosted-results-smoke`
- Pass: `npm --prefix web run lint -- src/lib/atlas-deflection-client.ts src/components/landing/DeflectionReportModelPage.tsx scripts/smoke-deflection-hosted-results.mjs scripts/test-deflection-hosted-results-smoke.mjs scripts/test-deflection-report-model-result-page.mjs`
- Pass: `rg -n "Backlog Table|backlogTable|backlog_table|BACKLOG_TABLE_LIMIT" web/src web/scripts web/plans/PR-Deflection-Backlog-Table-Vertical.md`
- Pass: `bash scripts/local_pr_review.sh`

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Backlog-Table-Vertical.md` | +98 / -0 |
| `web/src/lib/atlas-deflection-client.ts` | +23 / -1 |
| `web/src/components/landing/DeflectionReportModelPage.tsx` | +76 / -0 |
| `web/scripts/smoke-deflection-hosted-results.mjs` | +1 / -0 |
| `web/scripts/test-deflection-hosted-results-smoke.mjs` | +14 / -0 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | +128 / -1 |
| Total | ~342 LOC |
