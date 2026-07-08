# Plan: Bump Next to 16.2.10

## Why this slice exists

Dependabot opened a production dependency bump for `next`, moving the app from
`16.2.9` to `16.2.10`. The branch later conflicted with other dependency bumps,
so this slice keeps the Next update, keeps Next's ESLint companion package in
the same version family, and preserves the already-merged Lucide and Tailwind
lockfile state from main.

## Scope (this PR)

Slice phase: Production hardening

1. Keep Dependabot's `next` package and lockfile bump from `16.2.9` to
   `16.2.10`.
2. Keep `eslint-config-next` and its bundled `@next/eslint-plugin-next`
   dependency aligned to `16.2.10`.
3. Resolve the dependency conflict against current `main` without reverting the
   merged `lucide-react` or Tailwind package updates.
4. Add this plan doc so the manual conflict resolution satisfies the repo's PR
   contract.

### Files touched

- `web/package.json` - update the `next` and `eslint-config-next` dependency
  versions.
- `web/package-lock.json` - update the resolved `next` package while preserving
  current dependency graph updates from main, including Next's ESLint companion
  packages.
- `web/plans/PR-Dependabot-Next-16-2-10.md` - this plan doc.

## Mechanism

The package manifest pins `next` and `eslint-config-next` to `16.2.10`, and the
lockfile resolves `node_modules/next`, `node_modules/eslint-config-next`, and
`node_modules/@next/eslint-plugin-next` to `16.2.10` with npm's registry
metadata. The conflict resolution keeps `lucide-react` at `1.23.0` and the
Tailwind package graph at `4.3.2`, matching current main.

## Intentional

- This is a dependency-only update; no route, component, API, or build workflow
  code changes.
- The resolved dependency graph is regenerated through npm rather than edited as
  ad hoc lockfile text.

## Deferred

- None.

Parked hardening: none.

## Verification

- `npm --prefix web install next@16.2.10 --save-exact --package-lock-only` -
  regenerated the lockfile after conflict resolution.
- `npm --prefix web install eslint-config-next@16.2.10 --save-dev --save-exact
  --package-lock-only` - aligned Next's ESLint companion package with the Next
  runtime package.
- `bash scripts/local_pr_review.sh origin/main` - passed after installing this
  worktree's dependencies, including plan audits, real-adapter audit,
  dead-code baseline, deflection landing smoke tests, ESLint, Next build, and
  `git diff --check`.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/package.json` | ~4 |
| `web/package-lock.json` | ~96 |
| `web/plans/PR-Dependabot-Next-16-2-10.md` | ~75 |
| Total | ~175 |
