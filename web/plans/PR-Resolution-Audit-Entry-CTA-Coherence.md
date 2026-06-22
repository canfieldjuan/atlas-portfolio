# Plan: Align non-partner Resolution Audit entry CTAs

Issue #353 tracks the broader Snapshot/Resolution Audit copy reframe. PR #354
reframed the Snapshot landing page and intake path, and PR #355 tightened the
proof/final-CTA copy. This slice picks up the next deferred piece: non-partner
entry points that still send users toward the old "Deflection Snapshot" offer
language.

## Why this slice exists

- The Snapshot landing page now frames the offer as the Resolution Audit, but
  upstream non-partner entry points still say "Deflection Snapshot" or "Support
  Ticket Deflection Report."
- Several CTAs route users into the Snapshot/intake path with old free-Snapshot
  labels, which makes the funnel feel renamed in one place and stale in the
  next.
- The copy pass should keep partner, email/PDF, result artifact, and PII/security
  surfaces out of scope until those lanes are explicitly pulled forward.

## Scope (this PR)

Slice phase: Product polish

1. Rename non-partner support-ops cards and CTAs on the systems and AI Content
   Ops entry pages so they point at the Resolution Audit path.
2. Align the public support-ticket-deflection landing configs where pricing,
   hero/final CTA, and free/full offer labels still use old Deflection Snapshot
   or Deflection Report wording.
3. Update demo, playbook, support-tax, and calculator CTAs that route to
   `/systems/support-ticket-deflection/intake` so they use the forensic audit
   CTA language instead of old free Deflection Snapshot labels.
4. Keep "Snapshot" where it names the free first output/gate, but remove
   "Deflection Snapshot" as the public non-partner offer name on these entry
   surfaces.
5. Extend the public reachability smoke test with source-level guards for the
   entry/CTA surfaces touched in this slice.
6. Preserve the partner funnel's existing Deflection Snapshot pricing language
   where shared public config would otherwise leak renamed Resolution Audit copy
   into the deferred partner lane.

### Files touched

- `web/plans/PR-Resolution-Audit-Entry-CTA-Coherence.md` - this plan contract.
- `web/src/app/systems/page.tsx` - support-ops product card offer labels.
- `web/src/app/systems/ai-content-ops/page.tsx` - cross-sell card and CTA labels.
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` - legacy/public pricing and FAQ offer labels.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` - current public landing hero/final CTA and pricing labels.
- `web/src/app/systems/support-ticket-deflection/demo/page.tsx` - demo bottom CTA copy.
- `web/src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx` - partner pricing-copy override that preserves deferred partner wording.
- `web/src/app/systems/support-ticket-deflection/playbook/page.tsx` - playbook CTA copy.
- `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` - calculator intake CTA copy.
- `web/src/components/deflection-demo/SupportTaxCalculator.tsx` - support-tax CTA copy.
- `web/src/components/deflection-demo/SupportTaxMiniCalculator.tsx` - mini calculator CTA copy.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` - source-level copy guards for non-partner entry CTAs.

## Mechanism

- The non-partner entry copy uses "Resolution Audit" as the offer name and
  "Start Your Forensic Audit" as the primary action where the link begins the
  Snapshot/intake path.
- The pricing/config copy keeps the Snapshot as the free first gate and the full
  Resolution Audit as the paid expansion, preserving the buyer-protection
  framing without implying the free Snapshot is the full deliverable.
- CTAs that route directly to `/systems/support-ticket-deflection/intake` get the
  same forensic-audit action label so the click-through matches the intake form
  introduced in PR #354.
- The partner client overrides the shared pricing title, description, and tier
  copy back to its existing Deflection Snapshot / Deflection Report language so
  this non-partner rename does not leak into the deferred partner pass.
- The smoke test reads the touched entry source files and rejects old
  non-partner labels only in those files, then separately checks that the partner
  client declares its partner-scoped copy override.

## Intentional

- Partner route copy remains partner-scoped and is not renamed in this slice;
  the partner client is touched only to prevent shared public pricing copy from
  leaking into that deferred lane.
- Email/PDF, result-page, and generated artifact wording stay unchanged because
  those surfaces need their own report-shape and artifact naming decision.
- PII/security copy remains unchanged.
- The copy avoids outcome claims: no guaranteed savings, ranking lift, ticket
  deflection percentage, or resolution increase.
- "Snapshot" remains acceptable as the free first output, but "Deflection
  Snapshot" is removed from the touched non-partner entry surfaces.

## Deferred

- Partner landing and partner intake wording remain deferred to a partner-specific
  offer pass.
- Email/PDF artifact and result-page copy remain deferred to the generated
  artifact/report naming lane.
- Any PII/security wording remains deferred until the scrubbing/backend contract
  supports stronger copy.
- A broader SEO/outcome-claim sweep remains deferred outside these entry CTAs.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-public-reachability-smoke` - passed.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `rg -n "Deflection Snapshot|free Deflection Snapshot|get my free Deflection Snapshot|Get a free Deflection Snapshot|Upload tickets, get a free Deflection Snapshot|Upload your CSV, get a free Snapshot|Support Ticket Deflection Report|Full Deflection Report|Get the free Snapshot first|Start the full report|free snapshot" web/src/app/systems/page.tsx web/src/app/systems/ai-content-ops/page.tsx web/src/app/systems/support-ticket-deflection/landingConfig.tsx web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx web/src/app/systems/support-ticket-deflection/demo/page.tsx web/src/app/systems/support-ticket-deflection/playbook/page.tsx web/src/components/deflection-demo/ThirtySecondCalculator.tsx web/src/components/deflection-demo/SupportTaxCalculator.tsx web/src/components/deflection-demo/SupportTaxMiniCalculator.tsx`
  - passed; no stale old-offer labels remain in touched runtime entry surfaces.
- `rg -n "Resolution Audit Snapshot|Full Resolution Audit|Start Your Forensic Audit" web/src/app/systems/page.tsx web/src/app/systems/ai-content-ops/page.tsx web/src/app/systems/support-ticket-deflection/landingConfig.tsx web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx web/src/app/systems/support-ticket-deflection/demo/page.tsx web/src/app/systems/support-ticket-deflection/playbook/page.tsx web/src/components/deflection-demo/ThirtySecondCalculator.tsx web/src/components/deflection-demo/SupportTaxCalculator.tsx web/src/components/deflection-demo/SupportTaxMiniCalculator.tsx`
  - passed; the new Resolution Audit and forensic-audit labels are present on the entry surfaces.
- `rg -n "Deflection Report|DEFLECTION_SNAPSHOT_FULL_REPORT_OFFER_LABEL|Free snapshot .|full report" web/src/components/deflection-demo/SupportTaxCalculator.tsx web/src/components/deflection-demo/SupportTaxMiniCalculator.tsx web/src/components/deflection-demo/ThirtySecondCalculator.tsx web/src/app/systems/ai-content-ops/page.tsx`
  - passed; calculator disclaimers and the AI Content Ops card no longer retain old Deflection Report or imported full-report label wording.
- `rg -n "title: 'Deflection Snapshot'|title: 'Full Deflection Report'|Start with the snapshot\\. Upgrade|free Deflection Snapshot|Resolution Audit Snapshot|Full Resolution Audit" web/src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx`
  - passed; the partner client preserves the partner-scoped Deflection Snapshot copy and does not inherit the renamed Resolution Audit tier labels.
- `npm --prefix web run build` - passed after the partner pricing-copy override type fix.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Entry and CTA copy | ~104 |
| Partner copy preservation | ~74 |
| Public reachability smoke guards | ~91 |
| this plan doc | ~124 |
| **Total** | ~393 |
