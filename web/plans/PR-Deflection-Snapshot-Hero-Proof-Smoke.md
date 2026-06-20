# PR-Deflection-Snapshot-Hero-Proof-Smoke

## Why this slice exists

PR #335 added the Snapshot hero proof strip and gave it a stable
`heroProofStrip` smoke marker, but the existing Snapshot landing smoke does not
require that marker yet. A future edit could remove the proof strip while the
route smoke still passes. This slice closes that guard gap without changing the
landing-page UI.

## Scope (this PR)

Slice phase: Workflow/process

1. Add `heroProofStrip` to the public Snapshot landing smoke's required marker
   list.
2. Add the same marker to the mocked smoke fixture and marker-key assertions.
3. Add focused source assertions that the hero proof strip marker and uploaded
   window cost detail remain present.
4. Leave landing-page runtime code unchanged.

### Files touched

- `web/scripts/smoke-deflection-snapshot-landing.mjs` - require the hero proof strip marker.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - update fixture and source assertions.
- `web/plans/PR-Deflection-Snapshot-Hero-Proof-Smoke.md` - plan contract for this slice.

## Mechanism

The smoke script already parses `data-smoke` token lists from rendered HTML and
fails when any required token is missing. Adding `heroProofStrip` to
`REQUIRED_MARKERS` makes both production and local route smoke fail if the hero
proof strip disappears. The mocked smoke test fixture adds the marker so the
happy path still reflects the current page contract, and source-level assertions
cover the first-viewport proof marker plus the `over ${costProof.sourceWindowDays}
days` detail added during #335 review repair.

## Intentional

- No UI, copy, layout, or intake behavior changes.
- The smoke remains marker-based rather than visual-regression based.
- The test checks the existing source contract rather than introducing a new
  browser test harness in this small slice.

## Deferred

Full visual regression coverage for the Snapshot landing route remains deferred.

Parked hardening: none.

## Verification

- `npm --prefix web ci` - passed; npm reported 6 existing audit
  vulnerabilities.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| **Total** | **~75** |
