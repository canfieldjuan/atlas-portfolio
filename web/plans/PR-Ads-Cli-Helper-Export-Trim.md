# Plan: Ads CLI helper export trim

## Why this slice exists

Issue #198 is draining the Knip baseline from #278 in focused,
verify-before-delete slices. After #282, the baseline still lists
`resolveRepoPath` in `web/scripts/ads-cli-helpers.mjs` as an unused export.
Reference checks show the helper is only called inside its own module by
`readJsonArtifact()` and `writeJsonArtifact()`, while external scripts import the
higher-level artifact helpers instead.

This trims one baseline finding without changing Google Ads, GA4, or deflection
smoke CLI behavior.

## Scope (this PR)

Slice phase: Workflow/process
Ownership lane: workflow/dead-code

1. Convert `resolveRepoPath()` from an exported function to a local module
   helper.
2. Remove the matching `exports` finding from `web/knip-baseline.json`.
3. Verify external scripts still import only the public CLI helper APIs they use
   and the Knip baseline drops to 17 known findings.

### Files touched

- `web/plans/PR-Ads-Cli-Helper-Export-Trim.md` - this plan doc.
- `web/scripts/ads-cli-helpers.mjs` - localize the repo-path resolver helper.
- `web/knip-baseline.json` - remove the resolved unused-export finding.

### Review Contract

Acceptance criteria:
- `resolveRepoPath()` remains available to same-file artifact readers/writers
  but is no longer exported.
- No external script imports or calls `resolveRepoPath()`.
- `web/knip-baseline.json` removes only the matching
  `scripts/ads-cli-helpers.mjs` / `resolveRepoPath` finding.
- Dead-code checking reports 17 known findings after the trim.

Affected surfaces:
- Shared Node CLI helper module used by Google Ads, GA4, and deflection smoke
  scripts.
- Knip baseline drift checker.

Risk areas:
- Accidentally removing or changing `readJsonArtifact()` / `writeJsonArtifact()`
  behavior would affect multiple CLI scripts.
- Trimming unrelated Knip findings would make this slice harder to review.

Triggered reviewer rules:
- R1 Requirements match.
- R2 Test evidence.
- R11 Scope control.

## Mechanism

The helper body stays unchanged:

```js
function resolveRepoPath(path) {
  return isAbsolute(path) ? path : resolve(repoRoot, path);
}
```

Only the `export` keyword is removed. The two same-file callers keep using the
helper for relative-path resolution against `repoRoot`, so JSON artifact read
and write behavior remains the same.

## Intentional

- This does not alter CLI argument parsing, failure formatting, artifact read or
  write payload shape, output-path inclusion, or filesystem paths.
- This does not trim Google Ads env/API helper exports, analytics exports,
  unused files, or unused landing/report contract types.
- This stays a workflow/process slice because it only drains the committed Knip
  baseline.

## Deferred

- Continue draining remaining Knip baseline findings in focused slices only
  after reference checks prove they are safe.
- Final legacy Blob token removal remains gated on legacy-store rows aging out.
- Legacy Stripe `sk_test_` fallback cleanup remains gated on Preview/test mode
  using an `rk_test_` restricted key.

Parked hardening: none.

## Verification

- `node -e "JSON.parse(require('fs').readFileSync('web/knip-baseline.json','utf8')); console.log('valid json')"` -
  passed; baseline JSON remains valid.
- `rg -n "resolveRepoPath|ads-cli-helpers" web/scripts web/src web/package.json web/knip-baseline.json -S` -
  passed; `resolveRepoPath()` remains local to `ads-cli-helpers.mjs`, the
  baseline entry is gone, and external scripts import only the public helpers.
- `npm --prefix web run test:ads-helpers` - passed; printed `Advertising CLI
  helper tests passed.`
- `npm --prefix web run check:dead-code` - passed; Knip baseline now matches 17
  known findings.
- `npm --prefix web run test:dead-code-baseline` - passed; printed `Knip
  baseline checker tests passed.`
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed; compiled successfully, TypeScript
  finished, generated `44/44` static pages, and copied the deterministic routes
  manifest.
- `bash scripts/local_pr_review.sh` - passed; plan shape, files touched,
  diff-size, drift advisory, dead-code baseline, ESLint, Next build, and
  whitespace checks passed.

## Estimated diff size

| Area | LOC |
|---|---:|
| Plan doc | ~118 |
| CLI helper export trim | ~2 |
| Knip baseline update | ~5 |
| Total | ~125 |
