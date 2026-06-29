# PR-Google-Ads-Env-Export-Trim

## Why this slice exists

Issue #198 tracks verified dead-code cleanup. After the `ads-spec-io.mjs` export
trim, the Knip baseline still reports three unused exports from
`web/scripts/google-ads-env.mjs`: `DEFAULT_GOOGLE_ADS_API_VERSION`,
`REQUIRED_GOOGLE_ADS_ENV`, and `OPTIONAL_GOOGLE_ADS_ENV`. Reference checks show
those constants are only consumed inside the same module by the public env helper
functions, so they can be localized without changing Google Ads behavior.

## Scope (this PR)

Slice phase: Production hardening

1. Localize the three Google Ads env constants by removing only their `export`
   keywords.
2. Remove the three resolved findings from `web/knip-baseline.json`.
3. Leave artifact contract freshness, file-level findings, and gated legacy
   cleanup untouched.

### Files touched

- `web/scripts/google-ads-env.mjs` -- localize the three module-internal env
  constants.
- `web/knip-baseline.json` -- remove the resolved Knip baseline findings.
- `web/plans/PR-Google-Ads-Env-Export-Trim.md` -- this plan.

## Mechanism

`DEFAULT_GOOGLE_ADS_API_VERSION`, `REQUIRED_GOOGLE_ADS_ENV`, and
`OPTIONAL_GOOGLE_ADS_ENV` remain in the module and continue to feed
`validateGoogleAdsEnv()` and `googleAdsApiVersion()`. Removing the export
modifier only shrinks the public module surface; callers still use
`validateGoogleAdsEnv()`, `invalidGoogleAdsEnvErrors()`, `googleAdsApiVersion()`,
and the masking helpers.

## Intentional

- This does not touch `GOOGLE_ADS_ARTIFACT_FRESHNESS_HOURS`; it is a separate
  baseline item in a different module.
- This does not remove whole files that Knip reports. File-level cleanup needs a
  separate route/build/reference check.
- This is a baseline drain only; no product behavior changes.

## Deferred

- Remaining Knip baseline findings.
- Legacy Blob token fallback removal after the old store is no longer needed.
- Legacy Stripe test-key fallback removal after a test-mode restricted key path
  is confirmed.

Parked hardening: none.

## Verification

- `rg -n "DEFAULT_GOOGLE_ADS_API_VERSION|REQUIRED_GOOGLE_ADS_ENV|OPTIONAL_GOOGLE_ADS_ENV" web --glob '!node_modules/**'`
  -- passed; remaining hits are the localized constants, same-module consumers,
  and this plan.
- `rg -n "from './google-ads-env\.mjs'|from \"./google-ads-env\.mjs\"|google-ads-env\.mjs" web/scripts web/src web/package.json web/plans --glob '!node_modules/**'`
  -- passed; callers import public helpers, not the localized constants.
- `npm --prefix web run check:dead-code` -- passed; Knip baseline now matches 8
  known findings.
- `npm --prefix web run test:google-ads-api` -- passed.
- `npm --prefix web run test:ads-helpers` -- passed.
- `npm --prefix web run test:google-ads-artifacts` -- passed.
- `npm --prefix web run lint` -- passed.
- `npm --prefix web run build` -- passed. Next emitted the existing
  edge-runtime static-generation warning while generating all 48 pages.
- `git diff --check` -- passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/scripts/google-ads-env.mjs` | ~3 |
| `web/knip-baseline.json` | ~15 |
| `web/plans/PR-Google-Ads-Env-Export-Trim.md` | ~66 |
| Total | ~84 |
