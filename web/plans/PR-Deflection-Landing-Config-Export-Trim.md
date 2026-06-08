# Plan: Deflection landing config export trim

## Why this slice exists

Issue #198 now has the Knip baseline from #278, and the first baseline-driven
cleanup item is narrow: `GAP_REPORT_INTAKE_HREF` in
`web/src/app/systems/support-ticket-deflection/landingConfig.tsx` is exported
but only consumed inside that same file. The file itself is still active because
`landingConfig-v2.tsx` and the partner page import shared pricing data from it,
so this slice trims only the unused export and updates the baseline.

## Scope (this PR)

Slice phase: Workflow/process

1. Convert `GAP_REPORT_INTAKE_HREF` from an exported constant to a local module
   constant.
2. Remove the matching `exports` finding from `web/knip-baseline.json`.
3. Verify Knip remains green with 21 known findings and that no external source
   references `GAP_REPORT_INTAKE_HREF`.

### Files touched

- `web/plans/PR-Deflection-Landing-Config-Export-Trim.md` - this plan doc.
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` - localize the intake href constant.
- `web/knip-baseline.json` - remove the resolved unused-export finding.

## Mechanism

The pricing tier config still uses the same href value in the same module:

```ts
const GAP_REPORT_INTAKE_HREF = '/systems/support-ticket-deflection/intake';
```

Removing `export` keeps runtime behavior unchanged while making the Knip
baseline accurately reflect that the unused exported symbol has been resolved.

## Intentional

- This does not delete `landingConfig.tsx`; the module remains active because
  `pricingTiers` and `pricingFaqs` are imported by the current v2/partner
  surfaces.
- This does not trim other baseline findings. Each baseline reduction should be
  independently reviewed and tracked against #198.
- This stays a workflow/process slice because it is a dead-code baseline drain,
  not product behavior or copy.

## Deferred

- Continue draining the remaining Knip baseline findings in focused slices.
- Final legacy Blob token removal remains gated on legacy-store rows aging out.
- Legacy Stripe `sk_test_` fallback cleanup remains gated on Preview/test mode
  using an `rk_test_` restricted key.

Parked hardening: none.

## Verification

- `rg -n "GAP_REPORT_INTAKE_HREF" web/src web/knip-baseline.json -S` -
  passed; the symbol remains only as a local constant plus same-file pricing
  tier references, with no baseline entry.
- `npm --prefix web run check:dead-code` - passed; Knip baseline now matches 21
  known findings.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC |
|---|---:|
| Plan doc | ~70 |
| Constant export trim | ~1 |
| Knip baseline update | ~5 |
| Total | ~76 |
