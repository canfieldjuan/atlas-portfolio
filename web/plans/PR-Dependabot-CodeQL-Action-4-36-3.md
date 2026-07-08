# Plan: Bump CodeQL init and analyze to 4.36.3

## Why this slice exists

Dependabot opened separate CodeQL action bumps for `init` and `analyze`, but the
workflow must not mix CodeQL action versions in one run. This slice keeps the
security workflow coherent by moving both CodeQL steps to the same pinned
`4.36.3` commit.

## Scope (this PR)

Slice phase: Production hardening

1. Update `github/codeql-action/init` to the same `4.36.3` SHA used by
   `github/codeql-action/analyze`.
2. Keep the Dependabot `analyze` bump to `4.36.3`.
3. Update the inline version comments so the pinned SHAs and human labels agree.

### Files touched

- `.github/workflows/codeql.yml` - keep CodeQL init/analyze on the same action
  version.
- `web/plans/PR-Dependabot-CodeQL-Action-4-36-3.md` - this plan doc.

## Mechanism

Both CodeQL workflow steps now use
`54f647b7e1bb85c95cddabcd46b0c578ec92bc1a`, the `github/codeql-action`
`4.36.3` commit Dependabot proposed. The workflow still runs the same language
and query set; only the pinned action version changes.

## Intentional

- This PR absorbs the matching `init` bump so the workflow does not run mixed
  CodeQL action majors.
- The separate Dependabot PR for `init` becomes redundant once this combined
  workflow update lands.

## Deferred

- None.

Parked hardening: none.

## Verification

- `bash scripts/local_pr_review.sh origin/main` - passed after applying the
  combined CodeQL action update, including plan audits, real-adapter audit,
  dead-code baseline, deflection landing smoke tests, ESLint, Next build, and
  `git diff --check`.

## Estimated diff size

| File | LOC |
|---|---:|
| `.github/workflows/codeql.yml` | ~4 |
| `web/plans/PR-Dependabot-CodeQL-Action-4-36-3.md` | ~58 |
| Total | ~62 |
