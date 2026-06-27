# PR-Deflection-Landing-Demo-Example-Consumer

## Why this slice exists

ATLAS #1857 completed PR-A of #1853: the backend repo now generates paired
synthetic public-demo examples from one frozen producer input:
`content_ops_faq_deflection_report_example.json` and
`content_ops_faq_deflection_snapshot_example.json`.
ATLAS #1858 and #1859 then enriched that producer input to 450 real synthetic
rows across seven generated questions, so the same generated pair is now
marketing-scale without reintroducing hand-made portfolio fixtures.
ATLAS #1860 then fixed the Snapshot projection so `locked_questions` excludes
ranks already visible through top questions, blind spots, or teaser previews;
this PR's final regeneration consumes that source fix instead of adding a
portfolio-side locked-row filter.

Root cause: atlas-portfolio still keeps the landing demo's primary free
Snapshot and locked paid report model as hand-authored constants in two files.
Those constants are independent of the ATLAS-generated example pair, so the
public landing page can tell a story that no longer matches the producer or the
production relationship where the free Snapshot is a projection of the report.
Recent owner-lane/evidence-tier additions had to be chased manually in the
demo, which is the drift class this slice removes.

This PR fixes the consumer side of the root: the existing cross-repo contract
generator also vendors the ATLAS paired JSON examples into one generated
portfolio module, the landing demo imports that generated report model and
snapshot, and the landing smoke test asserts the two constants stay exactly
paired.

The #1859 refresh also exposed two consumer-hardening gaps: the Snapshot
artifact labeled all visible top questions as "Top Proven Resolutions" even
when some were unresolved blind spots, and the locked preview rendered configured
sections even when the generated report section had no rows. This update fixes
those at the consumer boundary and makes the generator validate Snapshot field
shapes plus report/snapshot pairing before emitting the demo module.

This PR is over the 400 LOC soft cap because `check:deflection-contracts` now
refreshes against current ATLAS main, and the existing generated
`deflection-report-model-contract.ts` picked up the latest Product Gaps
hosted-field metadata in the same generator run. Splitting that generated
refresh out would leave this PR's local/CI drift gate red before the demo
consumer change can be reviewed.

## Scope (this PR)

Slice phase: Production hardening

1. Extend `generate-deflection-snapshot-contract.mjs` so
   `generate/check:deflection-contracts` also renders a generated
   `deflection-demo-example.ts` module from ATLAS's paired docs/frontend JSON
   examples.
2. Replace the primary landing demo constants with imports from that generated
   module. Keep the separate clean-upload Snapshot fixture because it exercises
   the no-blind-spots/no-unresolved branch, not the primary public demo story.
3. Update the generator tests so stale or mismatched demo-example outputs fail
   the same drift gate as the generated contract files.
4. Update the Snapshot landing smoke test to assert the public demo Snapshot
   equals the generated projection payload paired with the generated report
   model, while preserving existing render/PII-safe fixture checks.
5. Update the cost-projection guard so it asserts the generated demo carries a
   high, coherent Support Tax volume instead of grepping stale hand-authored
   literals.
6. Update the teaser rank-copy guard so it parses the generated Snapshot and
   asserts rank properties instead of grepping the old hand-authored teaser.
7. Refresh the existing generated paid report-model contract against current
   ATLAS source because the shared `check:deflection-contracts` gate owns that
   output too.
8. Render the Snapshot artifact's proven-resolution table from teaser-backed
   proven ranks, not raw `top_questions`, and hide the remaining-backlog
   surface when `locked_questions` is empty.
9. Skip locked-preview sections whose generated report data has no rows, and
   keep the live smoke marker set aligned with that sparse-data behavior.
10. Fail closed in the generator when Snapshot fields have the wrong shape or
    when the generated Snapshot no longer matches the paired report model's
    summary and ranked-question rows.
11. Add a `PATTERNS.md` standing note so future generated-fixture slices update
    property-derived direct-consumer assertions proactively.
12. Update the CI-enrolled row-renderer sharing guard so it asserts the landing
    passes teaser-proven rows into the shared row renderer.
13. Regenerate the demo module after ATLAS #1860 and update the landing smoke
    guard so blind-spot ranks validate against the paired report model instead
    of assuming those ranks also appear in the locked preview.

### Files touched

- `PATTERNS.md` - standing workflow note for generated-fixture consumer assertions.
- `web/plans/PR-Deflection-Landing-Demo-Example-Consumer.md` - plan contract.
- `web/scripts/generate-deflection-snapshot-contract.mjs` - generate/check the paired demo-example module.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` - keep required live smoke markers aligned with non-empty locked-preview sections.
- `web/scripts/test-deflection-cost-projection-share.mjs` - assert the generated demo preserves high/coherent Support Tax volume.
- `web/scripts/test-deflection-row-renderer-share.mjs` - assert the landing still uses shared rows with teaser-proven questions.
- `web/scripts/test-deflection-snapshot-contract-generator.mjs` - generator drift coverage for the new demo-example output.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - consumer invariant that the demo Snapshot matches the paired projection.
- `web/scripts/test-deflection-teaser-rank-copy.mjs` - assert teaser rank-copy against parsed generated Snapshot data.
- `web/src/components/landing/DeflectionLockedReportPreview.tsx` - skip empty generated report sections in the locked preview.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - render proven rows from teaser-backed ranks and hide empty locked/backlog surfaces.
- `web/src/lib/deflection-demo-example.ts` - generated ATLAS paired demo report/snapshot module.
- `web/src/lib/deflection-report-demo.ts` - wrapper export for the generated demo report model.
- `web/src/lib/deflection-report-model-contract.ts` - generated paid report-model contract refresh from current ATLAS source.
- `web/src/lib/deflection-snapshot.ts` - wrapper export for the generated primary demo Snapshot plus the clean-upload variant.

## Mechanism

The generator gains default source candidates for the ATLAS docs examples:

```txt
docs/frontend/content_ops_faq_deflection_report_example.json
docs/frontend/content_ops_faq_deflection_snapshot_example.json
```

It validates that the report JSON contains `report_model`, validates that the
snapshot JSON is an object with the required field shapes, checks shared summary
counts and ranked-question rows against the paired report model, then renders a
local TypeScript module with compact generated JSON constants for
`DEMO_DEFLECTION_REPORT_MODEL` and `DEMO_DEFLECTION_SNAPSHOT`. The module is
generated, so check mode compares all three outputs: Snapshot contract, paid
report-model contract, and the paired demo-example module.

The app-facing wrapper modules keep their current import paths. The landing page
still imports from `@/lib/deflection-snapshot` and
`@/lib/deflection-report-demo`, but those wrappers re-export the generated
primary constants. The clean-upload variant stays local and derives from the
generated Snapshot to keep its branch-specific overrides obvious.

The Snapshot artifact derives proven-resolution rows from the teaser's
full-answer and preview ranks before passing rows to `DeflectionTopQuestionRows`.
That keeps unresolved top questions under the blind-spots surface instead of
the proven-resolution heading. Empty locked/backlog surfaces and empty locked
report preview sections are skipped rather than rendered as placeholder cards.

The Support Tax cost guard reads the generated demo module, parses the generated
Snapshot export, and asserts a high-volume property (`repeat_ticket_count >=
300`, top question `ticket_count >= 90`, and weighted count matching ticket
count). That keeps the marketing volume load-bearing without pinning the deleted
hand-authored `1700` / `310` literals.

The teaser rank-copy guard now follows the same generated-data pattern: it
parses the generated Snapshot export and asserts the full teaser remains rank 1
and the first preview follows that rank. The test stays stable across future
ATLAS demo regeneration because it checks rank semantics, not a specific sample
question literal.

## Intentional

- The ATLAS generated example is moderately large: 450 synthetic ticket rows,
  with seven generated questions and the top repeat at 95 tickets. This is the
  accepted middle ground from #1858/#1859: coherent producer evidence without
  the original 1,140-row fixture
  bloat.
- The locked preview still uses its configured subset of sections, but empty
  generated sections are skipped so thin reports do not render placeholder
  cards.
- The clean-upload Snapshot remains local because it is not the primary landing
  demo; it is a focused test fixture for the empty blind-spots branch.
- The generated module intentionally contains only synthetic example data from
  ATLAS docs, never a real customer export.
- The generated report model carries synthetic `ticket-*` source IDs/evidence
  quotes because the ATLAS docs example is a full synthetic report model. The
  landing smoke test asserts those IDs stay in the synthetic namespace; hosted
  buyer payload projection remains covered by the report-model result-page
  parser tests.

## Deferred

- Deeper codegen cleanup, such as splitting demo-example generation out of the
  Snapshot contract generator file, is deferred until this flow grows beyond
  one generated module.

Parked hardening: none.

## Verification

- Pass: `npm --prefix web run generate:deflection-contracts`.
- Pass: `npm --prefix web run check:deflection-contracts`.
- Pass: `npm --prefix web run test:deflection-snapshot-contract-generator`.
- Pass: `npm --prefix web run test:deflection-snapshot-landing-smoke`.
- Pass: `npm --prefix web run test:deflection-cost-projection-share`.
- Pass: `npm --prefix web run test:deflection-row-renderer-share`.
- Pass: `npm --prefix web run test:deflection-teaser-rank-copy`.
- Pass: `npm --prefix web run test:deflection-report-model-result-page`.
- Pass: `npm --prefix web run lint -- scripts/generate-deflection-snapshot-contract.mjs scripts/smoke-deflection-snapshot-landing.mjs scripts/test-deflection-snapshot-contract-generator.mjs scripts/test-deflection-cost-projection-share.mjs scripts/test-deflection-row-renderer-share.mjs scripts/test-deflection-snapshot-landing-smoke.mjs scripts/test-deflection-teaser-rank-copy.mjs src/components/landing/DeflectionSnapshotLandingPage.tsx src/components/landing/DeflectionLockedReportPreview.tsx src/lib/deflection-demo-example.ts src/lib/deflection-report-demo.ts src/lib/deflection-snapshot.ts src/lib/deflection-report-model-contract.ts`.
- Pass: `bash scripts/local_pr_review.sh`.

## Estimated diff size

| File | LOC |
|---|---:|
| `PATTERNS.md` | +15 / -0 |
| `web/plans/PR-Deflection-Landing-Demo-Example-Consumer.md` | +207 / -3 |
| `web/scripts/generate-deflection-snapshot-contract.mjs` | +263 / -1 |
| `web/scripts/smoke-deflection-snapshot-landing.mjs` | +0 / -1 |
| `web/scripts/test-deflection-cost-projection-share.mjs` | +18 / -4 |
| `web/scripts/test-deflection-row-renderer-share.mjs` | +7 / -2 |
| `web/scripts/test-deflection-snapshot-contract-generator.mjs` | +232 / -0 |
| `web/scripts/test-deflection-snapshot-landing-smoke.mjs` | +148 / -65 |
| `web/scripts/test-deflection-teaser-rank-copy.mjs` | +21 / -7 |
| `web/src/components/landing/DeflectionLockedReportPreview.tsx` | +8 / -1 |
| `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` | +49 / -26 |
| `web/src/lib/deflection-demo-example.ts` | +14 / -1 |
| `web/src/lib/deflection-report-demo.ts` | +1 / -297 |
| `web/src/lib/deflection-report-model-contract.ts` | +831 / -27 |
| `web/src/lib/deflection-snapshot.ts` | +8 / -122 |
| Total | ~2379 |
