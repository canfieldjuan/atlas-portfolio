# PR-Test-Enrollment-Knip-Entrypoint

## Why this slice exists

Issue #198 tracks dead-code cleanup by verified slices. The current Knip
baseline still lists `web/scripts/audit-test-enrollment.mjs` as an unused file,
but live repo references show it is invoked by CI in
`.github/workflows/pre_push_audit.yml` and covered by
`web/scripts/test-test-enrollment-audit.mjs`. This is not dead code; it is a
missing entrypoint in the package script graph Knip can see.

## Scope (this PR)

Slice phase: Production hardening

1. Add a `check:test-enrollment` npm script that points at the existing
   `audit-test-enrollment.mjs` script.
2. Switch the CI workflow's test-enrollment audit step to call that package
   script instead of invoking the file directly.
3. Remove the now-resolved `audit-test-enrollment.mjs` file finding from the
   Knip baseline.

### Files touched

- `web/package.json` -- expose the audit as a first-class package script.
- `.github/workflows/pre_push_audit.yml` -- run the package script in CI.
- `web/knip-baseline.json` -- remove the resolved file finding.
- `web/plans/PR-Test-Enrollment-Knip-Entrypoint.md` -- this plan.

## Mechanism

Knip understands package scripts as entrypoints. By routing the workflow through
`npm --prefix web run check:test-enrollment`, the audit script remains exactly
the same executable code but stops appearing as an orphan file. CI still runs
the same audit with the same default arguments, and its fixture test remains
unchanged.

## Intentional

- This does not change the audit logic or its CLI flags.
- This does not remove `test-test-enrollment-audit.mjs`; that fixture test is
  still enrolled separately in CI.
- This does not touch the remaining landing/demo component baseline findings.

## Deferred

- Remaining baseline findings for `ContentOpsDemo.tsx`,
  `DiagnosticReportLandingPage.tsx`, `DiagnosticCard`, and `DiagnosticUseCase`
  need route/template investigation before removal.
- Legacy Blob token fallback removal after the old store is no longer needed.
- Legacy Stripe test-key fallback removal after a test-mode restricted key path
  is confirmed.

Parked hardening: none.

## Verification

- `node -e "JSON.parse(require('fs').readFileSync('web/package.json', 'utf8')); JSON.parse(require('fs').readFileSync('web/knip-baseline.json', 'utf8')); console.log('json ok')"` -- pass.
- `rg -n "audit-test-enrollment|check:test-enrollment" web/package.json .github/workflows/pre_push_audit.yml web/scripts web/knip-baseline.json --glob '!node_modules/**'` -- pass; the audit is reachable through the package script and remains covered by its fixture test.
- `npm --prefix web run check:test-enrollment` -- pass; all 41 `test:*` scripts are enrolled.
- `npm --prefix web run test:test-enrollment-audit` -- pass.
- `npm --prefix web run check:dead-code` -- pass; Knip baseline matches 4 known findings.
- `npm --prefix web run lint` -- pass.
- `npm --prefix web run build` -- pass.
- `git diff --check` -- pass.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/package.json` | ~1 |
| `.github/workflows/pre_push_audit.yml` | ~2 |
| `web/knip-baseline.json` | ~5 |
| `web/plans/PR-Test-Enrollment-Knip-Entrypoint.md` | ~75 |
| Total | ~83 |
