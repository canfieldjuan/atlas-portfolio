## Why this slice exists

ATLAS issue #1805 needs the portfolio frontend contract to be derived from the
ATLAS backend-owned shape instead of maintained by hand in two repos. ATLAS now
generates `portfolio-ui/src/types/deflectionSnapshot.ts` from the backend
contract, but `atlas-portfolio` still carries a hand-authored
`web/src/lib/deflection-snapshot.ts` type surface. That copy has already drifted:
the required support-ticket resolution evidence fields and
`non_repeat_ticket_count` are missing from `summary`, and `top_blind_spots` is
still optional even though ATLAS now emits it as part of the free Snapshot
contract. This slice is over the 400 LOC soft cap because the generator, its
failure-mode tests, the committed generated contract, and CI enrollment are one
load-bearing unit: splitting them would either land generated code without the
drift gate or land the gate without the generated consumer.

## Scope (this PR)

Slice phase: Production hardening

1. Add a generated `atlas-portfolio` Snapshot contract module derived from the
   ATLAS-generated Snapshot type artifact.
2. Keep the existing public `@/lib/deflection-snapshot` import path as the app
   wrapper for endpoint paths and demo fixtures, while re-exporting the
   generated contract types/constants from the generated module.
3. Update the live ATLAS snapshot parser and demo fixtures to satisfy the
   generated contract: required support-ticket evidence fields,
   `non_repeat_ticket_count`, and required `top_blind_spots`.
4. Add a generator/check test and enroll the drift check in CI so this repo
   fails when the committed generated contract no longer matches the ATLAS
   source artifact.

### Files touched

- `web/plans/PR-Deflection-Cross-Repo-Snapshot-Contract.md` - plan contract for this slice.
- `web/src/lib/deflection-snapshot-contract.ts` - generated Snapshot contract derived from ATLAS.
- `web/src/lib/deflection-snapshot.ts` - app wrapper, endpoint helper, and demo fixtures.
- `web/src/lib/atlas-deflection-client.ts` - live Snapshot parser updated to the generated contract.
- `web/scripts/generate-deflection-snapshot-contract.mjs` - cross-repo contract generator/checker.
- `web/scripts/test-deflection-snapshot-contract-generator.mjs` - generator regression tests.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - parser contract fixtures.
- `web/scripts/test-deflection-results-state.mjs` - route-state snapshot fixture.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - demo fixture harness updated for the generated contract module.
- `web/package.json` - contract check/test scripts.
- `.github/workflows/pre_push_audit.yml` - CI enrollment for the new check/test.

## Mechanism

The generator reads the ATLAS-generated
`portfolio-ui/src/types/deflectionSnapshot.ts`, verifies the required generated
markers and field tuples are present, maps ATLAS's internal type names to the
stable portfolio import names, appends the local source-window helper alias,
and writes `web/src/lib/deflection-snapshot-contract.ts`.

`web/src/lib/deflection-snapshot.ts` becomes a thin app wrapper: it re-exports
the generated contract, keeps `deflectionSnapshotPath`, and keeps the demo
fixtures typed against the generated `DeflectionSnapshot`. The ATLAS client
parser now fails closed unless the required summary evidence and
`non_repeat_ticket_count` fields are present, and it always returns a
`top_blind_spots` array.

## Intentional

- This slice derives the free Snapshot contract only. The paid report model in
  `web/src/lib/deflection-report-contract.ts` remains a separate follow-up
  because ATLAS does not yet expose a generated frontend report-model artifact
  equivalent to `deflectionSnapshot.ts`.
- The generator defaults to the sibling local ATLAS checkout for developer
  workflows and accepts `--source` for CI or future automation; it does not
  import ATLAS Python code into this Next app repo.
- The public wrapper path remains `@/lib/deflection-snapshot` so existing
  components do not need import churn.

## Deferred

- Generate the paid `DeflectionStructuredReport`/section model from an
  ATLAS-owned report-model frontend artifact once ATLAS publishes that artifact.

Parked hardening: none

## Verification

1. `npm --prefix web ci` - passed; installed dependencies in the fresh worktree.
2. `npm --prefix web run check:deflection-snapshot-contract -- --source /home/juan-canfield/Desktop/Atlas/portfolio-ui/src/types/deflectionSnapshot.ts` - passed; generated contract matches ATLAS.
3. `npm --prefix web run test:deflection-snapshot-contract-generator` - passed; generator render, missing-marker failure, stale-output failure, and write mode are covered.
4. `npm --prefix web run test:deflection-intake-atlas-submit` - passed; live parser accepts the generated Snapshot shape and rejects missing `top_blind_spots`.
5. `npm --prefix web run test:deflection-results-state` - passed; route-state fixtures carry the generated Snapshot shape.
6. `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed; demo fixtures still match the Snapshot landing contract.
7. `node web/scripts/audit-test-enrollment.mjs` - passed; all `test:*` scripts are enrolled in CI.
8. `npm --prefix web run lint` - passed with no eslint errors.
9. `npm --prefix web run build` - passed; Next compiled and type-checked successfully.
10. `bash scripts/local_pr_review.sh` - passed; plan audits, drift advisory, dead-code baseline, Snapshot landing smoke, eslint, Next build, and whitespace all passed.

## Estimated diff size

| Section | Size |
|---|---|
| Plan doc | ~101 |
| Generated contract | ~103 |
| App wrapper/parser/fixtures | ~210 |
| Generator and tests | ~320 |
| CI/package enrollment | ~15 |
| Total | ~748 |
