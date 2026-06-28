# PR-CodeQL-Security-Baseline

## Why this slice exists

Issue #313 calls for SAST in the portfolio security baseline. The repo now has
dependency audit CI, Dependabot updates, and protected required checks, but it
still does not run a static analyzer over the Next.js serverless/payment/PII
surface. This slice adds GitHub CodeQL for JavaScript/TypeScript using GitHub's
free code scanning on the public repo.

## Scope (this PR)

Slice phase: Workflow/process

1. Add a dedicated CodeQL workflow for JavaScript/TypeScript.
2. Run it on pull requests, pushes to `main`, and a weekly schedule.
3. Use CodeQL's security-focused query suites without adding paid services or
   changing product code.

### Files touched

- `.github/workflows/codeql.yml` — add the CodeQL SAST workflow.
- `web/plans/PR-CodeQL-Security-Baseline.md` — document the slice.

## Mechanism

The workflow checks out the repository, initializes CodeQL for
`javascript-typescript`, and runs `github/codeql-action/analyze`. The selected
query suites are `security-extended` and `security-and-quality`, which keeps the
scan focused on security and correctness issues relevant to the app's
serverless routes, checkout code, CSV upload path, and admin surfaces.

The workflow is independent from the existing pre-push audit workflow. That
keeps the current required gate stable while CodeQL starts reporting its own
status and code-scanning alerts.

## Intentional

- This uses CodeQL instead of hosted Semgrep/Snyk, matching #313's no-cost
  constraint for public repos.
- The workflow does not install dependencies or build the app. CodeQL's
  JavaScript/TypeScript analysis can scan source directly, and the existing
  `pre-push-audit`/Vercel gates already cover install, tests, lint, and build.
- The workflow uses `github/codeql-action/*@v3`, consistent with the repo's
  current tag-based Actions style. SHA pinning remains a separate #313 slice.
- This PR does not update branch protection to require CodeQL yet. The check
  name should be confirmed from the first real run before adding it to required
  status checks.

## Deferred

- Requiring the CodeQL check in branch protection remains a repo-settings
  follow-up after the first run confirms the exact check name.
- Gitleaks secret scanning remains a separate #313 slice.
- Action SHA pinning remains a separate #313 slice.
- Full moderate-level dependency blocking remains deferred until Next ships a
  compatible patched dependency for the vendored PostCSS advisory.

Parked hardening: none

## Verification

- `test -f .github/workflows/codeql.yml` — passed.
- `python3 - <<'PY' ... yaml.safe_load(open('.github/workflows/codeql.yml')) ... PY`
  — passed; parsed the workflow and confirmed CodeQL init/analyze actions.
- `rg -n 'github/codeql-action/(init|analyze)@v3|javascript-typescript|security-extended|security-and-quality' .github/workflows/codeql.yml`
  — passed; confirmed CodeQL actions, language, and query suites.
- `bash scripts/pre_push_audit.sh origin/main` — passed; plan shape, files
  touched, and estimated diff-size audits passed for this slice.
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed; plan audits, drift audit, dead
  code baseline, Deflection Snapshot landing smoke, ESLint, Next build, and
  `git diff --check` passed.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `.github/workflows/codeql.yml` | ~35 |
| `web/plans/PR-CodeQL-Security-Baseline.md` | ~70 |
| Total | ~105 |
