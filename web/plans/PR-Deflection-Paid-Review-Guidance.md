## Why this slice exists

PR #214 correctly removed the old paid-page drill-down cards, but the reviewer
flagged a non-blocking content loss: those cards were also the only portfolio
surface for per-question `action_items` and `when_to_contact_support`. The raw
paid artifact still carries those fields, and the page still shows an action
proof badge, so the unlocked buyer view should preserve that reviewer guidance
without bringing back source-ticket tags, vocabulary-gap mechanics, or the
clinical card wall.

## Scope (this PR)

Slice phase: Product polish

1. Add a paid-only reviewer guidance section below the authored report that
   renders each question's action checklist and escalation boundary.
2. Reconcile the proof badge so it points at visible reviewer guidance rather
   than a hidden `action_items` field.
3. Keep source IDs, source labels, evidence quotes, and vocabulary mappings out
   of the wrapper section; those remain in the paid evidence appendix/report.
4. Extend the paid-unlock smoke marker contract so live paid-render checks prove
   the reviewer guidance surface exists.

### Files touched

- `web/src/components/landing/DeflectionReportArtifactPage.tsx` — paid artifact reviewer guidance render.
- `web/scripts/smoke-deflection-paid-unlock.mjs` — hosted paid-render marker for reviewer guidance.
- `web/scripts/test-deflection-paid-unlock-smoke.mjs` — paid-unlock smoke fixture marker.
- `web/plans/PR-Deflection-Paid-Review-Guidance.md` — this plan doc.

## Mechanism

The page derives guidance entries from `artifact.faq_result.items` after the
artifact has already passed the paid ATLAS gate. A helper counts items with at
least one `action_items` entry or a non-empty `when_to_contact_support` string.
The new section renders only:

- the customer question,
- the action checklist,
- the "when to contact support" escalation boundary.

It deliberately does not render `source_ids`, `source_labels`,
`evidence_quotes`, `term_mappings`, or opportunity metrics, so it preserves the
useful reviewer guidance without reintroducing the old source/vocabulary card
layer.

## Intentional

- No checkout, webhook, artifact fetch, free snapshot, or markdown parsing
  behavior changes.
- The section is paid-only because it is inside `DeflectionReportArtifactPage`,
  which is only rendered after the artifact endpoint returns unlocked content.
- This does not try to rewrite the ATLAS markdown generator. The portfolio
  wrapper preserves already-present artifact fields while the report generator
  remains the canonical authored deliverable.

## Deferred

- Folding escalation/action guidance into the ATLAS-generated Markdown itself
  remains a backend copy-polish follow-up if the authored report should own
  those fields directly.
- Collapsible controls for very large guidance lists are deferred until a real
  report shows the section needs density controls.
- Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-paid-unlock-smoke` — passed.
- `rg -n "Source tickets|Vocabulary gaps|Customer wording|source_ids|source_labels|term_mappings|evidence_quotes" web/src/components/landing/DeflectionReportArtifactPage.tsx` — passed with no matches.
- `npm --prefix web run lint` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Paid artifact guidance render | ~100 |
| Smoke marker updates | ~10 |
| Plan doc | ~80 |
| Total | ~190 |
