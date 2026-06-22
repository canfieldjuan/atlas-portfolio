# Plan: Resolution Audit results copy

PR #359 aligned the email/PDF artifact copy, but the link opens the free
results page, which still says `YOUR DEFLECTION SNAPSHOT` and sells an
`Unlock your full Backlog Report` CTA. That creates an immediate public
email-to-page naming mismatch.

## Why this slice exists

- Public submitters now receive `Resolution Audit Snapshot` email/PDF copy, so
  the linked free results page should continue the same public offer language.
- Partner submissions still need Deflection Snapshot / Deflection Report wording
  until the partner page gets its own reframe.
- Hosted result smokes use exact visible labels as render markers, so copy and
  smoke expectations must move together.

## Scope (this PR)

Slice phase: Product polish

1. Add a small result-page offer-copy resolver keyed by `priceVariant`.
2. Change public free results copy from Deflection Snapshot / Backlog Report /
   full report to Resolution Audit Snapshot / full Resolution Audit.
3. Preserve partner free results copy as Deflection Snapshot / full Deflection
   Report.
4. Update hosted result, browser-upload, and paid-unlock smoke markers to the
   new public result-page labels.
5. Add partner result-page copy coverage so the preserved partner branch cannot
   leak the public Resolution Audit naming.

### Files touched

- `web/plans/PR-Resolution-Audit-Results-Copy.md` - this plan contract.
- `web/src/components/landing/DeflectionResultsPage.tsx` - variant-aware result-page offer copy.
- `web/scripts/smoke-deflection-hosted-results.mjs` - hosted results marker labels.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - hosted results fixture labels.
- `web/scripts/test-deflection-browser-upload-smoke.mjs` - browser upload results fixture labels.
- `web/scripts/smoke-deflection-paid-unlock.mjs` - paid unlock locked-page marker.
- `web/scripts/test-deflection-paid-unlock-smoke.mjs` - paid unlock fixture labels.

## Mechanism

- `DeflectionResultsPage` derives public vs partner labels from `priceVariant`.
  The public path uses `Resolution Audit Snapshot` and `full Resolution Audit`;
  the partner path uses `Deflection Snapshot` and `full Deflection Report`.
- The same derived labels feed the badge, unlock button, Stripe helper,
  locked-section heading, offer heading, one-time price label, and finalizing
  status/error copy.
- Smoke scripts update their public-page render markers to the new public labels
  so hosted checks keep proving the visible result-page state.
- The hosted-results smoke test also isolates the partner branch of the
  result-page resolver and asserts it keeps Deflection Snapshot / full
  Deflection Report wording with no Resolution Audit leak.

## Intentional

- This does not touch paid report model copy or legacy full-report rendering.
- This does not rename internal `DeflectionSnapshot*` types or route names.
- This does not change checkout behavior, Stripe integration, or privacy copy.

## Deferred

- Partner landing-page reframe remains deferred to a partner-specific pass.
- Shared landing Snapshot copy and PDF/email internals outside this result-page
  handoff remain out of scope.
- PII/security wording remains deferred until the scrubbing/backend contract
  supports stronger copy.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-hosted-results-smoke` - passed.
- `npm --prefix web run test:deflection-browser-upload-smoke` - passed.
- `npm --prefix web run test:deflection-paid-unlock-smoke` - passed.
- `rg -n "YOUR DEFLECTION SNAPSHOT|Unlock your full Backlog Report|Unlock the full report|full Backlog Report|In your full report|Stripe checkout unlocks the full Backlog Report|YOUR RESOLUTION AUDIT SNAPSHOT|full Resolution Audit|full Deflection Report" web/src/components/landing/DeflectionResultsPage.tsx web/scripts/smoke-deflection-hosted-results.mjs web/scripts/test-deflection-hosted-results-smoke.mjs web/scripts/test-deflection-browser-upload-smoke.mjs web/scripts/smoke-deflection-paid-unlock.mjs web/scripts/test-deflection-paid-unlock-smoke.mjs`
  - passed; public result markers use Resolution Audit language, partner copy
    retains Deflection Snapshot / full Deflection Report inside the copy
    resolver, the hosted-results test guards that partner branch from
    Resolution Audit leaks, and old Backlog Report/result-page full-report
    labels are gone from this slice.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Results page copy resolver | ~60 |
| Smoke marker updates and partner guard | ~40 |
| this plan doc | ~80 |
| **Total** | ~185 |
