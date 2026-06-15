# Plan: Deflection paid artifact timeout

## Why this slice exists

The live full-funnel proof closed the Stripe unlock and delivery path, but the
hosted JuanCanfield result page still failed to show the paid report. After
rotating the stale production `ATLAS_B2B_SERVICE_TOKEN`, the snapshot page
started rendering again, but an unlocked request with ATLAS `artifact=200`
still rendered the locked snapshot. Vercel runtime logs show the root cause:
`deflection artifact fetch error: This operation was aborted`. The paid artifact
is much larger than the free snapshot, but `fetchDeflectionArtifact` still uses
the shared 10s small-JSON timeout.

## Scope (this PR)

Slice phase: Vertical slice

1. Give paid artifact fetches their own longer timeout budget.
2. Set the hosted result page route segment duration to match the paid artifact
   path.
3. Keep snapshot, checkout authorization, submit parsing, and status polling
   behavior unchanged.
4. Add focused coverage proving artifact fetches use the paid-artifact budget.

### Files touched

- `web/plans/PR-Deflection-Paid-Artifact-Timeout.md` - this plan.
- `web/src/lib/atlas-deflection-client.ts` - artifact-specific timeout.
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` - route segment duration.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - focused ATLAS client timeout test.

## Mechanism

`FETCH_TIMEOUT_MS` remains the small JSON timeout for snapshot, checkout
authorization, and report-status checks. A new `ARTIFACT_FETCH_TIMEOUT_MS`
constant is used only by `fetchDeflectionArtifact`, because the paid report JSON
can be multi-megabyte. The result page exports `maxDuration = 90`, leaving
route-level headroom above the 60s artifact fetch abort so a slow artifact fetch
can still fall back to the snapshot instead of racing the Vercel function
deadline.

## Intentional

- The artifact timeout is not reused for snapshots or status polling; those are
  still small JSON fetches and should fail fast.
- This does not change artifact validation or loosen fail-closed parsing.
- No retry loop is added. A slow artifact fetch gets enough budget to complete,
  but persistent upstream/network failure still falls back to the snapshot.

## Deferred

- Re-running a fresh paid live checkout after this PR deploys will provide the
  final paid-render proof for a non-revoked request.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-intake-atlas-submit` - passed.
- `npm --prefix web run lint -- src/lib/atlas-deflection-client.ts 'src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx' scripts/test-deflection-intake-atlas-submit.mjs` - passed.
- `bash scripts/local_pr_review.sh` - passed.
- Review follow-up: `npm --prefix web run test:deflection-intake-atlas-submit`
  and targeted lint passed after changing the route budget guard to assert
  `maxDuration * 1000 > ARTIFACT_FETCH_TIMEOUT_MS`.
- Live diagnostic before this PR: production token mismatch fixed, redeployed,
  locked snapshot URL renders `YOUR DEFLECTION SNAPSHOT`; unlocked request still
  logs artifact abort at the old 10s budget.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/plans/PR-Deflection-Paid-Artifact-Timeout.md` | 72 |
| `web/src/lib/atlas-deflection-client.ts` | 3 |
| `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` | 2 |
| `web/scripts/test-deflection-intake-atlas-submit.mjs` | 77 |
| **Total** | **154** |
