# Plan: Google Ads API format export trim

## Why this slice exists

Issue #198 is draining the Knip baseline from #278 in focused,
verify-before-delete slices. After #287, the baseline still lists
`formatDashedCustomerId` in `web/scripts/google-ads-api.mjs` as an unused
export. Reference checks show it is only called inside the same module by
`sanitizeGoogleAdsMessage()` to mask dashed Google Ads customer IDs.

This trims one baseline finding without changing Google Ads API request,
pagination, OAuth, or sanitizer behavior.

## Scope (this PR)

Slice phase: Workflow/process
Ownership lane: workflow/dead-code

1. Convert `formatDashedCustomerId()` from an exported function to a local
   module helper.
2. Remove the matching `exports` finding from `web/knip-baseline.json`.
3. Verify external scripts still import only the public Google Ads API helpers
   they use and the Knip baseline drops to 16 known findings.

### Files touched

- `web/plans/PR-Google-Ads-Api-Format-Export-Trim.md` - this plan doc.
- `web/scripts/google-ads-api.mjs` - localize the dashed customer-id formatter.
- `web/knip-baseline.json` - remove the resolved unused-export finding.

### Review Contract

Acceptance criteria:
- `formatDashedCustomerId()` remains available to
  `sanitizeGoogleAdsMessage()` but is no longer exported.
- No external script imports or calls `formatDashedCustomerId()`.
- `web/knip-baseline.json` removes only the matching
  `scripts/google-ads-api.mjs` / `formatDashedCustomerId` finding.
- Dead-code checking reports 16 known findings after the trim.

Affected surfaces:
- Shared Google Ads API helper module.
- Advertising CLI helper test coverage for customer-id sanitization.
- Knip baseline drift checker.

Risk areas:
- Accidentally changing sanitizer behavior could leak raw dashed or undashed
  Google Ads customer IDs in error output.
- Trimming unrelated Knip findings would make this slice harder to review.

Triggered reviewer rules:
- R1 Requirements match.
- R2 Test evidence.
- R11 Scope control.

## Mechanism

The helper body stays unchanged:

```js
function formatDashedCustomerId(value) {
  const normalized = normalizeCustomerId(value);
  if (normalized.length !== 10) {
    return normalized;
  }

  return `${normalized.slice(0, 3)}-${normalized.slice(3, 6)}-${normalized.slice(6)}`;
}
```

Only the `export` keyword is removed. `sanitizeGoogleAdsMessage()` keeps using
the helper when replacing dashed customer IDs with masked values.

## Intentional

- This does not alter Google Ads OAuth, request headers, GAQL escaping,
  pagination, mutation behavior, or sanitizer replacement rules.
- This does not trim Google Ads env/artifact helper exports, analytics exports,
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
- `rg -n "formatDashedCustomerId|google-ads-api" web/scripts web/src web/package.json web/knip-baseline.json -S` -
  passed; `formatDashedCustomerId()` remains local to `google-ads-api.mjs`, the
  baseline entry is gone, and external scripts import only public API helpers.
- `npm --prefix web run test:ads-helpers` - passed; printed `Advertising CLI
  helper tests passed.`
- `npm --prefix web run test:google-ads-api` - passed; printed `Google Ads API
  pagination tests passed.`
- `npm --prefix web run check:dead-code` - passed; Knip baseline now matches 16
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
| Plan doc | ~123 |
| Google Ads API export trim | ~2 |
| Knip baseline update | ~5 |
| Total | ~130 |
