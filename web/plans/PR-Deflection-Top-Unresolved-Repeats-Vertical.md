## Why this slice exists

#1612 is moving the paid deflection report from a dense archive toward an
actionable operating report. #345 landed the first buyer-visible action section,
`priority_fix_queue`, on the hosted paid result page. The next smallest vertical
is `top_unresolved_repeats`: the buyer should immediately see the top repeated
questions that still need an answer, with cost/status/action context, without
opening the full PDF or evidence export.

This stays deliberately narrow. It validates and renders one paid action
section end to end before expanding to drafted resolutions, already-covered
recurrence, or the full backlog table.

This slice is over the 400 LOC soft target after review because the MAJOR fix is
not just a rendering tweak: it changes the parser boundary from
validate-and-pass-through to allowlist construction for both action sections and
adds regression coverage proving export-only fields do not reach the hosted-page
payload.

## Scope (this PR)

Slice phase: Vertical slice

1. Add fail-closed web validation for the `top_unresolved_repeats` section.
2. Render the paid model's top unresolved repeats as a bounded result-page
   section.
3. Keep raw evidence, source IDs, and snippet payloads out of the hosted page.
4. Extend the hosted full-report smoke markers so model-backed full reports must
   include the unresolved-repeat section.
5. Add focused parser/render source assertions for malformed row shapes and
   bounded rendering.

### Files touched

- `web/plans/PR-Deflection-Top-Unresolved-Repeats-Vertical.md` - this plan.
- `web/src/lib/atlas-deflection-client.ts` - web-section validator for the new section.
- `web/src/components/landing/DeflectionReportModelPage.tsx` - result-page section render.
- `web/scripts/smoke-deflection-hosted-results.mjs` - required full-report marker.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - smoke marker fixture updates.
- `web/scripts/test-deflection-report-model-result-page.mjs` - parser/render regression coverage.

## Mechanism

The ATLAS model already emits `top_unresolved_repeats` from the same action-row
producer as `priority_fix_queue`. This slice teaches the portfolio client to
accept that section only when the fields used by the renderer have the expected
shape: `items`, `top_item_count`, and `support_cost_basis`, with each row
carrying string question/status/action fields and numeric count/cost/score
fields.

Before the model reaches `DeflectionReportModelPage`, the parser constructs safe
action-item payloads for both `priority_fix_queue` and `top_unresolved_repeats`.
That projection keeps only the fields the hosted page uses and drops backend
fields such as `top_evidence`, `source_ids`, `representative_phrasing`,
`recommended_title`, `fix_type`, and `opportunity_score`.

`DeflectionReportModelPage` then renders only the bounded result-page slice:
question/theme, unresolved status, repeat count, estimated cost, CSAT label,
owner lane, confidence, score, and recommended action.

## Intentional

- This PR does not make `top_unresolved_repeats` required for every model-backed
  report. Historical paid reports and partially rolled-out producers can still
  render without the section; the hosted smoke is the current-report acceptance
  probe.
- The section is intentionally result-page dense but bounded. The full evidence
  export remains the uncapped audit surface.
- The renderer reuses the existing priority queue label helpers instead of
  introducing a new row abstraction in this slice.

## Deferred

- `drafted_resolutions` rendering is deferred to the next one-section vertical.
- `already_covered_still_recurring` and `backlog_table` rendering are deferred to
  their own slices.
- Cross-run delta identity (`repeat_key` / `cluster_id`) is now tracked in
  canfieldjuan/ATLAS#1316 and should be built separately before customer-facing
  delta reports.
- Parked hardening: none.

## Verification

- Pass: `npm --prefix web run test:deflection-report-model-result-page`
- Pass: `npm --prefix web run test:deflection-hosted-results-smoke`
- Pass: `npm --prefix web run lint -- src/lib/atlas-deflection-client.ts src/components/landing/DeflectionReportModelPage.tsx scripts/smoke-deflection-hosted-results.mjs scripts/test-deflection-hosted-results-smoke.mjs scripts/test-deflection-report-model-result-page.mjs`
- Pass: `bash scripts/local_pr_review.sh`

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Top-Unresolved-Repeats-Vertical.md` | +99 / -0 |
| `web/src/lib/atlas-deflection-client.ts` | +95 / -4 |
| `web/src/components/landing/DeflectionReportModelPage.tsx` | +74 / -1 |
| `web/scripts/smoke-deflection-hosted-results.mjs` | +1 / -0 |
| `web/scripts/test-deflection-hosted-results-smoke.mjs` | +14 / -0 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | +249 / -28 |
| Total | 565 LOC |
