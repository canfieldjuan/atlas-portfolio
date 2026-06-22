# Plan: Demo Snapshot fidelity

Issue #363 identified that the landing demo Snapshot is already structurally
close to the real ATLAS snapshot payload, but it still needs guardrails around
the cases the real generator now emits: non-resequenced blind-spot ranks, empty
blind spots, and absent source-date windows.

## Why this slice exists

- The public demo should stay truthful to the real `snapshot_safe` projection
  emitted by ATLAS after `top_blind_spots` became a real Snapshot field.
- Real blind spots preserve the original question ranks instead of resequencing
  to `1..N`; the populated demo currently makes them look sequential.
- Clean uploads can have `top_blind_spots: []` and no `source_date_*` summary
  fields, so the smoke test should cover that branch before copy relies on it.

## Scope (this PR)

Slice phase: Functional validation

1. Track the real generated Snapshot/report-model ground-truth payload named in
   issue #363 and correct its stale blind-spot delta note.
2. Keep the primary demo populated for the live blind-spots smoke marker, but
   change its blind-spot ranks to mirror real non-resequenced ranks.
3. Add a second demo fixture for the clean-upload branch: empty blind spots and
   no source-date window.
4. Extend the Snapshot landing smoke test so it validates the demo fixtures
   against the real payload shape and the empty/no-window branch.

### Files touched

- `web/plans/PR-Demo-Snapshot-Fidelity.md` - this plan contract.
- `web/plans/deflection-snapshot-report-groundtruth.json` - real generated ATLAS reference payload used by the fixture test.
- `web/src/lib/deflection-snapshot.ts` - demo Snapshot fixture fidelity updates.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - fixture-shape and empty-branch assertions.

## Mechanism

- The ground-truth JSON remains an inert plan/reference artifact, but the smoke
  test reads it to compare the demo's top-level Snapshot keys and blind-spot
  field set against the real emitted payload.
- `DEMO_DEFLECTION_SNAPSHOT` keeps a populated `top_blind_spots` array so the
  existing live marker remains exercised, while its ranks become non-sequential
  to match ATLAS preserving original unresolved-question ranks.
- A new exported clean-upload fixture reuses the demo shape with
  `top_blind_spots: []` and a summary that intentionally omits `source_date_*`.
  The landing component already guards both branches, so this slice validates
  the contract without changing layout.
- The smoke test compiles `web/src/lib/deflection-snapshot.ts` with TypeScript's
  existing `transpileModule` pattern, imports the fixtures, and asserts their
  runtime shape.

## Intentional

- This does not surface the backend's optional summary superset fields in the
  landing UI; the parser can continue ignoring them until a product need exists.
- This does not change Snapshot copy, pricing copy, PII/security copy, checkout
  behavior, or ATLAS endpoint wiring.
- This does not empty the primary demo's blind spots because that would silently
  remove the `blindSpots` smoke marker from the live landing monitor.

## Deferred

- The optional backend summary fields
  (`non_repeat_ticket_count`, `support_ticket_resolution_evidence_present`, and
  `support_ticket_resolution_evidence_count`) remain reference-only until the
  landing has a reason to render them.
- Full render-level coverage for a custom Snapshot fixture remains deferred; the
  current component already guards empty blind spots and absent source windows.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `if rg -n "NEVER emitted by the snapshot" web/plans/deflection-snapshot-report-groundtruth.json; then exit 1; else echo "no stale blind-spots projection note"; fi` - passed; no stale pre-projection blind-spots note remains in the reference payload.
- `rg -n "top_blind_spots: \\[|source_date_start|DEMO_DEFLECTION_SNAPSHOT_CLEAN_UPLOAD" web/src/lib/deflection-snapshot.ts web/scripts/test-deflection-snapshot-landing-smoke.mjs` - passed; primary blind spots stay populated, the clean fixture is exported and tested, and source-date fields remain only in the primary/source-window path.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Ground-truth reference payload | ~430 |
| Demo fixture updates | ~35 |
| Smoke fixture assertions | ~95 |
| this plan doc | ~85 |
| **Total** | ~645 |

This exceeds the 400-LOC soft cap because the issue's ground-truth reference
payload is an indivisible generated artifact. The executable app/test changes
stay small.
