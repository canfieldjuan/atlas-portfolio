# PR-Deflection-Snapshot-Local-Smoke-Gate

## Why this slice exists

The Snapshot landing route now has several route-specific smoke markers guarding
the hero proof strip, submit-adjacent security reassurance, and separated trust
panel. CI already runs `test:deflection-snapshot-landing-smoke`, but the local
review gate does not, so a builder can pass local review while breaking the
exact guard this lane just added. This slice makes the local gate catch that
before review.

## Scope (this PR)

Slice phase: Workflow/process

1. Run the Snapshot landing smoke contract test from `scripts/local_pr_review.sh`.
2. Update `AGENTS.md` so the documented local gate matches the script.
3. Leave runtime UI, copy, routing, and CI workflow behavior unchanged.

### Files touched

- `scripts/local_pr_review.sh` - add the Snapshot landing smoke test to the local gate.
- `AGENTS.md` - document the added local gate step.
- `web/plans/PR-Deflection-Snapshot-Local-Smoke-Gate.md` - plan contract for this slice.

## Mechanism

`scripts/local_pr_review.sh` already runs focused local checks before lint and
build. This slice inserts `npm --prefix web run test:deflection-snapshot-landing-smoke`
as a named `run_check`, reusing the existing package script that CI already
executes. `AGENTS.md` adds the same step to the ordered local-review list so
future agents know the Snapshot route smoke is part of the local contract.

## Intentional

- This does not add a new smoke script or duplicate the CI workflow.
- The gate still avoids public network calls; the package script is the mocked
  contract test, not the live `smoke:deflection-snapshot-landing` command.
- No Snapshot page markup, layout, fields, copy, or security claims change.

## Deferred

Full browser visual regression coverage remains deferred.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web ci` - passed; npm reported 6 existing audit
  vulnerabilities.
- `bash scripts/local_pr_review.sh` - passed after installing this worktree's
  web dependencies; output included the new Snapshot landing smoke step.

## Estimated diff size

| File | LOC |
|---|---:|
| **Total** | **~69** |
