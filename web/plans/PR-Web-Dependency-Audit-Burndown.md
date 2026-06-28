# PR-Web-Dependency-Audit-Burndown

## Why this slice exists

Issue #313 calls out parked npm audit findings before the repo can make
dependency CVE checks blocking. After #392 added the disclosure baseline,
`npm --prefix web audit --audit-level=high --json` still fails on the current
dependency tree:

- `next@16.2.4` carries multiple high advisories fixed by a non-major patch.
- `undici@6.25.0`, pulled transitively by `@vercel/blob`, carries a high
  advisory fixed by a transitive lockfile refresh.
- Several lower-severity transitive findings also remain in the same audit
  report.

This slice burns down the web dependency audit findings first, without adding
the CI gate yet. That keeps the next security-CI slice from launching red.

## Scope (this PR)

Slice phase: Production hardening

1. Patch the web dependency tree so `npm audit --audit-level=high` exits 0.
2. Keep the change to package metadata and the existing hardening note only;
   no app behavior or workflow gate changes in this PR.
3. Mark the parked `NPM-AUDIT-WEB-1` hardening item as partially resolved for
   high severity, and document any remaining compatible-fix gap.

### Files touched

- `web/plans/PR-Web-Dependency-Audit-Burndown.md` - this plan.
- `web/package.json` - patched direct web dependency versions if needed.
- `web/package-lock.json` - refreshed dependency graph.
- `HARDENING.md` - records the high-severity audit burn-down and remaining moderate compatible-fix gap.

## Mechanism

The direct Next.js packages move from the vulnerable patch to the patched
non-major release, keeping `next` and `eslint-config-next` aligned. The lockfile
refresh lets npm resolve patched compatible transitive versions for `undici`,
`@babel/core`, `brace-expansion`, and `js-yaml` where their parent package
ranges allow it.

The verification proves this does not just move the high-severity warning:
`npm audit --audit-level=high` must pass after the refresh, then the normal
lint/build and local PR gate must pass against the updated dependency graph.

## Intentional

- No security CI gate yet. The purpose is to make the tree green first; adding
  the blocking audit belongs in the next security-CI slice.
- No broad dependency modernization beyond the packages required by the audit.
- No app-code changes unless a package patch forces a compile/test fix.

## Deferred

- Blocking `npm audit` CI remains a follow-up once this PR is merged.
- Dependabot, SAST/CodeQL, gitleaks, and action pinning remain separate #313
  security-CI slices.
- Two moderate `next` -> vendored `postcss` findings remain after the patch.
  `npm audit fix --force` suggests a breaking downgrade to `next@9.3.3`, so the
  compatible-fix gap stays parked in `HARDENING.md` instead of adding a brittle
  override.

Parked hardening: `NPM-AUDIT-WEB-1`

## Verification

- `npm --prefix web install next@16.2.9 eslint-config-next@16.2.9` - passed.
- `npm --prefix web update undici @babel/core brace-expansion js-yaml` - passed.
- `npm --prefix web install --package-lock-only` - passed; lockfile remains internally consistent after exact version cleanup.
- `npm --prefix web audit --audit-level=high` - passed with exit 0. It still reports two moderate `next` -> vendored `postcss` findings, whose only npm-suggested fix is a breaking downgrade to `next@9.3.3`.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Web-Dependency-Audit-Burndown.md` | ~90 |
| `web/package.json` | ~4 |
| `web/package-lock.json` | ~399 |
| `HARDENING.md` | ~6 |
| Total | ~499 |

Over the 400 LOC soft cap. This slice is still kept together because the
lockfile refresh is the indivisible artifact that proves the high-severity audit
is actually clean.
