## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses and fake local
adapters. The ATLAS price-display test still compiles
`atlas-deflection-client.ts` and `deflection-pricing.ts` into temp CommonJS
files while writing fake local modules beside them.

This slice migrates that coverage to Vitest so the test imports the real
`@/lib/atlas-deflection-client` and `@/lib/deflection-pricing` modules.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the ATLAS price-display temp transpile harness with a Vitest test.
2. Preserve coverage for standard and partner pricing terms, variant mismatch,
   checkout authorization URLs, ATLAS not-configured/error branches, and price
   display helper projections.
3. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the ATLAS price-display test through Vitest.
- `web/plans/PR-Real-Adapter-Atlas-Price-Display-Test.md` — plan for this
  slice.
- `web/scripts/test-deflection-atlas-price-display.mjs` — remove the temp
  transpile and fake local-module harness.
- `web/src/lib/atlas-deflection-client.test.ts` — add real-import ATLAS
  pricing and display coverage.

## Mechanism

The new test imports `authorizeDeflectionCheckout`,
`fetchDeflectionPricingTerms`, and `fetchDeflectionStandardPricingTerms` from
the production `@/lib/atlas-deflection-client` module. It imports the production
price variants and display helpers from `@/lib/deflection-pricing`.

The only boundary stub is `globalThis.fetch`, which captures outbound ATLAS
requests and returns controlled response payloads. Environment variables are
reset per test so the real client reads the same configured and unconfigured
states the old harness asserted.

## Intentional

- No local product dependency is mocked. The ATLAS client, pricing module,
  pricing catalog, report contract, snapshot contract, blob package import, and
  runtime logger all resolve through the normal repo path.
- ATLAS HTTP is still isolated through `fetch`; the test must not call the live
  backend.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:deflection-atlas-price-display # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-deflection-atlas-price-display\\.mjs|atlas-deflection-price-display" web/package.json web/scripts web/src/lib/atlas-deflection-client.test.ts; then exit 1; else echo "No ATLAS price-display temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Atlas-Price-Display-Test.md` | ~83 |
| `web/scripts/test-deflection-atlas-price-display.mjs` | ~320 |
| `web/src/lib/atlas-deflection-client.test.ts` | ~282 |
| Total | ~687 |

This is over the 400-LOC soft cap because the old temp transpile harness is
deleted and replaced with parity ATLAS pricing and display coverage in one
slice.
