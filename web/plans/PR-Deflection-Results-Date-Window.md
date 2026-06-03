# Plan: Deflection Results Date Window

## Why this slice exists

ATLAS now emits fail-closed snapshot summary date-window fields after
canfieldjuan/ATLAS#1277. The portfolio results page still sizes the Support Tax
projection as if the uploaded batch might be a monthly pace, which is only honest
when the reporting window is unknown. This slice consumes the real window when
present so derived period copy is normalized from measured dates instead of a
synthetic fallback.

## Scope (this PR)

Slice phase: Production hardening

1. Extend the portfolio snapshot contract for optional `source_date_start`,
   `source_date_end`, and `source_window_days` summary fields.
2. Parse those fields fail-closed: keep them only when all three are valid and
   internally consistent; otherwise omit the window and do not normalize.
3. Update the results Support Tax block to show uploaded-window, 30-day,
   12-month, and 3-year projections only from a verified source window.
4. Keep the existing unknown-window copy when ATLAS omits the date-window fields.
5. Extend smoke/parser tests for present, missing, partial, and contradictory
   date-window envelopes.

### Files touched

- `web/plans/PR-Deflection-Results-Date-Window.md` - plan contract.
- `web/src/lib/deflection-snapshot.ts` - snapshot summary type, date-window helper, and demo fixture.
- `web/src/lib/atlas-deflection-client.ts` - server-side ATLAS snapshot parser.
- `web/src/components/landing/DeflectionResultsPage.tsx` - Support Tax date-window rendering and math.
- `web/scripts/smoke-deflection-live-submit.mjs` - live-submit smoke snapshot parser/output.
- `web/scripts/test-deflection-live-submit-smoke.mjs` - smoke parser fixtures for date-window behavior.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - ATLAS client parser fixtures for date-window behavior.

## Mechanism

The snapshot summary gains an optional validated source window. The ATLAS client
parser accepts only ISO `YYYY-MM-DD` start/end strings plus a positive integer
`source_window_days` that matches the inclusive calendar-day span. The
live-submit smoke mirrors the same validation so incomplete or contradictory
upstream envelopes silently return the base summary without window fields.

`DeflectionResultsPage` passes the optional window into `SupportTaxProjection`.
When present, the projection divides uploaded-window cost by
`source_window_days`, then derives 30-day, 12-month, and 3-year pace values from
that measured daily cost. When absent, the existing uploaded-batch/monthly-pace
copy remains; no normalization is invented.

## Intentional

- The date-window fields are optional and invalid optional fields are omitted
  rather than rejecting the whole snapshot. ATLAS already fail-closes emission;
  the browser should avoid false normalization without hiding an otherwise valid
  free snapshot.
- The UI uses "30-day pace" instead of "monthly" when a real window is present,
  avoiding calendar-month assumptions.
- Hosted-results smoke markers stay stable because older reports and unknown
  windows legitimately do not render the new normalized labels.

## Deferred

- Live validation against a freshly generated production report after ATLAS main
  is redeployed and the next customer CSV includes parseable dates.
- Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-live-submit-smoke` - passed; verifies the
  live-submit smoke preserves a valid source window and omits missing, partial,
  and contradictory optional windows.
- `npm --prefix web run test:deflection-intake-atlas-submit` - passed; verifies
  the server-side ATLAS snapshot client preserves a valid source window and
  omits missing, partial, contradictory, malformed-date, and reversed-date
  optional windows before rendering.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `rg -n "source_date_start|source_date_end|source_window_days|30-day pace|Uploaded window|same measured daily pace|if this batch is monthly pace|adjusted to your actual reporting window" web/src web/scripts web/plans/PR-Deflection-Results-Date-Window.md -S`
  - confirmed new source-window fields and normalized labels are present; the
    old "if this batch is monthly pace" / reporting-window copy remains only in
    the intentional unknown-window fallback.

## Estimated diff size

| Area | Estimate |
|---|---:|
| Plan | ~90 |
| Snapshot contract/parser | ~65 |
| Results page | ~60 |
| Smoke/tests | ~185 |
| Total | ~399 |
