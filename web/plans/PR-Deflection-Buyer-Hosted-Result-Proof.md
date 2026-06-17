# Plan: Deflection buyer hosted result proof

## Why this slice exists

ATLAS issue #1612 moved the proof target back to the real buyer URL:
`/systems/support-ticket-deflection/results/{requestId}`. The current hosted
results smoke only proves the locked/free snapshot render. That leaves the paid
buyer surface under-proven even though the route can render either the current
model-backed report or the legacy artifact report after unlock.

This slice closes the script-level proof gap by letting the same public hosted
results smoke assert either buyer state: `snapshot` or `full-report`.

## Scope (this PR)

Slice phase: Functional validation

1. Add an explicit expected render state to the hosted results smoke:
   `snapshot` keeps the existing locked/free marker contract and `full-report`
   proves the unlocked paid report marker contract.
2. Reuse the paid report marker vocabulary already used by the paid-unlock
   smoke so the buyer hosted proof and unlock proof do not drift.
3. Fail closed when the expected buyer state does not match the rendered page
   state, including a locked snapshot shown during a `full-report` assertion.
4. Add focused mocked tests for both valid states and the state-mismatch/error
   branches.

### Files touched

- `web/plans/PR-Deflection-Buyer-Hosted-Result-Proof.md` - this plan doc.
- `web/scripts/smoke-deflection-hosted-results.mjs` - expected state option and paid report marker validation.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - focused coverage for snapshot/full-report render contracts.

## Mechanism

The script keeps fetching the public portfolio URL only:

```text
/systems/support-ticket-deflection/results/{requestId}
```

The existing snapshot marker check becomes one named render contract. A new
`full-report` contract uses the same paid markers as
`smoke-deflection-paid-unlock.mjs`: the paid badge, paid headline, report
contents/dashboard, SEO targeting list, ranked questions, and reviewer guidance
section. The full-report contract also rejects the locked CTA if it appears.

The CLI gains an option such as `--expect snapshot|full-report`, defaulting to
`snapshot` so existing operator commands keep their current behavior.

## Intentional

- This slice does not create a report, call Stripe, unlock payment, or call
  ATLAS private APIs. It proves the public buyer page render state for a supplied
  request id.
- The default remains the locked/free snapshot state to avoid surprising
  existing smoke invocations.
- The live proof run is separate from the code contract because it requires
  operator-provided request ids for a locked snapshot and an unlocked full
  report.

## Deferred

- Live production proof against real request ids: run this smoke once with
  `--expect snapshot` and once with `--expect full-report`, then attach the
  sanitized artifacts to the #1612 testing arc.
- Generating a fresh paid request through checkout remains in the paid-unlock
  smoke. This hosted-results smoke stays read-only.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-hosted-results-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| Plan doc | ~80 |
| Hosted-results smoke | ~55 |
| Focused tests | ~90 |
| Total | ~225 |
