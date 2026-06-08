# Plan: Deflection orphan sweep baseline

## Why this slice exists

Issue #198 requires an unused-export/orphan sweep before more dead-code removal
PRs. The repo currently has no knip/ts-prune-style tool, so future cleanup is
still relying on manual grep and stale-session memory. That already caused this
tracker to carry crossed-off and struck candidates longer than it should.

This slice installs the sweep and makes the current findings explicit without
deleting product code in the same PR. The goal is a guardrail: new unused files,
exports, or exported types should fail CI, and resolved findings should force the
baseline to be updated in the same cleanup PR so #198 stays current.

The final diff is over the 400-line soft cap because adding Knip necessarily
updates `web/package-lock.json` with the tool's transitive dependency graph. The
behavioral surface stays narrow: one checker, one fixture test, one baseline,
and local/CI wiring.

## Scope (this PR)

Slice phase: Workflow/process

1. Add Knip as the repo's unused-code sweep tool for the `web` package.
2. Commit the current Knip findings as a baseline instead of suppressing them in
   config.
3. Add a baseline checker that runs Knip JSON output and fails when findings are
   added or removed without updating the baseline.
4. Add focused checker tests for pass, new finding, resolved finding, and
   malformed input cases.
5. Wire the dead-code baseline check into local review and GitHub Actions.

### Files touched

- `web/plans/PR-Deflection-Orphan-Sweep-Baseline.md` - this plan doc.
- `web/package.json` - Knip dependency and npm scripts.
- `web/package-lock.json` - Knip dependency lockfile.
- `web/knip-baseline.json` - current unused-code finding baseline.
- `web/scripts/check-knip-baseline.mjs` - Knip baseline drift checker.
- `web/scripts/test-knip-baseline.mjs` - checker fixture tests.
- `scripts/local_pr_review.sh` - local dead-code baseline gate.
- `.github/workflows/pre_push_audit.yml` - CI dead-code baseline gate and test enrollment.

## Mechanism

The `check:dead-code` script runs:

```bash
knip --reporter json --no-exit-code --no-progress
```

from the `web` package, normalizes findings into stable fingerprints
`type:file:name`, and compares that set to `web/knip-baseline.json`. Line and
column numbers are intentionally ignored so harmless code movement does not
create churn. Any new fingerprint or resolved fingerprint is drift:

- new findings mean an unreviewed orphan was introduced;
- resolved findings mean a cleanup PR crossed something off and must update the
  baseline in the same diff.

## Intentional

- This PR adds the tooling and baseline only; it does not delete any unused files
  or exports from the baseline. The next product cleanup can use the baseline as
  evidence.
- Knip runs in default mode, not `--production`, because the repo's scripts and
  tests are real tracked surfaces. `--production` incorrectly reports every test
  and smoke script as unused.
- The baseline stores stable fingerprints, not raw Knip JSON, to avoid line/col
  churn while still preserving the finding type, file, and export/file name.

## Deferred

- Use the baseline output to trim any remaining v1-only
  `landingConfig.tsx` exports in the next #198 cleanup PR.
- Final legacy Blob token removal remains gated on legacy-store rows aging out.
- Legacy Stripe `sk_test_` fallback cleanup remains gated on Preview/test mode
  using an `rk_test_` restricted key.

Parked hardening: none.

## Verification

- `node web/scripts/audit-test-enrollment.mjs` - passed; all `test:*` scripts,
  including the new `test:dead-code-baseline`, are enrolled in
  `.github/workflows/pre_push_audit.yml`.
- `npm --prefix web run test:test-enrollment-audit` - passed.
- `npm --prefix web run check:dead-code` - passed; Knip baseline matches 22
  known findings.
- `npm --prefix web run test:dead-code-baseline` - passed; fixture tests cover
  pass, new finding, resolved finding, namespace export/type findings, and
  malformed input failure cases.
- `npm exec -- knip --reporter json --no-exit-code --no-progress` from `web/` -
  passed; no current `nsExports` or `nsTypes` findings, so the baseline remains
  22 findings after adding namespace issue types.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC |
|---|---:|
| Plan doc | ~100 |
| Package dependency/scripts | ~20 |
| Knip dependency lockfile | ~895 |
| Knip baseline | ~120 |
| Baseline checker | ~175 |
| Checker tests | ~80 |
| Local/CI wiring | ~10 |
| Total | ~1,400 |
