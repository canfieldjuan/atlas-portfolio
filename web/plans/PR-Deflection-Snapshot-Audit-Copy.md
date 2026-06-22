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

1. Reframe the Snapshot hero badge, subheadline, and inline-form CTA around the
   Resolution Audit and forensic-audit motion while preserving the original hero
   H1.
2. Move the cost-exposure heading into the intake form heading, where the audit
   upload action happens.
3. Change the sample Snapshot lead-in from "What it gives you." to "A preview of
   the truth." and tighten the section intro around evidence, estimated cost
   exposure, and no-proven-answer gaps.
4. Rework the final CTA as a Snapshot-first qualification gate with a bounded
   audit-standard reassurance instead of a broad savings or usefulness promise.
5. Move the intake trust signals above the submit CTA so the privacy/security
   reassurance stays above the fold before the upload action.
6. Update the hero proof metrics to name estimated Support Tax, repeat contacts,
   and the draft-plus-unresolved-gap deliverable.
7. Align the Snapshot route metadata and linked non-partner intake route with
   the Resolution Audit offer so page CTAs do not drop users back into old
   Deflection Snapshot copy.
8. Update the landing smoke test assertions that intentionally pin this visible
   copy, trust-before-CTA ordering, hero metric labels, linked-intake copy, and
   Snapshot metadata.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Audit-Copy.md` - this plan contract.
- `web/src/app/systems/support-ticket-deflection/snapshot/page.tsx` - Snapshot route metadata for the Resolution Audit offer.
- `web/src/app/systems/support-ticket-deflection/intake/page.tsx` - linked intake route copy for the non-partner audit path.
- `web/src/app/systems/support-ticket-deflection/intake/layout.tsx` - intake route metadata for the Resolution Audit intake.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - Snapshot landing copy and final CTA framing.
- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` - intake trust signal placement above the submit CTA.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - copy smoke expectations for the changed labels/headings.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` - intake heading, route metadata, and linked-intake copy expectations.

## Mechanism

- Copy-only TSX changes in `DeflectionSnapshotLandingPage.tsx`; the upload form,
  source attribution, smoke markers, ATLAS submit path, and Snapshot data model
  are left unchanged.
- The original hero H1, `Deflect tickets by actually resolving them.`, is
  preserved. The cost-exposure sentence moves to the shared intake form heading,
  where it frames the upload action rather than replacing the page promise.
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
- The three hero proof cards keep the same component and metric sources but swap
  labels/details to `Estimated Support Tax`, `Repeat Contacts`, and `Draft +
  Gap`, with the third card using the demo Snapshot's teaser draft and
  `top_blind_spots` presence to show `1 + 1`.
- `snapshot/page.tsx` metadata moves from old `Free Deflection Snapshot` /
  `Upload 30 days` framing to the Resolution Audit offer. The noindex intake
  layout metadata does the same for the linked conversion route.
- The non-partner `/intake` route keeps the existing ATLAS source offer and
  source page, but changes its back label, snapshot name, and submit label to the
  Resolution Audit path. Partner-specific route labels stay partner-scoped.
- The smoke test swaps the old Resolution Report submit-label and sample-heading
  assertions for the new forensic-audit CTA and sample-heading copy, and checks
  that the trust marker appears before the submit CTA marker in the intake form
  and the hero metric copy names the unresolved finding. The public reachability
  smoke now also pins the Snapshot metadata and non-partner intake route copy.

## Intentional

- The requested "exact cost" language is softened to "cost exposure" because the
  page uses benchmark-assisted-contact math and relative ranking signals, not a
  customer-specific accounting system. That line belongs to the intake heading,
  not the hero H1.
- The original hero H1 is intentionally restored because the broad page promise
  was already stronger than the audit-specific intake heading.
- The requested "every question in your history" language is softened to "across
  the ranked backlog from your ticket history" because the current report shape
  ranks parsed groups and may cap/preview surfaces rather than guarantee a
  literal row for every raw ticket question.
- The requested "problem lies in your product or process" language is softened to
  "product, policy, or process fixes" as an interpretation of no-proven-answer
  gaps, not a diagnosis the Snapshot can always prove from ticket text alone.
- Partner route labels are updated only inside the shared intake route where the
  route itself branches; partner landing page, playbook, and systems-index copy
  stay out of this PR.

## Deferred

- A broader landing-page copy sweep, including any final guarantee placement or
  deeper claims-doctrine cleanup outside this Snapshot page, stays in the copy
  issue for a later pass.
- Partner landing, playbook, systems-index, email/PDF artifact, and lower sample
  artifact-grid wording remain deferred to the broader funnel sweep.
- No form-field removals, report-shape changes, PII-scrubbing claim changes, or
  result-page behavior changes are included in this slice.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run test:deflection-public-reachability-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `rg -n "Ticket Resolution Report|Upload 30 days of closed tickets|Get my free Resolution Report|Get my free Deflection Snapshot|What it gives you\.|Read your Snapshot and take action|The example below shows what you get|full report unlocks|exact cost|cost to solve it|every question in your history|problem lies in your product or process|Free Deflection Snapshot|Upload my CSV, get my free Deflection Snapshot" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/src/components/landing/SupportTicketCsvIntakeForm.tsx web/src/app/systems/support-ticket-deflection/snapshot/page.tsx web/src/app/systems/support-ticket-deflection/intake/page.tsx web/src/app/systems/support-ticket-deflection/intake/layout.tsx web/scripts/test-deflection-snapshot-landing-smoke.mjs web/scripts/test-deflection-public-reachability-smoke.mjs`
  - passed; only negative test assertions retain the stale strings.
- `bash scripts/local_pr_review.sh` - passed.
- Production-server browser check at `1365x768` - passed; the intake trust block
  measured `top=563`, `bottom=735`, and the submit CTA started at `763` in a
  `768px` viewport, so the full trust block stays above the fold and before the
  CTA.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| Snapshot landing copy + metadata | ~104 |
| Linked intake route/metadata | ~18 |
| Intake trust placement | ~81 |
| Snapshot landing smoke expectations | ~38 |
| public reachability smoke expectations | ~37 |
| this plan doc | ~145 |
| **Total** | ~423 |

Over the 400-LOC soft cap, but this remains one coherent review-fix slice: the
reviewed landing reframe cannot be made coherent without aligning the route
metadata and linked intake path it sends users into.
