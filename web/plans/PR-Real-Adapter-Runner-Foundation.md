## Why this slice exists

#413/#414 call out a real testing problem: many `web/scripts/test-*.mjs`
harnesses compile one file with `ts.transpileModule` and fabricate `@/lib/*`
modules because bare Node cannot resolve the app's `@/` alias. That means a
test can pass while the real local import is broken.

This slice starts the fix by adding a real TypeScript test runner with `@/`
alias resolution and migrating one local-module test as a pilot. It gives later
slices a working path before #415 adds the guard that blocks fabricated local
stubs.

This exceeds the 400-LOC soft cap because adding Vitest brings a large
package-lock update. The functional surface remains intentionally small: one
runner config, one migrated pilot test, and one package-script switch.

## Scope (this PR)

Slice phase: Workflow/process

1. Add Vitest in Node mode with `@/` mapped to `web/src`.
2. Move the structured-runtime logging test from a `ts.transpileModule` harness
   to a Vitest test that imports `@/lib/structured-runtime-log` for real.
3. Keep the existing package script name and pre-push enrollment intact, so the
   required CI gate runs the real-runner test without workflow churn.

### Files touched

- `web/package-lock.json` — lock Vitest and its transitive packages.
- `web/package.json` — add Vitest and route `test:structured-runtime-logging` through it.
- `web/plans/PR-Real-Adapter-Runner-Foundation.md` — plan for this slice.
- `web/scripts/test-structured-runtime-logging.mjs` — remove the old transpile harness.
- `web/src/lib/structured-runtime-log.test.ts` — real-runner replacement test.
- `web/vitest.config.ts` — Vitest config with the app `@/` alias.

## Mechanism

Vitest runs in a Node environment and resolves `@` to `web/src` through
`resolve.alias`. The migrated test imports the production helper through
`@/lib/structured-runtime-log`, spies only on the external side effect
(`console.error`), and keeps the existing tree scan that ensures raw
`console.error` calls do not return outside the structured logging helper.

The package script stays `test:structured-runtime-logging`, so the existing
pre-push workflow step continues to exercise this coverage. Later migrations can
move one harness at a time to Vitest without renaming every CI step.

## Intentional

- This does not migrate all 21 identified harnesses. That would exceed a sane PR
  size and would make review harder. The purpose here is to land the runner and
  a real-module pilot, then migrate the remaining tests in focused slices.
- `console.error` is spied because it is the output boundary of the logger; no
  local `@/...` module is mocked.
- The old script file is deleted instead of left as dead fallback code.

## Deferred

- Migrate the remaining `ts.transpileModule`/local-stub harnesses.
- Add the #415 CI audit after enough tests have a real-runner path to avoid
  blocking the suite without an escape route.
- Parked hardening: none.

## Verification

```bash
npm --prefix web run test:structured-runtime-logging # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web audit --audit-level=moderate # PASS
npm --prefix web run lint # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| Plan doc | ~85 |
| Vitest config/package lock | ~910 |
| Migrated structured logging test | ~90 |
| Removed old harness | ~-110 |
| Total | ~975 |
