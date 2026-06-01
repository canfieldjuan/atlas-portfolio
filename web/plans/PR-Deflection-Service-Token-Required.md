# Plan: Deflection service token required

## Why this slice exists

Production has completed the deflection credential cutover: Vercel Production
now has `ATLAS_B2B_SERVICE_TOKEN`, the legacy Production `ATLAS_B2B_JWT` was
removed, production was redeployed, and the browser-upload plus paid-render
smokes passed against `juancanfield.com`.

The code still accepts `ATLAS_B2B_JWT` as a temporary fallback. Leaving that
fallback in active runtime and smoke code allows a future env regression to
silently reintroduce a short-lived human JWT. This slice locks the durable
service-token contract into code.

## Scope (this PR)

Slice phase: Production hardening

1. Require `ATLAS_B2B_SERVICE_TOKEN` in the server-only ATLAS deflection client.
2. Require `ATLAS_B2B_SERVICE_TOKEN` in the live submit smoke diagnostics and
   auth header source.
3. Update focused tests to prove service-token use and fail-closed missing-token
   behavior, with no JWT fallback fixtures.
4. Update the active paid-unlock runbook to state that the JWT fallback is
   retired.

### Files touched

- `web/plans/PR-Deflection-Service-Token-Required.md` - this plan doc.
- `web/src/lib/atlas-deflection-client.ts` - service-token-only runtime resolver.
- `web/scripts/smoke-deflection-live-submit.mjs` - service-token-only smoke env contract.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - focused client env tests.
- `web/scripts/test-deflection-live-submit-smoke.mjs` - focused smoke env tests.
- `web/docs/landing-page-framework/deflection-paid-unlock-go-live-smoke.md` -
  active go-live runbook note.

## Mechanism

The credential resolver becomes:

```ts
const token = process.env.ATLAS_B2B_SERVICE_TOKEN?.trim();
```

No code path reads `ATLAS_B2B_JWT` for the deflection funnel after this PR. If
the service token is missing, the existing fail-closed behavior remains:
snapshots/artifacts return `not_configured` and the live-submit smoke exits
before network calls.

## Intentional

- Historical plan docs still mention the old JWT-era setup. They are left
  unchanged as audit history, and the verification grep names them explicitly.
- Preview env cleanup is operational, not a code diff. Preview already has
  `ATLAS_B2B_SERVICE_TOKEN`; the remaining Preview `ATLAS_B2B_JWT` can be
  removed alongside this cutover.
- This does not change request paths, response parsing, Stripe behavior, or Blob
  upload behavior.

## Deferred

- Rotating the service token itself remains an ATLAS/platform operation.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-intake-atlas-submit` - passed.
- `npm --prefix web run test:deflection-live-submit-smoke` - passed.
- `rg -n "ATLAS_B2B_JWT|ATLAS_B2B_SERVICE_TOKEN or ATLAS_B2B_JWT|JWT fallback" web/src web/scripts web/docs web/plans/PR-Deflection-Service-Token-Required.md web/plans/PR-Deflection-Service-Token.md web/plans/PR-Deflection-Intake-Atlas-Submit.md web/plans/PR-Deflection-Live-Submit-Smoke.md web/plans/PR-Deflection-Snapshot-Live-Fetch.md` - passed; no `web/src` or `web/scripts` references remain, only historical plan docs plus this PR's retirement note/runbook note.
- `vercel env rm ATLAS_B2B_JWT preview --yes` - passed; `vercel env ls` confirmed Preview and Production both have `ATLAS_B2B_SERVICE_TOKEN` and neither has `ATLAS_B2B_JWT`.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~85 |
| Runtime/smoke code | ~10 |
| Focused tests | ~35 |
| Runbook | ~5 |
| **Total** | ~135 |
