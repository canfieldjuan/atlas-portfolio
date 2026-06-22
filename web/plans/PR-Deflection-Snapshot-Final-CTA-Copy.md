# Plan: Update the Snapshot final CTA copy

Issue #353 now has the approved final CTA wording for the Snapshot landing page.
This slice applies that exact final-ask copy without starting the broader
entry-point copy sweep.

## Why this slice exists

- The final CTA still uses the previous "start with the Snapshot" framing.
- The requested replacement copy more directly frames the Snapshot as a
  buyer-protective gate before committing to a full audit.
- The guarantee language needs to stay bounded to a usable audit trail, not
  guaranteed savings or business outcomes.

## Scope (this PR)

Slice phase: Product polish

1. Replace the final CTA section headline and body on
   `/systems/support-ticket-deflection/snapshot` with the wording logged on
   issue #353.
2. Preserve the existing `snapshotFirst finalSnapshotAsk` smoke markers and CTA
   button behavior.
3. Update the Snapshot landing source smoke test so it pins the new final CTA
   claim boundaries and rejects the replaced wording.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Final-CTA-Copy.md` - this plan contract.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - final CTA copy.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - source-level copy guard for the final CTA.

## Mechanism

- The final `snapshotFirst finalSnapshotAsk` section keeps the same visual
  container, smoke markers, and `PrimarySnapshotCta` link.
- The heading changes to the requested investment-gate line.
- The body becomes three copy blocks: Snapshot qualification, full-report
  deliverable, and bounded audit-trail guarantee.
- The test asserts the new headline, Snapshot qualification copy, full-report
  deliverable language, no-guaranteed-savings disclaimer, and correction promise
  while confirming the previous final CTA headline no longer remains.

## Intentional

- No entry-point, partner, email/PDF, result-page, pricing, form-field,
  metadata, or PII/security copy changes are included.
- The copy says the Snapshot shows the top deflection topic and a summary count.
  It does not claim exact savings, guaranteed resolution lift, or guaranteed
  SEO/ranking outcomes.
- "If the data warrants it" is preserved as conditional language so the page
  does not imply every upload justifies a full audit.

## Deferred

- The non-partner entry/CTA coherence slice logged on #353 remains next.
- Partner, playbook, systems-index, email/PDF artifact, and result-page wording
  stay deferred to the broader funnel sweep unless explicitly pulled forward.
- PII/security claim changes remain deferred until the scrubbing/backend contract
  supports stronger wording.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `rg -n "Start with the Snapshot before you commit to a deeper audit|If it does not, the Snapshot still gives you a bounded starting point|entirely-new findings|Audit standard" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/scripts/test-deflection-snapshot-landing-smoke.mjs`
  - passed; only negative test assertions retain the replaced phrases.
- `bash scripts/local_pr_review.sh` - pending.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Final CTA copy | ~32 |
| Snapshot landing smoke expectations | ~44 |
| this plan doc | ~79 |
| **Total** | ~155 |
