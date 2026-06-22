# Plan: Resolution Audit paid report copy

PR #360 aligned the free results page, but the unlocked structured report still
renders as a `MODEL-BACKED REPORT` and says `Your Support Tax report is ready.`
That leaves the paid handoff one step behind the public Resolution Audit frame.

## Why this slice exists

- Public submitters can now move from Resolution Audit Snapshot email/PDF copy
  to Resolution Audit Snapshot results copy, then unlock into a paid page that
  still uses older report naming.
- Partner submissions must continue to see Deflection Report wording until the
  partner surface gets its own reframe.
- Hosted and paid-unlock smoke tests use exact paid-page labels as render
  markers, so the visible copy and test markers need to move together.

## Scope (this PR)

Slice phase: Product polish

1. Add a small paid-report copy resolver keyed by `priceVariant`.
2. Rename the public structured paid report badge/headline/dashboard frame to
   full Resolution Audit language.
3. Pass the saved/requested price variant into the structured paid report page
   so partner paid results keep full Deflection Report language.
4. Update hosted-results, paid-unlock, and report-model tests/smokes for the new
   public paid-page markers, partner paid-page markers, and the partner
   preservation path.

### Files touched

- `web/plans/PR-Resolution-Audit-Paid-Report-Copy.md` - this plan contract.
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` - pass resolved price variant into the structured paid report page.
- `web/src/components/landing/DeflectionReportModelPage.tsx` - variant-aware paid report framing copy.
- `web/scripts/smoke-deflection-hosted-results.mjs` - hosted results paid-page marker labels.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - hosted results paid-page fixture labels.
- `web/scripts/smoke-deflection-paid-unlock.mjs` - paid unlock paid-page marker labels.
- `web/scripts/test-deflection-paid-unlock-smoke.mjs` - paid unlock paid-page fixture labels.
- `web/scripts/test-deflection-report-model-result-page.mjs` - route/source assertions for paid report copy and partner preservation.

## Mechanism

- The results route resolves the price variant after confirming a model or
  snapshot exists, then before rendering that surface. Saved server-side
  metadata is authoritative; local development can still use the `priceVariant`
  query fallback already used by the free snapshot page. Missing/stale partner
  result links still reach the existing not-found path before price-variant
  enforcement.
- `DeflectionReportModelPage` derives its badge, headline, intro, and dashboard
  label from the resolved variant. Public/default copy says full Resolution
  Audit; partner copy says full Deflection Report.
- Smoke markers are updated to accept the public and partner structured paid
  report labels while legacy artifact fallback markers remain accepted for old
  non-model reports.

## Intentional

- This does not touch the legacy `DeflectionReportArtifactPage` fallback.
- This does not rename internal `DeflectionReport*` types, route names, or ATLAS
  contract fields.
- This does not change checkout behavior, Stripe integration, privacy copy, or
  the partner landing-page offer.

## Deferred

- Legacy artifact fallback copy remains deferred because it is only used for
  pre-model paid reports and is separate from the current structured report.
- Partner landing-page reframe remains deferred to a partner-specific pass.
- PII/security wording remains deferred until the scrubbing/backend contract
  supports stronger copy.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-report-model-result-page` - passed.
- `npm --prefix web run test:deflection-hosted-results-smoke` - passed.
- `npm --prefix web run test:deflection-paid-unlock-smoke` - passed.
- `rg -n "MODEL-BACKED REPORT|Your Support Tax report is ready|Paid report dashboard|FULL RESOLUTION AUDIT|Your Resolution Audit is ready|Full audit dashboard|FULL DEFLECTION REPORT|Your Deflection Report is ready|Full report dashboard" web/src/components/landing/DeflectionReportModelPage.tsx web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx web/scripts/smoke-deflection-hosted-results.mjs web/scripts/test-deflection-hosted-results-smoke.mjs web/scripts/smoke-deflection-paid-unlock.mjs web/scripts/test-deflection-paid-unlock-smoke.mjs web/scripts/test-deflection-report-model-result-page.mjs`
  - passed; public structured paid-report markers moved to Resolution Audit
    language, partner copy remains Deflection Report language, partner paid
    markers are accepted by the hosted and paid-unlock smokes, and old
    model-report labels survive only as negative assertions in the report-model
    test. Legacy artifact fallback labels remain accepted in the paid smoke
    scripts.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Results route variant pass-through | ~35 |
| Structured paid report copy resolver | ~50 |
| Smoke and report-model test updates | ~105 |
| this plan doc | ~90 |
| **Total** | ~280 |
