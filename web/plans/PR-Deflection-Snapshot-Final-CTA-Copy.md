# Plan: Update the Snapshot proof and final CTA copy

Issue #353 now has the approved final CTA wording and the approved proof-section
claim boundaries for the Snapshot landing page. This slice applies those exact
copy updates without starting the broader entry-point copy sweep.

## Why this slice exists

- The final CTA still uses the previous "start with the Snapshot" framing.
- The requested replacement copy more directly frames the Snapshot as a
  buyer-protective gate before committing to a full audit.
- The guarantee language needs to stay bounded to a usable audit trail, not
  guaranteed savings or business outcomes.
- The current proof section reads like promises. The page needs a clearer
  mechanism story that names the finding anatomy, audit trail, and diagnostic
  output without overclaiming true agent time or universal resolution quotes.

## Scope (this PR)

Slice phase: Product polish

1. Replace the final CTA section headline and body on
   `/systems/support-ticket-deflection/snapshot` with the wording logged on
   issue #353.
2. Replace the proof cards with the approved "Anatomy of a Finding", "Audit
   Trail", and "Diagnostic, Not a Dashboard" copy.
3. Preserve the existing `snapshotFirst finalSnapshotAsk` smoke markers and CTA
   button behavior.
4. Update the Snapshot landing source smoke test so it pins the new proof and
   final CTA claim boundaries and rejects the replaced wording.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Final-CTA-Copy.md` - this plan contract.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - proof section and final CTA copy.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - source-level copy guard for the proof section and final CTA.

## Mechanism

- The final `snapshotFirst finalSnapshotAsk` section keeps the same visual
  container, smoke markers, and `PrimarySnapshotCta` link.
- The heading changes to the requested investment-gate line.
- The body becomes three copy blocks: Snapshot qualification, full-report
  deliverable, and bounded audit-trail guarantee.
- The proof section keeps its three-card layout but changes the section heading
  and card copy from general promises to mechanism proof: finding anatomy, source
  ticket IDs, no-proven-answer handling, and diagnostic separation between
  documentation drafts and product/policy gaps.
- The test asserts the new proof copy, final CTA headline, Snapshot
  qualification copy, full-report deliverable language, no-guaranteed-savings
  disclaimer, and correction promise while confirming the previous proof and
  final CTA wording no longer remains.

## Intentional

- No entry-point, partner, email/PDF, result-page, pricing, form-field,
  metadata, or PII/security copy changes are included.
- The proof copy says "estimated support cost" instead of actual agent time or
  AHT because the current product uses a benchmark/configurable assisted-contact
  cost basis.
- The audit-trail copy says "source ticket IDs" and "no proven answer" instead
  of promising a direct quote for every finding or proving agent consistency.
- The copy says the Snapshot shows the top deflection topic and a summary count.
  It does not claim exact savings, guaranteed resolution lift, or guaranteed
  SEO/ranking outcomes.
- "If the data warrants it" is preserved as conditional language so the page
  does not imply every upload justifies a full audit.

## Deferred

- A stronger production-delivery scorecard claim remains deferred until ATLAS
  wires the QA scorecard into the delivery gate.
- A direct current-Next evidence-export download affordance remains deferred to
  the result-page lane.
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
  - passed; only negative test assertions retain the replaced final-CTA phrases.
- `rg -n "Built for you to take action today|Grounded in resolved tickets|A real diagnostic, not a generic calculator|No LLM or Model touches your data|cost of agent time|agents cannot consistently solve" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/scripts/test-deflection-snapshot-landing-smoke.mjs`
  - passed; only negative test assertions retain the replaced proof-section phrases.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Proof and final CTA copy | ~48 |
| Snapshot landing smoke expectations | ~60 |
| this plan doc | ~95 |
| **Total** | ~203 |
