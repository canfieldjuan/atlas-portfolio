# Plan: Align Resolution Audit metadata copy

PR #356 aligned visible non-partner entry CTAs, but a few public metadata
surfaces still advertise the old Support Ticket Deflection Report framing. This
slice cleans up those route-level descriptions without touching partner,
artifact, result, or security copy.

## Why this slice exists

- The public `/systems/support-ticket-deflection` route metadata still uses
  "Support Ticket Deflection Report" as the title and description offer name.
- The public demo metadata still says the old report would publish the answer.
- The AI Content Ops metadata still tells users to start with the old report
  even though the visible card now points at the Resolution Audit.
- Metadata should not contradict the visible non-partner funnel after #354-#356.

## Scope (this PR)

Slice phase: Product polish

1. Update the non-partner support-ticket-deflection layout metadata title and
   description to use Resolution Audit wording.
2. Update the demo layout metadata description so it points at what the
   Resolution Audit surfaces rather than what the old report would publish.
3. Update the AI Content Ops layout metadata description so it starts with the
   Resolution Audit instead of the old Support Ticket Deflection Report label.
4. Extend the public reachability smoke source guard to pin these metadata
   strings and reject old report-label wording in the touched metadata files.

### Files touched

- `web/plans/PR-Resolution-Audit-Metadata-Coherence.md` - this plan contract.
- `web/src/app/systems/support-ticket-deflection/layout.tsx` - public support-ticket-deflection metadata.
- `web/src/app/systems/support-ticket-deflection/demo/layout.tsx` - demo route metadata.
- `web/src/app/systems/ai-content-ops/layout.tsx` - AI Content Ops cross-sell metadata.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` - source-level guard for public metadata coherence.

## Mechanism

- The metadata update changes only static `generatePageMetadata` copy.
- The new strings keep the same route paths, keyword arrays, breadcrumbs, and
  structured data behavior.
- The smoke test reads the three touched metadata files directly and checks for
  Resolution Audit copy while rejecting the old Support Ticket Deflection Report
  label in those files.

## Intentional

- Partner metadata remains partner-scoped and unchanged.
- Email/PDF, result-page, generated artifact, and security-page copy remain
  unchanged because they need separate artifact/report-shape decisions.
- Breadcrumb names and route slugs remain "Support Ticket Deflection"; this
  slice changes the offer label, not the route taxonomy.
- The new metadata avoids outcome claims: no guaranteed savings, ranking lift,
  ticket deflection percentage, or resolution increase.

## Deferred

- Partner metadata and partner-page copy remain deferred to a partner-specific
  pass.
- Email/PDF artifact and result-page copy remain deferred to the generated
  artifact/report naming lane.
- PII/security wording remains deferred until the scrubbing/backend contract
  supports stronger copy.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-public-reachability-smoke` - passed.
- `rg -n "Support Ticket Deflection Report|Resolution Audit: Find Repeat Support Ticket Cost Exposure|Start with the Resolution Audit, then expand|a Resolution Audit would surface for review" web/src/app/systems/support-ticket-deflection/layout.tsx web/src/app/systems/support-ticket-deflection/demo/layout.tsx web/src/app/systems/ai-content-ops/layout.tsx web/scripts/test-deflection-public-reachability-smoke.mjs`
  - passed; the touched runtime metadata uses the new Resolution Audit wording, and the old report label remains only in negative test assertions.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Metadata copy | ~10 |
| Public reachability smoke guard | ~26 |
| this plan doc | ~76 |
| **Total** | ~112 |
