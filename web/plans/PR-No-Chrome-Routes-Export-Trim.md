# Plan: No-chrome routes export trim

## Why this slice exists

Issue #198 is draining the Knip baseline from #278 in focused, verified slices.
After #281, `web/src/lib/no-chrome-routes.ts` still has two same-file findings:
`NO_CHROME_ROUTES` is exported but only used inside the module, and the exported
`NoChromeRoute` type is not imported anywhere. External callers use only
`shouldHideChrome()`.

This trims those unnecessary exports without changing which routes hide
Navigation/Footer chrome.

## Scope (this PR)

Slice phase: Workflow/process

1. Convert `NO_CHROME_ROUTES` from an exported constant to a local module
   constant.
2. Remove the unused `NoChromeRoute` type.
3. Remove both matching findings from `web/knip-baseline.json`.
4. Verify external callers still import only `shouldHideChrome()` and the Knip
   baseline drops to 18 known findings.

### Files touched

- `web/plans/PR-No-Chrome-Routes-Export-Trim.md` - this plan doc.
- `web/src/lib/no-chrome-routes.ts` - localize the route list and type.
- `web/knip-baseline.json` - remove the resolved unused export/type findings.

## Mechanism

The route list stays available inside the module:

```ts
const NO_CHROME_ROUTES = [...] as const;
```

`shouldHideChrome()` keeps using the same route list and remains the only public
API for Navigation, Footer, and SiteChrome callers.

## Intentional

- This drains two findings in one PR because they are coupled in the same file:
  the exported type is derived from the exported list and neither has an external
  caller.
- This does not change the no-chrome route set, prefix handling, or caller
  imports.
- This does not trim unrelated Knip findings.

## Deferred

- Continue draining remaining Knip baseline findings in focused slices.
- Final legacy Blob token removal remains gated on legacy-store rows aging out.
- Legacy Stripe `sk_test_` fallback cleanup remains gated on Preview/test mode
  using an `rk_test_` restricted key.

Parked hardening: none.

## Verification

- `node -e "JSON.parse(require('fs').readFileSync('web/knip-baseline.json','utf8'))"` -
  passed; baseline JSON is valid after removing the two findings.
- `rg -n "NO_CHROME_ROUTES|NoChromeRoute|shouldHideChrome" web/src web/scripts web/knip-baseline.json -S` -
  passed; `NO_CHROME_ROUTES` remains local to `no-chrome-routes.ts`, no
  `NoChromeRoute` references remain, and external callers import only
  `shouldHideChrome`.
- `npm --prefix web run check:dead-code` - passed; Knip baseline now matches 18
  known findings.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC |
|---|---:|
| Plan doc | ~76 |
| No-chrome export trim | ~5 |
| Knip baseline update | ~10 |
| Total | ~91 |
