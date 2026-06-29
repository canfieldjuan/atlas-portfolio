# Real Adapter Deflection Comeback Analytics Test

## Why this slice exists

The deflection comeback analytics guard still runs as a standalone Node harness.
It protects important privacy and comeback-tracking contracts, but does not
exercise the exported analytics functions directly.

## Scope (this PR)

Slice phase: Robust testing

1. Move `test:deflection-comeback-analytics` from a Node script to a Vitest test
   next to the deflection library tests.
2. Preserve the existing source guards for route/database wiring, one-shot
   client tracking, checkout ordering, and CI enrollment.
3. Add direct real-export coverage for the results-viewed and unlock-clicked
   analytics helpers so their emitted `gtag` payloads are verified without
   mocking local product modules.

### Files touched

- `web/package.json` — point the existing npm script at Vitest.
- `web/scripts/test-deflection-comeback-analytics.mjs` — remove the legacy Node harness.
- `web/src/lib/deflection-comeback-analytics.test.ts` — add the Vitest replacement.
- `web/plans/PR-Real-Adapter-Deflection-Comeback-Analytics-Test.md` — plan for this slice.

## Mechanism

The new Vitest file imports `trackFaqReportResultsViewed`,
`trackFaqReportUnlockClicked`, and `GA_MEASUREMENT_ID` from the real analytics
module. It stubs only the browser boundary (`window.location` and `window.gtag`)
and asserts that both exported helpers emit the expected event names, safe
dimension keys, rounded non-negative counts, and redacted result-page URL.

The remaining assertions read the same source files the Node harness inspected:
route bucketing, database lookup shape, client tracking calls, checkout ordering,
and workflow enrollment.

## Intentional

- This is a test-harness migration only; it does not change analytics,
  database, route, component, or workflow behavior.
- The browser boundary is stubbed because analytics dispatch depends on
  `window.gtag`; local product modules are imported directly.
- `HARDENING.md` was scanned before starting. No active parked item touches
  this analytics guard area.

## Deferred

The larger browser-heavy deflection smoke scripts remain as Node harnesses and
will be migrated in later slices.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-comeback-analytics` — passed; 1 test file / 2 tests.
- `node web/scripts/audit-test-enrollment.mjs` — passed; all 39 `test:*` scripts are enrolled.
- `npm --prefix web run lint` — passed.
- `rg -n "test-deflection-comeback-analytics\\.mjs|node scripts/test-deflection-comeback-analytics" web/package.json web/src/lib/deflection-comeback-analytics.test.ts web/scripts || true` — no matches; the legacy harness command is gone.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~72 |
| Vitest replacement | ~199 |
| Package script update | ~2 |
| Legacy harness deletion | ~126 |
| Total | ~399 |
