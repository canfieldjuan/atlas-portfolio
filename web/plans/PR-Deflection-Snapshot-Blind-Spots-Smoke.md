# PR-Deflection-Snapshot-Blind-Spots-Smoke

## Why this slice exists

PR #327 added the no-proven-answer blind-spots section to the public Snapshot
artifact, and the review called out one optional follow-up: the live Snapshot
landing smoke would not catch that section silently disappearing. Now that the
section is part of the validated artifact, the route smoke should guard it the
same way it guards the hero proof strip and intake trust markers.

## Scope (this PR)

Slice phase: Workflow/process

1. Add a stable `blindSpots` smoke marker to the Snapshot artifact's
   no-proven-answer section.
2. Require that marker in the Snapshot landing smoke.
3. Update the smoke fixture, marker-key assertions, and source assertion.
4. Leave visible copy, layout, data shape, and backend behavior unchanged.

### Files touched

- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - add the blind-spots smoke marker.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` - require the marker.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - update fixture and source assertions.
- `web/plans/PR-Deflection-Snapshot-Blind-Spots-Smoke.md` - plan contract for this slice.

## Mechanism

The blind-spots section is already gated by `top_blind_spots.length > 0` and
renders from `DEMO_DEFLECTION_SNAPSHOT` on the public Snapshot route. This slice
adds `data-smoke="blindSpots"` to that existing section. The Snapshot landing
smoke parses rendered `data-smoke` tokens, so adding `blindSpots` to
`REQUIRED_MARKERS` makes both CI and the local review gate fail if the public
artifact loses the no-proven-answer quadrant. The mocked fixture and static
source assertion move with the smoke contract.

## Intentional

- No visible text changes.
- No layout, field, intake, result contract, or backend changes.
- This follows the reviewer suggestion as a guard slice instead of expanding the
  functional-validation PR after it was already LGTM.

## Deferred

Backend emission of real uploaded blind spots remains outside this frontend
landing-smoke slice.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web ci` - passed; npm reported 6 existing audit
  vulnerabilities.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| **Total** | **~72** |
