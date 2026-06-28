# Real Adapter Deflection Cost Projection Share Test

## Why this slice exists

The deflection cost-projection sharing guard still runs as a standalone Node
harness under `web/scripts/`. This keeps one more deflection regression check
outside the Vitest lane and makes the generated demo fixture brittle by parsing
the source text instead of importing the real generated export.

## Scope (this PR)

Slice phase: Robust testing

1. Move `test:deflection-cost-projection-share` from a Node script to a Vitest
   test next to the deflection library tests.
2. Preserve the existing source-guard assertions for the shared Support Tax
   projection and Snapshot artifact ordering.
3. Import `DEMO_DEFLECTION_SNAPSHOT` directly from the generated demo fixture
   instead of extracting JSON with a local regex parser.

### Files touched

- `web/package.json` — point the existing npm script at Vitest.
- `web/scripts/test-deflection-cost-projection-share.mjs` — remove the legacy Node harness.
- `web/src/lib/deflection-cost-projection-share.test.ts` — add the Vitest replacement.
- `web/plans/PR-Real-Adapter-Deflection-Cost-Projection-Share-Test.md` — plan for this slice.

## Mechanism

The new Vitest test reads the same source files the Node harness inspected, so
the guard still catches accidental local reimplementation, stale cost-band copy,
and Snapshot artifact ordering regressions. The only fixture change is replacing
the local `parseGeneratedJsonExport` helper with the actual
`DEMO_DEFLECTION_SNAPSHOT` export from `deflection-demo-example`, matching the
real-adapter rule used by the preceding deflection test migrations.

The package script keeps the same name, so CI enrollment and local commands do
not change.

## Intentional

- This is a harness migration only; it does not alter the projection component,
  Snapshot landing page, results page, generated demo data, or product copy.
- The test remains a source guard because the existing check protects sharing
  and ordering contracts that are cheaper to verify statically than through a
  browser smoke.
- `HARDENING.md` was scanned before starting. No active parked item touches
  this test or the cost-projection source-guard area.

## Deferred

The larger browser-heavy deflection smoke scripts remain as Node harnesses and
will be migrated in later slices.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-cost-projection-share` — passed; 1 test file / 1 test.
- `node web/scripts/audit-test-enrollment.mjs` — passed; all 39 `test:*` scripts are enrolled.
- `npm --prefix web run lint` — passed.
- `rg -n "test-deflection-cost-projection-share|parseGeneratedJsonExport" web/package.json web/src/lib/deflection-cost-projection-share.test.ts web/scripts || true` — no matches; the legacy harness command and local JSON parser are gone.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~70 |
| Vitest replacement | ~55 |
| Package script update | ~1 |
| Legacy harness deletion | ~106 |
| Total | ~232 |
