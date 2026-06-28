## Why this slice exists

Issue #313 calls for an error-tracking path, but the current budget choice is no hosted Sentry. The site still needs operator-useful runtime failures that are structured enough to search, aggregate, and alert on from platform logs without leaking request bodies, tokens, cookies, or upstream response payloads.

## Scope (this PR)

Slice phase: Production hardening

1. Add one structured runtime logging helper for error events.
2. Replace the current raw `console.error` calls in `web/src` with structured event logs.
3. Add an enrolled audit that fails if new raw `console.error` sinks are added outside the helper.

### Files touched

- `.github/workflows/pre_push_audit.yml` — enrolls the structured runtime logging audit in CI.
- `web/package.json` — adds the local test script.
- `web/plans/PR-Structured-Runtime-Logging.md` — slice plan.
- `web/scripts/test-deflection-atlas-price-display.mjs` — stubs the structured logger in the ATLAS client sandbox.
- `web/scripts/test-deflection-checkout.mjs` — stubs the structured logger in the checkout sandbox.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` — stubs the structured logger and asserts new event names in the ATLAS submit sandbox.
- `web/scripts/test-deflection-partner-access.mjs` — stubs the structured logger in the partner record-route sandbox.
- `web/scripts/test-deflection-report-model-result-page.mjs` — stubs the structured logger and asserts new event names in the report-model sandbox.
- `web/scripts/test-deflection-uploaded-search.mjs` — stubs the structured logger in the uploaded-search sandbox.
- `web/scripts/test-structured-runtime-logging.mjs` — verifies helper behavior and scans for raw console error sinks.
- `web/src/app/api/deflection-checkout/route.ts` — logs checkout price-variant lookup failures with a stable event.
- `web/src/app/api/demo/deflection-search/route.ts` — logs demo/uploaded search failures with stable events.
- `web/src/app/api/gap-report-intake/record/route.ts` — logs intake submit, duplicate lookup, and skipped attachment failures with stable events.
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/error.tsx` — logs client route-boundary failures with a stable event.
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` — logs results lookup failures with stable events.
- `web/src/components/landing/DeflectionResultsPage.tsx` — logs client checkout failures with a stable event.
- `web/src/lib/atlas-deflection-client.ts` — logs ATLAS fetch/submit/search/checkout failures with stable events.
- `web/src/lib/audit-intake.ts` — logs audit-intake delivery failures with stable events.
- `web/src/lib/deflection-checkout.ts` — logs Stripe checkout failures with stable events.
- `web/src/lib/structured-runtime-log.ts` — adds the shared structured logging helper.

## Mechanism

`structuredRuntimeError(event, fields)` emits a single JSON object through the one allowed `console.error` sink. The helper preserves a stable `level`, `event`, and ISO `timestamp`, recursively sanitizes field values, serializes `Error` objects by name only, drops unsupported values, bounds arrays/object depth, and redacts sensitive key names before output.

The replacement call sites log stable event names plus non-secret context such as status codes, failure reasons, request ids, and scrubbed errors. They still return the same user-facing responses as before; this slice changes observability only.

`test-structured-runtime-logging.mjs` imports the TypeScript helper through `ts.transpileModule`, monkeypatches `console.error` to inspect the emitted JSON, verifies error serialization and redaction, and scans `web/src` so the helper remains the only raw `console.error` sink.

## Intentional

The helper is generic rather than server-only because one current raw error sink lives in a client error boundary and another lives in a client checkout handler. Browser console output was already present; this slice makes it structured without introducing a server dependency into client bundles.

The logs deliberately avoid stack traces, `Error.message`, request bodies, upstream error bodies, URLs, cookies, authorization headers, and tokens. Those details can be useful during debugging, but they are the same category of data this lane is trying not to leak into operator-visible logs.

## Deferred

Hosted Sentry or self-hosted GlitchTip remains deferred until budget or operational need justifies it. This slice gives us structured logs from the existing platform first.

Parked hardening: none

## Verification

Focused checks:

```bash
npm --prefix web run test:structured-runtime-logging # PASS
npm --prefix web run test:deflection-checkout # PASS
npm --prefix web run test:deflection-intake-atlas-submit # PASS
npm --prefix web run test:deflection-partner-access # PASS
npm --prefix web run test:deflection-uploaded-search # PASS
npm --prefix web run test:deflection-report-model-result-page # PASS
npm --prefix web run test:deflection-atlas-price-display # PASS
npm --prefix web run lint # PASS
rg -n "console\\.error" web/src # PASS: only web/src/lib/structured-runtime-log.ts
```

Full local gate:

```bash
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan + CI/script enrollment | ~84 |
| Helper + audit script | ~193 |
| Runtime call-site replacements | ~145 |
| CI harness updates | ~32 |
| Total | ~465 |

This is slightly over the 400-LOC soft cap because the audit can only be strict if the current raw runtime error sinks are replaced in the same slice.
