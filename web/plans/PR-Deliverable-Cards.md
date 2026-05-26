# Plan: Rebuild the "what's in the report" deliverable cards (card 3)

Card 3 of the page overhaul (per `demo-card-benefit-audit.md`). The deliverables
cards had vague/benefit-light labels and didn't surface the new defensible
assets. Rebuild the six cards to map to real report fields, frame each as a
benefit, and add cards for the two hidden assets (findability gaps,
grounded-and-cited). Operator-approved set.

## Why this slice exists

- The audit flagged "Deflectable Ticket Opportunities" as vague and "Customer
  Wording" as under-using `term_mappings`, and noted missing cards for the
  findability gap (`zero_result_search`) and the grounded-vs-draft trust signal
  (`answer_evidence_status` / `evidence_quotes` / `output_checks`).

## Scope (this PR)

Slice phase: Product polish

Replace `reportContents` (six cards) and adjust the icon imports:
1. **Repeat questions, ranked** (`BarChart3`) — `items` + `ticket_count` +
   `opportunity_score`; absorbs the old vague "Deflectable Opportunities" +
   "Priority Notes".
2. **Your customer-word term map** (`Search`) — `term_mappings` +
   `question_source` (findability lever).
3. **Step-by-step drafted answers** (`FileText`) — `steps[]` / `action_items[]` /
   `when_to_contact_support` + no-auto-publish.
4. **Your findability gaps** (`AlertTriangle`, new) — `failure_risk:
   zero_result_search`.
5. **Grounded and cited — nothing invented** (`ShieldCheck`, new) —
   `answer_evidence_status` + `evidence_quotes` + `output_checks`.
6. **What changed, next time** (`Repeat`) — the quarterly refresh (kept).

Imports: drop `Clock` + `Calculator` (no longer used), add `Search` +
`ShieldCheck`.

### Files touched

- `web/plans/PR-Deliverable-Cards.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — `reportContents` rebuild + icon imports

## Mechanism

- `reportContents` is the `deliverables.items` array (`DiagnosticCard[]`); the
  template renders them in the 3-up grid unchanged. Two new cards surface the
  findability gap + the grounded/cited trust signal; the vague cards fold into
  the ranked-questions card.

## Intentional

- **Findability framed as a mechanism** ("questions customers searched and found
  nothing"), not a ranking promise (D-028).
- **Priority via `opportunity_score`, not $/%** — "which is worth fixing first"
  (the audit's labeling rule).
- **Grounded/cited + "you review and publish"** — trust as a feature +
  no-auto-publish.
- **`Clock`/`Calculator` dropped** because their only consumers (the removed
  vague cards) are gone; `AlertTriangle`/`FileText`/`BarChart3`/`Repeat` stay used.

## Deferred

- CFPB `DeflectionReportSample` rebuild — gated on the demo-swap / B2B-SaaS
  sample-source decision.
- Headline + benefit-ladder rewrite (the big remaining piece).

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size).
- `npm run lint` / `tsc --noEmit` clean (no unused imports after the icon swap);
  `npm run build` succeeds; the cards render on the wedge + `/partner`.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| icon imports (swap 2) | ~4 |
| `reportContents` (6 cards rewrite) | ~32 |
| this plan doc | ~80 |
| **Total** | ~116 |

Well under the 400-LOC soft cap.
