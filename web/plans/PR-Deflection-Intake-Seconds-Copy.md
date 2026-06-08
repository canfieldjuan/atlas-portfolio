# Plan: Deflection intake seconds copy

## Why this slice exists

Issue #283 flags two go-live blockers on the Support Ticket Deflection intake
page: the page still promises 24-hour delivery even though the results flow now
finalizes in seconds, and the non-partner back link/source attribution still
points at the old long-form landing instead of the current Snapshot landing.

The intake page is also covered by the public reachability smoke, so the
monitored headline marker must change in the same PR.

## Scope (this PR)

Slice phase: Product polish

1. Replace intake-page 24-hour delivery copy with seconds/right-away copy.
2. Update the intake metadata description to match the instant Snapshot flow.
3. Route non-partner intake back-link and `sourcePage` attribution to
   `/systems/support-ticket-deflection/snapshot`.
4. Keep the partner intake route attribution pointed at `/partner`.
5. Update the public reachability smoke marker and fixture in the same PR.
6. Add source-level assertions for the no-24-hour intake copy and canonical
   Snapshot landing route.

### Files touched

- `web/plans/PR-Deflection-Intake-Seconds-Copy.md` - this plan doc.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` - intake visible
  copy and fallback/error copy.
- `web/src/app/systems/support-ticket-deflection/intake/layout.tsx` - intake
  metadata copy.
- `web/src/app/systems/support-ticket-deflection/intake/page.tsx` - non-partner
  back-link/source attribution route.
- `web/scripts/smoke-deflection-public-reachability.mjs` - monitored intake
  headline marker.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` - fixture and
  source-level copy/route assertions.

## Mechanism

The visible intake headline changes to `Upload your tickets. Get the
repeat-question snapshot in seconds.` and the intro uses the same
Snapshot-outcome framing as the current short landing: ranked repeat questions,
customer wording, and one review-ready draft.

The no-results fallback no longer says the Snapshot will arrive within 24 hours;
it says the confirmation email is on the way and the Snapshot will be sent as
soon as processing finishes. The internal-warning recovery copy asks the user to
email if processing does not complete, without naming a 24-hour window.

The default intake copy points `backHref` and `sourcePage` at
`/systems/support-ticket-deflection/snapshot`; partner traffic keeps the partner
route.

## Intentional

- No upload, Blob, record, checkout, pricing, or redirect behavior changes.
- The degraded no-results fallback remains an email fallback; only its stale
  delivery promise changes.
- The confirmation-email fallback in `gap-report-intake.ts` remains out of scope
  because #283 is an intake-page slice and that email branch is a separate
  backend notification copy path.
- Partner-route attribution is unchanged.

## Deferred

- The remaining 24-hour copy in the wedge landing, v1 config, partner metadata,
  and confirmation-email fallback remains a separate #275/#283 follow-up sweep.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-public-reachability-smoke` - passed.
- `npm --prefix web run test:deflection-partner-access` - passed.
- `npm --prefix web run test:deflection-intake-atlas-submit` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed; compiled successfully, TypeScript
  finished, generated `44/44` static pages, and copied the deterministic routes
  manifest.
- `bash scripts/local_pr_review.sh` - passed; plan shape, files touched,
  diff-size, drift advisory, dead-code baseline, ESLint, Next build, and
  whitespace checks passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | +93 |
| Intake page + metadata copy | +11 / -11 |
| Public reachability smoke/test | +37 / -2 |
| Total | ~154 changed |
