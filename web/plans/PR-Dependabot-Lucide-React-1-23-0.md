# Plan: Bump lucide-react to 1.23.0

## Why this slice exists

Dependabot opened a production dependency bump for `lucide-react`, moving the
icon package used across the Next.js UI from `1.22.0` to `1.23.0`. The branch was
missing the repo-required plan doc, so the review contract could not verify the
dependency bump against a declared file set.

## Scope (this PR)

Slice phase: Production hardening

1. Keep Dependabot's `lucide-react` package and lockfile bump from `1.22.0` to
   `1.23.0`.
2. Add this plan doc so the dependency update satisfies the repo's PR contract.

### Files touched

- `web/package.json` - update the `lucide-react` dependency range.
- `web/package-lock.json` - update the resolved `lucide-react` package.
- `web/plans/PR-Dependabot-Lucide-React-1-23-0.md` - this plan doc.

## Mechanism

The package manifest requests `lucide-react` `^1.23.0`, and the lockfile resolves
`node_modules/lucide-react` to `1.23.0` with the registry tarball and integrity
hash from npm. No application imports or icon call sites change in this slice.

## Intentional

- This is a dependency-only update; no icon usage, layout, or component code is
  changed.
- The package remains a production dependency because the app imports Lucide
  icons in rendered UI.

## Deferred

- None.

Parked hardening: none.

## Verification

- `bash scripts/local_pr_review.sh origin/main` - passed after adding the plan
  doc, including plan audits, real-adapter audit, dead-code baseline, deflection
  landing smoke tests, ESLint, Next build, and `git diff --check`.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/package-lock.json` | ~6 |
| `web/plans/PR-Dependabot-Lucide-React-1-23-0.md` | ~56 |
| Total | ~66 |
