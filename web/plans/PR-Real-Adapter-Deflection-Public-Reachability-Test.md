# Real Adapter Deflection Public Reachability Test

## Why this slice exists

The public-reachability smoke guard still runs as a standalone Node test
harness. It already exercises the real public reachability smoke runner with a
mocked fetch boundary and carries source-level guards for the Resolution Audit
entry copy, so it should move into the Vitest lane without weakening either
side of that contract.

## Scope (this PR)

Slice phase: Robust testing

1. Move `test:deflection-public-reachability-smoke` from a Node harness to
   Vitest.
2. Keep using the real `runDeflectionPublicReachabilitySmoke` adapter from the
   production smoke script.
3. Preserve coverage for landing/intake render markers, exact marker tokens,
   dormant Next.js not-found payload handling, intake CTA href validation,
   invalid base-url fail-closed behavior, and source-level Resolution Audit /
   partner-copy guards.

### Files touched

- `web/package.json` — point the existing npm script at Vitest.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` — remove the legacy Node harness.
- `web/src/lib/deflection-public-reachability-smoke.test.mjs` — add the Vitest replacement.
- `web/plans/PR-Real-Adapter-Deflection-Public-Reachability-Test.md` — plan for this slice.

## Mechanism

The new Vitest file imports `runDeflectionPublicReachabilitySmoke` directly from
`web/scripts/smoke-deflection-public-reachability.mjs`. Runtime checks stub only
`fetch` and the clock, then assert the real smoke result and fetch sequence.
Source-level guards remain source reads, grouped into focused expectations for
intake copy, route metadata, non-partner entry surfaces, partner copy overrides,
stale delivery language, and the intake helper exports that those source guards
depend on.

## Intentional

- This is a test-harness migration only; the production public reachability
  smoke script is not changed.
- Public page requests stay mocked because this `test:*` script is the unit
  guard; the live smoke command remains `smoke:deflection-public-reachability`.
- `HARDENING.md` was scanned before starting. No active parked item touches this
  public reachability smoke guard area.

## Deferred

The remaining browser-heavy deflection smoke scripts remain as Node harnesses
and will be migrated in later slices.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-public-reachability-smoke` — passed; 1 test file / 18 tests.
- `node web/scripts/audit-test-enrollment.mjs` — passed; all 39 `test:*` scripts are enrolled.
- `npm --prefix web run lint` — passed.
- `rg -n "test-deflection-public-reachability-smoke\\.mjs|node scripts/test-deflection-public-reachability-smoke" web/package.json web/src/lib/deflection-public-reachability-smoke.test.mjs web/scripts || true` — no matches; the legacy harness command is gone.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~78 |
| Vitest replacement | ~350 |
| Package script update | ~2 |
| Legacy harness deletion | ~432 |
| Total | ~862 |

This is over the 400 LOC soft cap because the existing harness is 432 lines and
the migrated test must preserve both the runtime reachability matrix and the
source-level copy/metadata guards. Splitting those apart would leave the legacy
harness in place or temporarily weaken one side of the public funnel contract.
