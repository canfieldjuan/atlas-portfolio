# PR-Actions-SHA-Pinning

## Why this slice exists

Issue #313 calls for SHA-pinning GitHub Actions as the final security-CI suite
piece. The repo now has protected required checks, dependency audit CI,
Dependabot, CodeQL, and gitleaks, but workflow actions still use mutable version
tags such as `actions/checkout@v4`. This slice pins the current action versions
to exact commit SHAs so a moved tag cannot alter CI behavior.

## Scope (this PR)

Slice phase: Workflow/process

1. Resolve every existing workflow `uses:` version tag to its current commit SHA.
2. Replace those `uses:` values with the pinned SHA.
3. Preserve the original version tag in an inline comment for readability.

### Files touched

- `.github/workflows/codeql.yml` — pin CodeQL workflow actions.
- `.github/workflows/deflection_snapshot_landing_monitor.yml` — pin monitor workflow actions.
- `.github/workflows/pre_push_audit.yml` — pin pre-push audit workflow actions.
- `.github/workflows/pr_body_contract.yml` — pin PR-body workflow action.
- `.github/workflows/security_guardrails.yml` — pin checkout/SARIF actions; gitleaks container is already digest-pinned.
- `web/plans/PR-Actions-SHA-Pinning.md` — document the slice.

## Mechanism

Each `uses:` reference is pinned to the commit currently pointed to by its tag:

- `actions/checkout@v4` -> `34e114876b0b11c390a56381ad16ebd13914f8d5`
- `actions/setup-node@v4` -> `49933ea5288caeca8642d1e84afbd3f7d6820020`
- `actions/upload-artifact@v4` -> `ea165f8d65b6e75b540449e92b4886f43607fa02`
- `actions/github-script@v7` -> `f28e40c7f34bde8b3046d885e986cb6290c5673b`
- `actions/setup-python@v5` -> `a26af69be951a213d495a4c3e4e4022e16d87065`
- `github/codeql-action/*@v3` -> `dd903d2e4f5405488e5ef1422510ee31c8b32357`
- `github/codeql-action/upload-sarif@v4` -> `8aad20d150bbac5944a9f9d289da16a4b0d87c1e`

The action path is preserved for sub-actions, for example
`github/codeql-action/init@<sha>` and `github/codeql-action/analyze@<sha>`.

## Intentional

- This PR pins existing action versions; it does not upgrade actions.
- Dependabot remains configured for GitHub Actions, so future action updates can
  still arrive as PRs.
- The gitleaks Docker image is already pinned by digest and is left unchanged.
- Branch protection is already enforcing the current required checks; this slice
  does not change repo settings.

## Deferred

- Full moderate-level dependency blocking remains deferred until Next ships a
  compatible patched dependency for the vendored PostCSS advisory.

Parked hardening: none

## Verification

- `rg -n 'uses: [^#\\n]*@(v[0-9]+|main|master)' .github/workflows || true`
  — passed; no remaining tag-based action refs before comments.
- `rg -n 'uses: .*@[0-9a-f]{40}' .github/workflows` — passed; found 15
  SHA-pinned action refs across the workflow files.
- `python3 - <<'PY' ... yaml.safe_load(...) ... PY` — passed; all five
  workflow YAML files parse after pinning.
- `bash scripts/pre_push_audit.sh origin/main` — passed; plan shape, files
  touched, and estimated diff-size audits passed for this slice.
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed; plan audits, dead code baseline,
  Deflection Snapshot landing smoke, ESLint, Next build, and `git diff --check`
  passed. Cross-session drift reported advisory overlap with Dependabot action
  bump PRs #396-#400; those update actions after this pinning slice and do not
  block this diff.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `.github/workflows/codeql.yml` | ~6 |
| `.github/workflows/deflection_snapshot_landing_monitor.yml` | ~8 |
| `.github/workflows/pre_push_audit.yml` | ~8 |
| `.github/workflows/pr_body_contract.yml` | ~2 |
| `.github/workflows/security_guardrails.yml` | ~6 |
| `web/plans/PR-Actions-SHA-Pinning.md` | ~80 |
| Total | ~110 |
