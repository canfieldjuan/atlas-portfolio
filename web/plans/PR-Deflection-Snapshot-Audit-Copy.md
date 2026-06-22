# Plan: Reframe the Snapshot landing page around the Resolution Audit

The Snapshot landing page still carries older "ticket resolution report" and
generic deflection language. The next copy pass needs the page to introduce the
Snapshot as a forensic Resolution Audit, while keeping the PII/security and
outcome claims bounded to what the current report shape can prove.

## Why this slice exists

- The hero, sample Snapshot lead-in, and final CTA still frame the page as a
  general Resolution Report rather than a buyer-protective audit gate.
- Some requested language is stronger than the current product can prove, so the
  page needs safer audit copy that still moves the offer toward the intended
  positioning.

## Scope (this PR)

Slice phase: Product polish

1. Reframe the Snapshot hero badge, headline, subheadline, and inline-form CTA
   around the Resolution Audit and forensic-audit motion.
2. Change the sample Snapshot lead-in from "What it gives you." to "A preview of
   the truth." and tighten the section intro around evidence, estimated cost
   exposure, and no-proven-answer gaps.
3. Rework the final CTA as a Snapshot-first qualification gate with a bounded
   audit-standard reassurance instead of a broad savings or usefulness promise.
4. Move the intake trust signals above the submit CTA so the privacy/security
   reassurance stays above the fold before the upload action.
5. Update the landing smoke test assertions that intentionally pin this visible
   copy and trust-before-CTA ordering.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Audit-Copy.md` - this plan contract.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - Snapshot landing copy and final CTA framing.
- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` - intake trust signal placement above the submit CTA.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - copy smoke expectations for the changed labels/headings.

## Mechanism

- Copy-only TSX changes in `DeflectionSnapshotLandingPage.tsx`; the upload form,
  source attribution, smoke markers, ATLAS submit path, and Snapshot data model
  are left unchanged.
- The hero subheadline becomes two short paragraphs so "we audit" can land
  separately from the upload/report explanation without adding another component
  or changing layout structure.
- The final CTA adds a compact guarantee-style reassurance that promises a
  ranked, source-backed audit output or correction, not savings, rankings,
  resolution lift, or entirely-new findings.
- The shared intake form moves its existing trust panel inside the form, between
  the CSV file input/error state and the submit button. The copy remains
  unchanged, but the security context now appears before the upload action
  instead of below the card.
- The smoke test swaps the old Resolution Report submit-label and sample-heading
  assertions for the new forensic-audit CTA and sample-heading copy, and checks
  that the trust marker appears before the submit CTA marker in the intake form.

## Intentional

- The requested "exact cost" language is softened to "cost exposure" because the
  page uses benchmark-assisted-contact math and relative ranking signals, not a
  customer-specific accounting system.
- The requested "every question in your history" language is softened to "across
  the ranked backlog from your ticket history" because the current report shape
  ranks parsed groups and may cap/preview surfaces rather than guarantee a
  literal row for every raw ticket question.
- The requested "problem lies in your product or process" language is softened to
  "product, policy, or process fixes" as an interpretation of no-proven-answer
  gaps, not a diagnosis the Snapshot can always prove from ticket text alone.

## Deferred

- A broader landing-page copy sweep, including any final guarantee placement or
  deeper claims-doctrine cleanup outside this Snapshot page, stays in the copy
  issue for a later pass.
- No form-field removals, report-shape changes, PII-scrubbing claim changes, or
  result-page changes are included in this slice.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed;
  confirms the Snapshot landing smoke contract, pinned forensic-audit
  CTA/sample-heading copy, and intake trust-before-CTA source order.
- `npm --prefix web run test:deflection-public-reachability-smoke` - passed;
  confirms the public landing/intake smoke markers still render.
- `npm --prefix web run lint` - passed.
- `rg -n "Ticket Resolution Report|Deflect tickets by actually resolving them|Upload 30 days of closed tickets|Get my free Resolution Report|Get my free Deflection Snapshot|What it gives you\.|Read your Snapshot and take action|The example below shows what you get|full report unlocks|exact cost|cost to solve it|every question in your history|problem lies in your product or process" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/scripts/test-deflection-snapshot-landing-smoke.mjs`
  - passed with no matches; old copy and intentionally-rejected overclaim
  language is gone from the changed runtime/test files.
- `bash scripts/local_pr_review.sh` - passed on the final two-commit PR branch;
  includes plan-doc audits, cross-session drift advisory, dead-code baseline,
  Snapshot landing smoke, ESLint, Next build, and `git diff --check`.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Snapshot landing copy | ~59 |
| Intake trust placement | ~80 |
| Snapshot landing smoke expectations | ~16 |
| this plan doc | ~104 |
| **Total** | ~259 |

Well under the 400-LOC soft cap.
