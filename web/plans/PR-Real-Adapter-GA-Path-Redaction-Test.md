## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses now that Vitest can
load TypeScript directly. The GA path-redaction test still compiles
`analytics.ts` into a temporary module before importing it.

This slice migrates that coverage to Vitest so the test imports the real
`@/lib/analytics` module directly while preserving the request-id redaction
checks.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the GA path-redaction temp transpile harness with a Vitest test.
2. Preserve direct redaction coverage for deflection result IDs and admin CSV
   request IDs.
3. Preserve page-view and event tracking coverage that proves raw IDs are not
   sent to GA or Google Ads.
4. Preserve source-level checks for the redaction registry, event context
   override, Google Ads auto-page-view suppression, and CI enrollment.
5. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the GA redaction test through Vitest.
- `web/knip-baseline.json` — remove analytics export findings resolved by the
  real-import test.
- `web/plans/deflection-snapshot-report-groundtruth.json` — update the snapshot
  ground-truth keys for the ATLAS `title` field surfaced by CI.
- `web/plans/PR-Real-Adapter-GA-Path-Redaction-Test.md` — plan for this slice.
- `web/scripts/test-deflection-ga-path-redaction.mjs` — remove the temp transpile
  harness.
- `web/src/lib/atlas-deflection-client.ts` — carry the new snapshot title through
  the ATLAS parser with a backward-compatible fallback.
- `web/src/lib/deflection-demo-example.ts` — refresh the generated demo snapshot
  after the ATLAS snapshot contract added `title`.
- `web/src/lib/deflection-snapshot-contract.ts` — refresh the generated snapshot
  contract to match the ATLAS source used by CI.
- `web/src/lib/analytics.test.ts` — add real-import analytics coverage.

## Mechanism

The new test sets `NEXT_PUBLIC_GOOGLE_ADS_ID` before dynamically importing the
real `@/lib/analytics` module. That preserves the old Ads-path assertion without
compiling a temporary module. Browser APIs are represented with `vi.stubGlobal`
for `window` and `document`, because those are the external runtime boundaries
for this client-side helper.

The test still reads `analytics.ts`, `GoogleAnalytics.tsx`, and the pre-push
workflow as source files for the coverage that is intentionally about static
configuration: the redaction registry, the event page-context override, disabled
Google Ads auto page views, and CI enrollment.

Because the new Vitest test imports `redactAnalyticsPath` and `trackEvent`
through the real module, those exports are no longer dead-code baseline entries;
the baseline is updated in the same slice so the gate matches reality.

CI also checks generated deflection contracts against live ATLAS contract source.
That gate surfaced a pre-existing drift: snapshot payloads now include a top-level
`title`. The generated snapshot contract and demo fixture are refreshed in this
PR so the required check can pass, and the hand-kept ground-truth snapshot is
updated so the smoke test remains a real shape guard.

`fetchDeflectionSnapshot` now carries the title through the parser. Older
persisted snapshot payloads without `title` fall back to `Resolution Snapshot` so
the generated type can become required without breaking old reads.

## Intentional

- Browser globals are stubbed because `trackPageView` and `trackEvent` are
  client helpers. The analytics module itself is not mocked.
- Source checks are preserved only for static configuration assertions that the
  old harness already guarded.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-ga-path-redaction # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run check:dead-code # PASS
npm --prefix web run check:deflection-contracts -- --source /home/juan-canfield/Desktop/Atlas/portfolio-ui/src/types/deflectionSnapshot.ts --report-model-source /home/juan-canfield/Desktop/Atlas/portfolio-ui/src/types/deflectionReportModel.ts # PASS
npm --prefix web run test:deflection-snapshot-landing-smoke # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-ga-path-redaction\\.mjs|atlas-ga-redaction" web/package.json web/scripts web/src/lib/analytics.test.ts; then exit 1; else echo "No GA redaction temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~1 |
| `web/knip-baseline.json` | ~10 |
| `web/plans/deflection-snapshot-report-groundtruth.json` | ~2 |
| `web/plans/PR-Real-Adapter-GA-Path-Redaction-Test.md` | ~109 |
| `web/scripts/test-deflection-ga-path-redaction.mjs` | ~156 |
| `web/src/lib/atlas-deflection-client.ts` | ~4 |
| `web/src/lib/deflection-demo-example.ts` | ~4 |
| `web/src/lib/deflection-snapshot-contract.ts` | ~7 |
| `web/src/lib/analytics.test.ts` | ~133 |
| Total | ~427 |

This is slightly over the 400-LOC soft cap because the GA harness migration also
surfaced required generated-contract and ground-truth drift that must be fixed
for CI to stay green.
