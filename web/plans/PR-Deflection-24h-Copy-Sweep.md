# Plan: Deflection 24-hour copy sweep

## Why this slice exists

#285 fixed the monitored intake page promise from 24 hours to seconds, but #275
item 9 still identifies remaining customer-facing deflection copy that promises
24-hour delivery. The funnel now finalizes the free Snapshot in seconds, so the
landing, partner metadata, legacy pricing config, and degraded confirmation
email fallback should stop advertising the old 24-hour SLA.

## Scope (this PR)

Slice phase: Product polish
Ownership lane: deflection/customer-copy

1. Replace remaining customer-facing deflection `24 hours` delivery copy with
   seconds/as-processing-finishes copy.
2. Update the long-form landing config, shared v1 pricing tier copy, partner
   metadata, and no-results confirmation-email fallback.
3. Update the email results-link test for the changed fallback copy.
4. Add source-level assertions that the deflection funnel copy no longer carries
   `24 hours` outside explicit tests/comments.
5. Leave unrelated `24h` dashboard/demo ranges untouched.

### Files touched

- `web/plans/PR-Deflection-24h-Copy-Sweep.md` - this plan doc.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` -
  long-form landing delivery copy.
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` - shared
  pricing-tier SLA copy.
- `web/src/app/systems/support-ticket-deflection/partner/layout.tsx` - partner
  metadata copy.
- `web/src/lib/gap-report-intake.ts` - degraded no-results confirmation-email
  fallback copy.
- `web/scripts/test-deflection-email-results-link.mjs` - confirmation-email
  fallback assertion.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` - source-level
  no-stale-deflection-copy assertions.

### Review Contract

Acceptance criteria:
- Customer-facing deflection delivery copy in the long-form landing config,
  shared pricing config, partner metadata, and confirmation-email fallback no
  longer promises `24 hours`.
- The fallback confirmation email avoids a replacement SLA promise and says the
  Snapshot is sent as soon as processing finishes.
- Focused tests assert the changed fallback wording and source-level absence of
  stale `24 hours` copy in the touched deflection funnel sources.
- Existing route, upload, pricing, checkout, polling, and email transport
  behavior stays unchanged.

Affected surfaces:
- Support Ticket Deflection landing content and metadata.
- Gap-report confirmation-email fallback text.
- Deflection public-reachability and email results-link smoke scripts.

Risk areas:
- Stale buyer-facing delivery promises could remain hidden in config-backed
  copy.
- Overbroad assertions could flag unrelated dashboard `24h` time ranges.

Triggered reviewer rules:
- R1 Requirements match.
- R2 Test evidence.
- R7 UI/copy truthfulness.
- R11 Scope control.

## Mechanism

The landing copy keeps the same offer shape and changes only the delivery-time
language: ranked fix lists arrive in seconds, not 24 hours. The degraded
confirmation email fallback says the Snapshot will be sent as soon as processing
finishes, preserving the fallback path without promising a stale SLA.

The existing enrolled public-reachability test reads the deflection funnel
sources and asserts these buyer-facing files no longer include `24 hours`. The
email results-link test updates the no-results branch expectation to the new
fallback wording.

## Intentional

- No upload, polling, checkout, pricing, route, or email transport behavior
  changes.
- The unrelated `24h` strings in cost observability demos and API examples stay
  untouched because they are dashboard time ranges, not deflection delivery copy.
- The intake page remains covered by #285; this PR does not rework its copy.

## Deferred

- Broader #275 copy items unrelated to stale delivery timing remain separate
  product-polish slices.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-public-reachability-smoke` - passed.
- `npm --prefix web run test:deflection-email-results-link` - passed.
- `rg -n "24 hours|within 24 hours|in 24 hours|Delivered in 24 hours|send back a free Deflection Snapshot in 24 hours" web/src web/scripts -S` -
  passed; remaining matches are negative test assertions only.
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
| Plan doc | +118 |
| Deflection copy sweep | +7 / -7 |
| Focused assertions | +35 / -1 |
| Total | ~168 changed |
