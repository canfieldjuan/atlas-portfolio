## Why this slice exists

#1612's S3 hosted-result sequence has now landed the five buyer-visible action
sections on the paid result page: priority fix queue, top unresolved repeats,
drafted resolutions, already-covered recurrence, and backlog table. The existing
hosted-results smoke can verify a broad `full-report`, but that mode still
allows legacy paid artifacts because older reports predate the `deflection.v1`
model-backed dashboard.

Before S4 starts reshaping email/PDF around the action report, we need a narrow
acceptance target that proves the current buyer URL rendered the model-backed
dashboard specifically. Legacy full-report tolerance should remain available for
old artifacts, but current acceptance should be able to fail if the page falls
back to legacy content or omits any action section.

## Scope (this PR)

Slice phase: Functional validation

1. Add a strict hosted-results smoke expectation for the model-backed full
   report.
2. Keep the existing `full-report` expectation backward compatible with legacy
   paid artifacts.
3. Require all five action-section markers in the strict model-backed mode.
4. Add regression coverage for model-backed success, legacy rejection in strict
   mode, legacy compatibility in broad mode, and missing action-section failure.

### Files touched

- `web/plans/PR-Deflection-Model-Full-Report-Smoke.md` - this plan.
- `web/scripts/smoke-deflection-hosted-results.mjs` - strict model-backed full-report expectation.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - smoke regression coverage.

## Mechanism

`smoke-deflection-hosted-results.mjs` keeps `snapshot` and `full-report` exactly
as operator-facing modes. A new strict expectation validates the model-backed
full report marker set directly instead of auto-detecting between model-backed
and legacy full-report markers.

The strict mode uses the existing model marker list, which now includes the
five action sections. A legacy paid report can still pass `--expect
full-report`, but it fails the strict model-backed expectation because it lacks
the model dashboard and action-section markers. This gives the report-shape lane
a stable acceptance command before the email/PDF surface begins consuming the
new action report shape.

## Intentional

- This PR does not make the route reject old paid artifacts. The change is only
  in the operator/test smoke.
- This PR does not add another action section or change the hosted page UI.
- This PR does not start S4 email/PDF work. It creates the guard that S4 should
  rely on.

## Deferred

- S4 email/PDF restructuring remains the next report-surface lane after this
  strict hosted-page acceptance target is in place.
- Cross-run delta identity (`repeat_key` / `cluster_id`) remains tracked in
  canfieldjuan/ATLAS#1316 and should land before customer-facing delta reports.
- Parked hardening: none.

## Verification

- Pass: `npm --prefix web run test:deflection-hosted-results-smoke`
- Pass: `npm --prefix web run lint -- scripts/smoke-deflection-hosted-results.mjs scripts/test-deflection-hosted-results-smoke.mjs`
- Pass: `bash scripts/local_pr_review.sh`

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Model-Full-Report-Smoke.md` | +77 / -0 |
| `web/scripts/smoke-deflection-hosted-results.mjs` | +14 / -8 |
| `web/scripts/test-deflection-hosted-results-smoke.mjs` | +58 / -0 |
| Total | ~157 LOC |
