## Why this slice exists

#414 is moving deflection tests away from one-off Node assertion harnesses and
toward Vitest coverage with real repo imports. The teaser rank-copy guard still
runs as a standalone Node script and parses the generated demo module with a
regex even though the generated Snapshot fixture is importable directly.

This slice migrates that guard to Vitest and imports the real
`DEMO_DEFLECTION_SNAPSHOT` fixture while preserving the source-contract checks
that prevent rank-aware teaser copy and shared teaser wiring from regressing.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the teaser rank-copy Node assertion harness with a Vitest test.
2. Preserve the source checks for rank-aware teaser labels, shared teaser usage,
   landing-page teaser preview wiring, and no bespoke landing teaser renderers.
3. Replace generated JSON regex parsing with a real import of the generated demo
   Snapshot fixture.
4. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the teaser rank-copy guard through Vitest.
- `web/plans/PR-Real-Adapter-Deflection-Teaser-Rank-Copy-Test.md` — plan for
  this slice.
- `web/scripts/test-deflection-teaser-rank-copy.mjs` — remove the old Node
  assertion harness.
- `web/src/lib/deflection-teaser-rank-copy.test.ts` — add real-import fixture
  and source-contract coverage in Vitest.

## Mechanism

The new test reads the same component/page source files for the static
rank-copy and wiring contracts, but imports `DEMO_DEFLECTION_SNAPSHOT` from the
generated demo module instead of parsing a JSON string export manually.

No local product dependency is mocked.

## Intentional

- The source reads remain because this guard is about component composition and
  copy/wiring contracts, not runtime rendering.
- The generated Snapshot check becomes a real import so the test fails through
  the normal module graph if the generated fixture becomes unimportable.

## Deferred

The remaining #414 Node harness migrations stay queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-teaser-rank-copy # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-teaser-rank-copy\\.mjs" web/package.json web/scripts web/src/lib/deflection-teaser-rank-copy.test.ts || rg -n "parseGeneratedJsonExport" web/src/lib/deflection-teaser-rank-copy.test.ts; then exit 1; else echo "No deflection teaser rank-copy Node harness or local JSON-export parser references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Deflection-Teaser-Rank-Copy-Test.md` | ~77 |
| `web/scripts/test-deflection-teaser-rank-copy.mjs` | ~96 |
| `web/src/lib/deflection-teaser-rank-copy.test.ts` | ~41 |
| Total | ~216 |

This is under the 400-LOC soft cap.
