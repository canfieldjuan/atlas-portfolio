# PR-Google-Ads-Artifact-Freshness-Export-Trim

## Why this slice exists

Issue #198 tracks verified dead-code cleanup. After the Google Ads env export
trim, the remaining Knip baseline export finding is
`GOOGLE_ADS_ARTIFACT_FRESHNESS_HOURS` in
`web/scripts/google-ads-artifact-contracts.mjs`. Reference checks show the map is
used only inside that module by `freshnessHoursForType()`, while callers use the
public `validateArtifactFreshness()` helper.

## Scope (this PR)

Slice phase: Production hardening

1. Localize `GOOGLE_ADS_ARTIFACT_FRESHNESS_HOURS` by removing only its `export`
   keyword.
2. Remove the resolved finding from `web/knip-baseline.json`.
3. Leave file-level and type-level Knip findings untouched.

### Files touched

- `web/scripts/google-ads-artifact-contracts.mjs` -- localize the module-internal
  freshness-hour map.
- `web/knip-baseline.json` -- remove the resolved Knip baseline finding.
- `web/plans/PR-Google-Ads-Artifact-Freshness-Export-Trim.md` -- this plan.

## Mechanism

`GOOGLE_ADS_ARTIFACT_FRESHNESS_HOURS` remains in the module and continues to feed
`freshnessHoursForType()`, which in turn powers `validateArtifactFreshness()`.
Removing the export modifier only shrinks the module's public API; no caller is
changed.

## Intentional

- This completes the remaining export-style Knip baseline drain, but does not
  remove whole files or public types.
- This is a baseline drain only; no product behavior changes.

## Deferred

- Remaining file-level and type-level Knip baseline findings.
- Legacy Blob token fallback removal after the old store is no longer needed.
- Legacy Stripe test-key fallback removal after a test-mode restricted key path
  is confirmed.

Parked hardening: none.

## Verification

- `rg -n "GOOGLE_ADS_ARTIFACT_FRESHNESS_HOURS|freshnessHoursForType|validateArtifactFreshness" web --glob '!node_modules/**'`
  -- passed; the freshness map remains local to
  `google-ads-artifact-contracts.mjs`, while callers use
  `validateArtifactFreshness()`.
- `rg -n "from './google-ads-artifact-contracts\.mjs'|from \"./google-ads-artifact-contracts\.mjs\"|google-ads-artifact-contracts\.mjs" web/scripts web/src web/package.json web/plans --glob '!node_modules/**'`
  -- passed; callers import public artifact helpers, not the localized map.
- `npm --prefix web run check:dead-code` -- passed; Knip baseline now matches 7
  known findings.
- `npm --prefix web run test:google-ads-artifacts` -- passed.
- `npm --prefix web run lint` -- passed.
- `npm --prefix web run build` -- passed. Next emitted the existing
  edge-runtime static-generation warning while generating all 48 pages.
- `git diff --check` -- passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/scripts/google-ads-artifact-contracts.mjs` | ~1 |
| `web/knip-baseline.json` | ~5 |
| `web/plans/PR-Google-Ads-Artifact-Freshness-Export-Trim.md` | ~61 |
| Total | ~67 |
