# Plan: Deflection service-token credential

## Why this slice exists

ATLAS now accepts scoped `atls_live_*` API keys for Content Ops deflection
routes. The portfolio app still reads only `ATLAS_B2B_JWT` when it submits CSVs
to ATLAS and fetches result snapshots/artifacts, so production remains tied to a
24-hour human login JWT. This slice moves the deployed portfolio runtime to a
durable service-token contract while keeping the JWT as a temporary rollout
fallback.

## Scope (this PR)

Slice phase: Production hardening

1. Make the server-only ATLAS deflection client prefer
   `ATLAS_B2B_SERVICE_TOKEN`, falling back to `ATLAS_B2B_JWT` during migration.
2. Update the live submit smoke to use the same credential precedence and report
   the new env name in missing-env diagnostics.
3. Add focused tests proving service-token preference, JWT fallback, and
   fail-closed missing-token behavior for the app client and live-submit smoke.

### Files touched

- `web/plans/PR-Deflection-Service-Token.md` - this plan doc.
- `web/src/lib/atlas-deflection-client.ts` - server-only ATLAS credential
  resolver.
- `web/scripts/smoke-deflection-live-submit.mjs` - hosted submit smoke env
  contract and auth header source.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - client credential
  precedence tests.
- `web/scripts/test-deflection-live-submit-smoke.mjs` - smoke credential
  precedence tests.

## Mechanism

The app keeps `ATLAS_API_BASE_URL` as the deployed ATLAS host. The bearer token
comes from a small resolver that checks `ATLAS_B2B_SERVICE_TOKEN` first and then
`ATLAS_B2B_JWT`. All submit, snapshot, and artifact calls already use the shared
config, so the change covers the full deflection funnel without changing request
paths or response parsing.

The live-submit smoke mirrors that precedence so operators can verify the same
production contract they deploy. Missing-token errors name
`ATLAS_B2B_SERVICE_TOKEN or ATLAS_B2B_JWT` instead of requiring only the expiring
JWT.

## Intentional

- `ATLAS_B2B_JWT` remains a fallback for one deploy window so the app can roll
  forward before the old env is removed.
- The service token is still server-only: no `NEXT_PUBLIC_` env is introduced,
  and the browser upload flow continues to call the portfolio API routes rather
  than ATLAS directly.
- This slice does not mint the API key or set Vercel env values; it makes the
  deployed app consume them correctly once provisioned.

## Deferred

- Provisioning remains operational: mint `atlas-portfolio-deflection-prod` with
  `content_ops:deflection:*`, set `ATLAS_B2B_SERVICE_TOKEN` in Vercel, redeploy,
  verify the live smoke, then remove `ATLAS_B2B_JWT`.
- Browser-upload and paid-unlock live smokes remain separate go-live checks after
  the env is deployed.
- Historical plan docs still mention the older JWT-only contract; active
  `web/src` and `web/scripts` references now either prefer the service token or
  test the temporary JWT fallback.

Parked hardening: none.

## Verification

- `npm --prefix web ci` - passed; installed this fresh worktree's dependencies.
- `npm --prefix web run test:deflection-intake-atlas-submit` - passed.
- `npm --prefix web run test:deflection-live-submit-smoke` - passed.
- `rg -n "ATLAS_B2B_JWT|ATLAS_B2B_SERVICE_TOKEN|envStatus\\.jwt|config\\.jwt" web/src web/scripts -S` - active references reviewed; no stale `envStatus.jwt` or `config.jwt` usage remains.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~75 |
| ATLAS deflection client | ~15 |
| Live submit smoke | ~15 |
| Focused tests | ~55 |
| **Total** | ~160 |
