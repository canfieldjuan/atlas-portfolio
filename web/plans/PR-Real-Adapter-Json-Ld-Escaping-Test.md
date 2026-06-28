## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses now that Vitest can
load repo TypeScript directly. The JSON-LD escaping test still compiles
`json-ld.ts` into a temp CommonJS file before testing the helper.

This slice migrates that coverage to Vitest so the test imports the real
`@/lib/json-ld` helper.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the JSON-LD escaping temp transpile harness with a Vitest test.
2. Preserve coverage for escaping raw `<`, preventing raw `</script>` payloads,
   parsing the escaped JSON back to the original value, and discovering JSX
   JSON-LD script sinks.
3. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the JSON-LD escaping test through Vitest.
- `web/plans/PR-Real-Adapter-Json-Ld-Escaping-Test.md` — plan for this slice.
- `web/scripts/test-json-ld-escaping.mjs` — remove the temp transpile harness.
- `web/src/lib/json-ld.test.ts` — add real-import JSON-LD helper coverage.

## Mechanism

The new test imports `jsonLdScriptPayload` from the production `@/lib/json-ld`
module. The helper then runs through the normal Vitest/Next alias resolution
instead of being manually transpiled into a temp CommonJS file.

The TypeScript AST scan remains inside the test. It recursively walks `web/src`,
discovers `application/ld+json` JSX script elements in self-closing, paired, and
expression type forms, and asserts each JSON-LD sink imports and uses the shared
helper rather than bare `JSON.stringify`.

## Intentional

- No dependency is mocked. The JSON-LD helper is pure local code and should run
  for real in this slice.
- The source-tree AST scan remains test-local because it is the behavior the old
  harness provided; extracting it into production code would be unrelated scope.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:json-ld-escaping # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-json-ld-escaping\\.mjs|atlas-json-ld-escaping" web/package.json web/scripts web/src/lib/json-ld.test.ts; then exit 1; else echo "No JSON-LD temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Json-Ld-Escaping-Test.md` | ~76 |
| `web/scripts/test-json-ld-escaping.mjs` | ~182 |
| `web/src/lib/json-ld.test.ts` | ~169 |
| Total | ~429 |

This is over the 400-LOC soft cap because the old temp transpile harness is
deleted and replaced with full parity JSON-LD sink coverage in one slice.
