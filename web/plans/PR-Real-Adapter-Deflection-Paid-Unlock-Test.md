# Real Adapter Deflection Paid Unlock Test

## Why this slice exists

The paid-unlock smoke guard still runs as a standalone Node test harness. It
already exercises the real paid-unlock smoke runner, including the protected
preview `vercel curl` transport and paid report render markers, so it should
move into the Vitest lane without changing the live smoke command.

## Scope (this PR)

Slice phase: Robust testing

1. Move `test:deflection-paid-unlock-smoke` from a Node harness to Vitest.
2. Keep using the real `runDeflectionPaidUnlockSmoke` and `makeVercelCurlFetch`
   adapters from the production smoke script.
3. Preserve coverage for already-unlocked reports, strict `--require-unlocked`
   mode, created and provided Checkout URLs, live Checkout fail-closed behavior,
   invalid request/base input, status/checkout/unlock/render failures, protected
   preview `vercel curl`, locked-marker detection, and paid artifact source
   copy/layout guards.

### Files touched

- `web/package.json` — point the existing npm script at Vitest.
- `web/scripts/test-deflection-paid-unlock-smoke.mjs` — remove the legacy Node harness.
- `web/src/lib/deflection-paid-unlock-smoke.test.mjs` — add the Vitest replacement.
- `web/plans/PR-Real-Adapter-Deflection-Paid-Unlock-Test.md` — plan for this slice.

## Mechanism

The new Vitest file imports `runDeflectionPaidUnlockSmoke` and
`makeVercelCurlFetch` directly from `web/scripts/smoke-deflection-paid-unlock.mjs`.
Runtime checks stub only fetch, time, sleep, attempt-id generation, awaiting
payment callbacks, and `vercel curl` process execution. Source-level paid report
guards remain source reads against `DeflectionReportArtifactPage.tsx`.

## Intentional

- This is a test-harness migration only; the production paid-unlock smoke script
  is not changed.
- Stripe, status, and hosted result calls stay mocked because this `test:*`
  script is the unit guard; the live smoke command remains
  `smoke:deflection-paid-unlock`.
- `HARDENING.md` was scanned before starting. No active parked item touches this
  paid-unlock smoke guard area.

## Deferred

The remaining hosted-results smoke script remains as a Node harness and will be
migrated in the final slice of this lane.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-paid-unlock-smoke` — passed; 1 test file / 24 tests.
- `node web/scripts/audit-test-enrollment.mjs` — passed; all 39 `test:*` scripts are enrolled.
- `npm --prefix web run lint` — passed.
- `rg -n "test-deflection-paid-unlock-smoke\\.mjs|node scripts/test-deflection-paid-unlock-smoke" web/package.json web/src/lib/deflection-paid-unlock-smoke.test.mjs web/scripts || true` — no matches; the legacy harness command is gone.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~76 |
| Vitest replacement | ~503 |
| Package script update | ~2 |
| Legacy harness deletion | ~495 |
| Total | ~1076 |

This is over the 400 LOC soft cap because the existing harness is 495 lines and
the migrated test must preserve the paid-unlock state machine, protected-preview
transport checks, and paid artifact source guards. Splitting it would leave the
legacy harness in place or temporarily weaken one of the paid path contracts.
