# Plan: Deflection record submit failure

## Why this slice exists

Issue #294 Finding 1 is a launch blocker: when the Support Ticket Deflection
`/api/gap-report-intake/record` route cannot generate the ATLAS report, it still
returns `ok: true` with no `reportRequestId`. The client then falls through to a
green success screen without a Snapshot link, even though no report exists and
no useful follow-up will arrive.

Before charging real buyers, deflection intake must fail closed when ATLAS
submit fails instead of recording a successful local submission with no paid-flow
control token.

## Scope (this PR)

Slice phase: Production hardening
Ownership lane: deflection/go-live

1. Map every `submitDeflectionReportCsv` failure reason to a typed non-2xx
   `/record` response for support-ticket-deflection intake.
2. Return a bounded, user-actionable client error without leaking upstream
   hosts, tokens, stack traces, or raw provider messages.
3. Stop before `recordGapReportSubmission(...)` when ATLAS submit fails, so the
   local DB does not mark a failed report generation as successful.
4. Keep non-deflection intake behavior unchanged.
5. Add focused route-level coverage for the fail-closed branch and source-level
   coverage that the stale success warning is gone.

### Files touched

- `web/plans/PR-Deflection-Record-Submit-Failure.md` - this plan doc.
- `web/src/app/api/gap-report-intake/record/route.ts` - fail-closed submit
  failure response.
- `web/scripts/test-deflection-partner-access.mjs` - route-level regression
  test using the existing compiled record-route harness.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - source-level
  assertions for the ATLAS submit failure branch.
- `web/scripts/test-deflection-browser-upload-smoke.mjs` - smoke fixture for
  the new typed non-2xx record response.

### Review Contract

Acceptance criteria:
- For support-ticket-deflection intake, `not_configured`, `blob_not_found`,
  `invalid_response`, `rejected`, and `error` submit failures return `ok: false`
  with `status: "failed_to_submit"` and a bounded `reason`.
- The route does not call `recordGapReportSubmission(...)` after a failed ATLAS
  submit.
- The public client receives a generic retry/contact message, not raw upstream
  details.
- Existing partner-token validation and partner durable-persistence failure
  behavior stays unchanged.
- Existing successful deflection submit still returns `reportRequestId`.

Affected surfaces:
- Support Ticket Deflection CSV intake `/record` route.
- Browser upload smoke record-failure fixture.
- Partner-access route harness and ATLAS-submit source assertions.

Risk areas:
- Overbroad failure handling could break non-deflection intake submissions.
- Returning a generic 5xx could hide useful operator context if not logged.
- Partner durable persistence must still fail closed after successful ATLAS
  submit.

Triggered reviewer rules:
- R1 Requirements match.
- R2 Test evidence.
- R3 Security/privacy.
- R7 UI/copy truthfulness.
- R11 Scope control.

## Mechanism

The route already gets a typed `DeflectionSubmitResult` from
`submitDeflectionReportCsv(...)`. This slice adds a small mapping from failure
reason to HTTP status and generic client copy:

```ts
if (!submit.ok) {
  return deflectionSubmitFailureResponse(submit.reason);
}
```

That return happens before `recordGapReportSubmission(...)`, so a failed ATLAS
report generation cannot be persisted as a successful local intake. The client
already treats non-2xx/`ok: false` `/record` responses as an error state, so no
client behavior change is needed.

## Intentional

- This PR fixes #294 Finding 1 only. Rate limiting, record idempotency, KV-backed
  rate limits, generic catch-copy hardening, and JSON-LD escaping remain separate
  #294 slices.
- The local fallback success screen remains for non-deflection or future
  no-report-url flows; this PR removes the deflection ATLAS-submit failure path
  into that screen.
- Failure reasons are exposed only as bounded internal enum values, not raw
  upstream messages.

## Deferred

- #294 Finding 2: upload route rate limiting.
- #294 Finding 3: record route rate limiting and idempotency.
- #294 Finding 4: distributed/KV-backed rate limiting.
- #294 Finding 9: generic client copy for the route's outer catch block.
- #294 Finding 10: JSON-LD `</script>` escaping.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-partner-access` - passed; covers all
  five bounded ATLAS submit failure reasons returning non-2xx `ok: false` and
  confirms failed submit does not call the persistence stub.
- `npm --prefix web run test:deflection-intake-atlas-submit` - passed; source
  assertions confirm the route uses `deflectionSubmitFailureResponse`, returns
  `status: 'failed_to_submit'`, and no longer keeps the stale success-warning
  branch.
- `npm --prefix web run test:deflection-browser-upload-smoke` - passed; browser
  smoke record-failure fixture now receives the typed non-2xx `/record`
  response instead of a green response with no report id.
- `npm --prefix web run test:deflection-csv-privacy` - passed.
- `npm --prefix web run check:dead-code` - passed; Knip baseline still matches
  16 known findings.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed; Next build completed and regenerated
  `.next/routes-manifest-deterministic.json`.
- `git diff --check` - passed.
- `rg -n "Deflection report was not generated immediately|failed_to_submit|deflectionSubmitFailureResponse|recordGapReportSubmission" web/src/app/api/gap-report-intake/record/route.ts web/scripts`
  - old success-warning copy appears only in the source-level assertion that it
  must not remain in the route.
- `bash scripts/local_pr_review.sh` - passed; plan audits, cross-session drift
  check, Knip baseline, ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | +125 |
| Record route fail-closed branch | +51 / -2 |
| Route/source/smoke tests | +118 / -8 |
| Total | ~324 changed |
