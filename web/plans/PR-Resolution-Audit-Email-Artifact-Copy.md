# Plan: Resolution Audit email artifact copy

The public entry surfaces now frame the offer as a Resolution Audit, but the
delivered email/PDF path still uses older Support Ticket Deflection Report and
Deflection Snapshot wording. That path is shared with partner submissions, so a
plain rename would leak public wording back into the partner funnel.

## Why this slice exists

- Customer-facing confirmation email and PDF artifact names should match the
  public Resolution Audit framing after the landing-page copy pass.
- Partner submissions still need Deflection Snapshot / Deflection Report wording
  until the partner page gets its own dedicated reframe.
- The split is already available through `priceVariant`, but the email copy
  resolver currently keys only on `sourceOffer`.

## Scope (this PR)

Slice phase: Product polish

1. Split support-ticket email copy into public Resolution Audit and partner
   Deflection Report variants, keyed by `priceVariant`.
2. Update the public Snapshot PDF title, fallback title, locked-preview label,
   and filename to Resolution Audit Snapshot wording.
3. Update email/PDF tests to assert public Resolution Audit artifact language
   and partner Deflection Snapshot language remain separated.

### Files touched

- `web/plans/PR-Resolution-Audit-Email-Artifact-Copy.md` - this plan contract.
- `web/src/lib/gap-report-intake.ts` - email copy resolver split by price variant.
- `web/src/lib/deflection-snapshot-pdf.ts` - public PDF artifact title/filename labels.
- `web/scripts/test-deflection-email-results-link.mjs` - email copy assertions for public and partner submissions.
- `web/scripts/test-deflection-snapshot-pdf-email.mjs` - PDF artifact copy assertions.

## Mechanism

- `intakeOfferCopy` accepts the submission `priceVariant` and returns partner
  copy only for the partner variant; all other support-ticket submissions get
  public Resolution Audit copy.
- Customer email text uses the resolved copy for the free artifact name and the
  full-audit/full-report upgrade sentence, so the partner path stays scoped.
- The Snapshot PDF remains the same bounded payload, but its visible artifact
  title, generated filename prefix, and paid-preview label are supplied from the
  resolved offer copy so public and partner attachments stay separated.

## Intentional

- This does not rename internal TypeScript types, function names, route names,
  or test filenames; those remain structural identifiers for the existing
  Snapshot implementation.
- This does not touch result-page checkout copy or the full report model page.
  Those have more UI behavior and should ship separately.
- This does not change privacy/security claims or retention wording.

## Deferred

- Result-page checkout and unlock copy remains deferred to a focused result-page
  slice.
- Partner landing-page reframe remains deferred to a partner-specific pass.
- PII/security wording remains deferred until the scrubbing/backend contract
  supports stronger copy.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-email-results-link` - passed.
- `npm --prefix web run test:deflection-snapshot-pdf-email` - passed.
- `rg -n "Deflection Snapshot|Support Ticket Deflection Report|Deflection Report CSV|full report during that window|resolution-audit-snapshot|Resolution Audit Snapshot|Full Resolution Audit|Full Deflection Report" web/src/lib/gap-report-intake.ts web/src/lib/deflection-snapshot-pdf.ts web/scripts/test-deflection-email-results-link.mjs web/scripts/test-deflection-snapshot-pdf-email.mjs`
  - passed; public email/PDF copy uses Resolution Audit Snapshot wording, old
    Deflection Report / Deflection Snapshot hits remain in the partner copy
    object and partner assertions, and structural `DeflectionSnapshot*`
    identifiers are outside the visible-copy sweep.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Email copy resolver split | ~45 |
| PDF artifact labels | ~25 |
| Email/PDF tests | ~45 |
| this plan doc | ~75 |
| **Total** | ~190 |
