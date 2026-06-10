# PR-Deflection-Submit-Timeout-Full-Volume

## Why this slice exists

The first real full-volume run of ATLAS #1440 (a 52 MB / 35,386-row CFPB
export uploaded through the live intake at
`/systems/support-ticket-deflection/intake`) failed at the `/record` step
with a 503 `failed_to_submit (error)`. The blob upload succeeded; the ATLAS
server never received the submit. Root cause: `atlas-deflection-client.ts`
uses the shared `FETCH_TIMEOUT_MS = 10_000` for the deflection submit, but a
full-volume submit forwards up to 50 MB of CSV and waits for the
deterministic report build, measured at ~52 s server-side at 35k rows. The
AbortController kills the request at 10 s every time. The small 12-row
fixture used by previous smokes always finished in time, so this only
surfaces under real conditions - exactly what #1440 exists to catch.

The `/record` route also has no `maxDuration` export, so even with a longer
fetch budget the function would hit Vercel's default duration limit before a
full-volume chain (blob read + 50 MB forward + report build + snapshot fetch
+ snapshot email) completes.

## Scope (this PR)

Slice phase: Production hardening

1. Give the deflection submit its own timeout budget
   (`SUBMIT_TIMEOUT_MS = 240_000`) instead of the shared 10 s JSON-fetch
   timeout.
2. Set `maxDuration = 300` on the `/api/gap-report-intake/record` route so
   the full-volume submit chain fits inside the function budget and the
   submit timeout can still surface a JSON error before the platform kills
   the function.
3. Keep the 10 s timeout for all small JSON fetches (snapshot, artifact,
   checkout) unchanged.

### Files touched

- `web/plans/PR-Deflection-Submit-Timeout-Full-Volume.md` - plan contract
  for this slice.
- `web/src/lib/atlas-deflection-client.ts` - dedicated submit timeout.
- `web/src/app/api/gap-report-intake/record/route.ts` - route maxDuration.

## Mechanism

`submitDeflectionReportCsv` keeps its exact request shape (server-only blob
read, multipart forward, generic error mapping); only the AbortController
deadline changes from `FETCH_TIMEOUT_MS` to a new `SUBMIT_TIMEOUT_MS`
constant (240 s). The constant is deliberately below the route's
`maxDuration` (300 s) so a hung upstream still produces the route's own
`failed_to_submit` JSON response instead of a platform-level function
timeout.

`maxDuration = 300` is a static route segment export, the supported Vercel
mechanism for extending one function's duration without touching project
defaults.

## Intentional

- 240 s is sized from measurement, not guesswork: ~52 s report build at
  35,386 rows plus 50 MB transfer over the funnel, with headroom for the
  byte-bound worst case (the ATLAS submit guard caps uploads at 50 MB, so
  the row count cannot grow past what that byte budget admits).
- The snapshot fetch immediately after submit keeps the 10 s budget: the
  report is already persisted by then and the snapshot is a small JSON read.
- No retry logic is added; the intake already surfaces a clear failure and
  the operator-facing rate limits (3 per 10 min) make automatic retries of a
  50 MB chain undesirable.

## Deferred

- Streaming the blob through to ATLAS instead of buffering it in function
  memory (works today at 50 MB; revisit only if the upload guard grows).
- A queue/poll handoff that decouples the browser wait from the report
  build; out of scope while the synchronous chain fits comfortably in the
  function budget.

Parked hardening: none.

## Verification

- Passed: `npm run test:deflection-intake-atlas-submit` (submit contract
  tests).
- Passed: `npm run lint`.
- Passed: `npm run build` (route compiles with the maxDuration export).
- Live proof after deploy: re-run the full-volume CFPB upload through the
  hosted intake and confirm `/record` returns `ok: true` with a
  `reportRequestId` (the ATLAS #1440 live-run gate).

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Submit-Timeout-Full-Volume.md` | 95 |
| `web/src/lib/atlas-deflection-client.ts` | 7 |
| `web/src/app/api/gap-report-intake/record/route.ts` | 5 |
| **Total** | **107** |
