# PR-Web-Npm-Audit-CI

## Why this slice exists

Issue #313 calls for dependency CVE scanning in CI after the parked audit
findings are burned down. PR-Web-Dependency-Audit-Burndown made
`npm --prefix web audit --audit-level=high` pass, so this slice ratchets that
state into the pull-request gate before new high-severity dependency findings can
land unnoticed.

## Scope (this PR)

Slice phase: Workflow/process

1. Add a blocking high-severity npm audit step to the existing pre-push audit
   workflow after web dependencies are installed.
2. Keep the audit threshold at `high`, matching #313 and the just-cleared local
   command, while the remaining moderate Next/PostCSS advisory stays parked.

### Files touched

- `.github/workflows/pre_push_audit.yml` — add the CI audit step.
- `web/plans/PR-Web-Npm-Audit-CI.md` — document the slice.

## Mechanism

The pre-push audit workflow already installs the web dependency tree with
`npm --prefix web ci`. This slice adds a dedicated
`npm --prefix web audit --audit-level=high` step immediately after install, so
the lockfile is checked in CI before the rest of the test suite runs.

The command exits non-zero for high or critical advisories and exits zero for
the currently parked moderate-only state. That makes the high-severity floor
blocking without forcing a breaking Next downgrade for the vendored PostCSS
moderate advisory.

## Intentional

- The audit is CI-only here; local `scripts/local_pr_review.sh` already has
  enough runtime cost, and this slice is specifically about closing the
  pull-request gate from issue #313.
- The threshold is `high`, not `moderate`, because the remaining moderate
  advisory is tracked in `HARDENING.md` and npm's automated fix is a breaking
  downgrade.
- This does not add Dependabot, SAST, gitleaks, or action SHA pinning. Those are
  separate security-baseline slices.
- The existing pre-push audit workflow already runs the portfolio script tests;
  this slice does not duplicate or restructure that enrollment.

## Deferred

- Dependabot for `web` npm and GitHub Actions remains a separate #313 slice.
- SAST/CodeQL or Semgrep remains a separate #313 slice.
- Gitleaks secret scanning remains a separate #313 slice.
- Action SHA pinning remains a separate #313 slice.
- Full moderate-level dependency blocking remains deferred until Next ships a
  compatible patched dependency for the vendored PostCSS advisory.

Parked hardening: none

## Verification

- `npm --prefix web audit --audit-level=high` — passed; exited 0 with only the
  already-parked moderate Next/PostCSS advisory remaining.
- `rg -n "audit --audit-level=high" .github/workflows/pre_push_audit.yml` —
  passed; the workflow now runs the high-severity audit at line 46.
- `bash scripts/pre_push_audit.sh origin/main` — passed; plan shape, files
  touched, and estimated diff-size audits passed for this slice.
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed; plan audits, drift audit, dead
  code baseline, Deflection Snapshot landing smoke, ESLint, Next build, and
  `git diff --check` passed.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `.github/workflows/pre_push_audit.yml` | ~3 |
| `web/plans/PR-Web-Npm-Audit-CI.md` | ~80 |
| Total | ~83 |
