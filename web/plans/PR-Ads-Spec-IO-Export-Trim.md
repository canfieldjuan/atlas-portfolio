# PR-Ads-Spec-IO-Export-Trim

## Why this slice exists

Issue #198 tracks verified dead-code cleanup. The current Knip baseline includes
three unused exports from `web/scripts/ads-spec-io.mjs`: `specDir`, `readJson`,
and `readCsv`. Reference checks show those names are used only inside
`ads-spec-io.mjs` itself, so they can be localized without changing the
advertising spec loader behavior.

## Scope (this PR)

Slice phase: Production hardening

1. Localize `specDir`, `readJson`, and `readCsv` in `ads-spec-io.mjs` by removing
   only their `export` keywords.
2. Remove the three resolved findings from `web/knip-baseline.json`.
3. Leave whole-file cleanup candidates and gated legacy-token work untouched.

### Files touched

- `web/scripts/ads-spec-io.mjs` -- localize the three module-internal helpers.
- `web/knip-baseline.json` -- remove the resolved Knip baseline findings.
- `web/plans/PR-Ads-Spec-IO-Export-Trim.md` -- this plan.

## Mechanism

The helper module already calls `specDir`, `readJson`, and `readCsv` internally
from `resolveSpecFile()` and `loadCampaignSpec()`. No other source import uses
those symbols. Removing their `export` keywords keeps runtime behavior the same
while shrinking the public module surface. The Knip baseline then drops from 14
known findings to 11 when rechecked.

## Intentional

- This does not remove `scripts/audit-test-enrollment.mjs`; Knip sees it as an
  unused file, but the GitHub workflow invokes it directly.
- This does not touch `ContentOpsDemo.tsx`,
  `DiagnosticReportLandingPage.tsx`, calculator routes, legacy Blob token
  fallback, or ATLAS `portfolio-ui/`. Those need separate verification or
  operator sign-off.
- This is a baseline drain only; no product behavior changes.

## Deferred

- Remaining Knip baseline findings.
- Legacy Blob token fallback removal after the old store is no longer needed.
- Legacy Stripe test-key fallback removal after a test-mode restricted key path
  is confirmed.

Parked hardening: none.

## Verification

- `rg -n "\b(specDir|readJson|readCsv)\b" web --glob '!node_modules/**'` --
  passed; no import site uses the localized `ads-spec-io.mjs` helpers, and
  remaining same-name hits are local helpers in unrelated tests/scripts.
- `rg -n "from './ads-spec-io\.mjs'|from \"./ads-spec-io\.mjs\"|ads-spec-io\.mjs" web/scripts web/src web/package.json web/plans --glob '!node_modules/**'`
  -- passed; external callers import only `repoRoot` and `loadCampaignSpec`.
- `npm --prefix web run check:dead-code` -- passed; Knip baseline now matches 11
  known findings.
- `npm --prefix web run test:ads-helpers` -- passed.
- `npm --prefix web run test:google-ads-artifacts` -- passed.
- `npm --prefix web run lint` -- passed.
- `npm --prefix web run build` -- passed. Next emitted the existing
  edge-runtime static-generation warning while generating all 48 pages.
- `git diff --check` -- passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/scripts/ads-spec-io.mjs` | ~3 |
| `web/knip-baseline.json` | ~15 |
| `web/plans/PR-Ads-Spec-IO-Export-Trim.md` | ~64 |
| Total | ~82 |
