# PR-Intake-Headline-Resolution-Report

## Why this slice exists

The Support Ticket CSV intake form led with "Start a deterministic FAQ gap
audit." That heading describes the engine, not the outcome the visitor came
for. This slice swaps it for outcome-first copy so the form headline matches
the Ticket Resolution Report framing already used in the eyebrow, CTA, and
snapshot name.

## Scope

Copy-only change to the shared intake form heading, plus the smoke markers
that pin the old string. The form is shared by the Snapshot landing hero and
the dedicated `/intake` route, so the new headline lands on both surfaces from
a single component change. No data contract, route, or form-behavior changes.

### Files touched

- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` -- new heading copy.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` -- live smoke marker.
- `web/scripts/smoke-deflection-public-reachability.mjs` -- live smoke marker.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` -- unit fixture/marker.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` -- unit fixture/assertion.
- `web/plans/PR-Intake-Headline-Resolution-Report.md` -- this plan doc.

## Mechanism

Replace the `<h2>` text in `SupportTicketCsvIntakeForm` with "Get your ticket
resolution report and start taking actionable steps to resolve tickets today."
The deflection landing and public-reachability smokes assert on the rendered
heading string as a required marker, so their marker tables and the unit-test
fixtures/assertions are updated to the new string in lockstep.

## Intentional

- Outcome-first heading that matches the Ticket Resolution Report framing.
- Smoke markers track the shipped copy so the suites stay meaningful.

## Deferred

- Hero `<h1>` ("Deflect tickets by actually resolving them.") and supporting
  subcopy are unchanged.
- The `/intake` route metadata description is unchanged.

## Verification

- `node scripts/test-deflection-snapshot-landing-smoke.mjs` -- passed.
- `node scripts/test-deflection-public-reachability-smoke.mjs` -- passed.

## Estimated diff size

| Section | Size |
|---|---|
| Total | ~70 LOC |
