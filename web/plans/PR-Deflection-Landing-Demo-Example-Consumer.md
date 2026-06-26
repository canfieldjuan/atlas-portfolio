# PR-Deflection-Landing-Demo-Example-Consumer

## Why this slice exists

ATLAS #1857 completed PR-A of #1853: the backend repo now generates paired
synthetic public-demo examples from one frozen producer input:
`content_ops_faq_deflection_report_example.json` and
`content_ops_faq_deflection_snapshot_example.json`.

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
5. Refresh the existing generated paid report-model contract against current
   ATLAS source because the shared `check:deflection-contracts` gate owns that
   output too.

### Files touched

- `web/plans/PR-Deflection-Landing-Demo-Example-Consumer.md` - plan contract.
- `web/scripts/generate-deflection-snapshot-contract.mjs` - generate/check the paired demo-example module.
- `web/scripts/test-deflection-snapshot-contract-generator.mjs` - generator drift coverage for the new demo-example output.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - consumer invariant that the demo Snapshot matches the paired projection.
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
snapshot JSON is an object, then renders a local TypeScript module with compact
generated JSON constants for `DEMO_DEFLECTION_REPORT_MODEL` and
`DEMO_DEFLECTION_SNAPSHOT`. The module is generated, so check mode compares all
three outputs: Snapshot contract, paid report-model contract, and the paired
demo-example module.

The app-facing wrapper modules keep their current import paths. The landing page
still imports from `@/lib/deflection-snapshot` and
`@/lib/deflection-report-demo`, but those wrappers re-export the generated
primary constants. The clean-upload variant stays local and derives from the
generated Snapshot to keep its branch-specific overrides obvious.

## Intentional

- The ATLAS generated example is compact. This slice prioritizes contract truth
  over marketing-rich demo volume. If the public preview needs a larger
  fabricated dataset, the correct follow-up is to enrich the ATLAS synthetic
  producer input, not hand-edit the portfolio fixture.
- The locked preview still renders its configured subset of sections. This
  slice changes the source of the demo model, not the preview component's
  curated section list.
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

- Marketing-quality tuning of the synthetic ATLAS example is deferred to an
  ATLAS-side generator-input slice if the compact producer-backed story is not
  persuasive enough on the landing page.
- Deeper codegen cleanup, such as splitting demo-example generation out of the
  Snapshot contract generator file, is deferred until this flow grows beyond
  one generated module.

Parked hardening: none.

## Verification

- Pass: `npm --prefix web run generate:deflection-contracts`.
- Pass: `npm --prefix web run check:deflection-contracts`.
- Pass: `npm --prefix web run test:deflection-snapshot-contract-generator`.
- Pass: `npm --prefix web run test:deflection-snapshot-landing-smoke`.
- Pass: `npm --prefix web run test:deflection-report-model-result-page`.
- Pass: `npm --prefix web run lint -- scripts/generate-deflection-snapshot-contract.mjs scripts/test-deflection-snapshot-contract-generator.mjs scripts/test-deflection-snapshot-landing-smoke.mjs src/lib/deflection-demo-example.ts src/lib/deflection-report-demo.ts src/lib/deflection-snapshot.ts src/lib/deflection-report-model-contract.ts`.
- Pass: `bash scripts/local_pr_review.sh`.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Landing-Demo-Example-Consumer.md` | +117 / -0 |
| `web/scripts/generate-deflection-snapshot-contract.mjs` | +119 / -1 |
| `web/scripts/test-deflection-snapshot-contract-generator.mjs` | +154 / -0 |
| `web/scripts/test-deflection-snapshot-landing-smoke.mjs` | +111 / -54 |
| `web/src/lib/deflection-demo-example.ts` | +13 / -0 |
| `web/src/lib/deflection-report-demo.ts` | +1 / -297 |
| `web/src/lib/deflection-report-model-contract.ts` | +831 / -27 |
| `web/src/lib/deflection-snapshot.ts` | +8 / -122 |
| Total | ~1855 |
