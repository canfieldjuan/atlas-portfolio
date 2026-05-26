# Plan: Rebuild the hero artifact to the real report shape (card 1 of the overhaul)

First build slice of the page overhaul (per `demo-card-benefit-audit.md`). The
hero artifact's labels were invented and its data didn't match what we ship.
Rebuild it to map to real `TicketFAQItem` / `output_checks` fields and surface
three assets we were hiding: proof, the findability hook, and grounded-vs-draft
trust. Operator-approved mock.

## Why this slice exists

- The hero artifact (`DeflectionReportHeroArtifact`) is the first "demo" a visitor
  sees, and the audit found: invented chip numbers ("Top 25" / "5 answers
  ready"), an ambiguous row count field, a prose "answer" that doesn't match the
  real structured shape, and none of the new defensible assets surfaced.

## Scope (this PR)

Slice phase: Product polish

1. **Chips** (`page.tsx`/`landingConfig.tsx` artifact): `Top 25`/`5 answers` →
   `412 tickets · analyzed` (`ticket_source_count`, illustrative-but-honest) and
   `✓ Their words · not your jargon` (`output_checks.uses_user_vocabulary`); keep
   `3–6 months · ticket window`.
2. **Rows** (`heroReportRows`): rename fields to the real shape
   (`issue→topic`, `count→ticketCount`, `phrase→question`), set the count to a
   clean `ticket_count`, and add an optional `signal` — row 1 surfaces
   `failure_risk_signals: zero_result_search` ("'charged twice' → 0 results in
   your help center"), the defensible findability hook.
3. **Answer block**: prose paragraph → the real shape — header "Drafted answer ·
   needs your review" (`answer_evidence_status: draft_needs_review`), the
   question, numbered `steps[]`, and a footer "drafted from 4 cited tickets · you
   approve before publishing" (evidence/`source_ids` + no-auto-publish).

### Files touched

- `web/plans/PR-Hero-Artifact-Rebuild.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — `heroReportRows` data + the `DeflectionReportHeroArtifact` JSX

## Mechanism

- `heroReportRows` becomes a typed array `{ topic; ticketCount; question;
  signal? }`; the row JSX renders the customer-wording question + the optional
  `signal` line (styled with `--artifact-danger`). The answer block renders an
  ordered list of steps + the draft/cited footer. Illustrative B2B-SaaS data
  (billing/team-access/cancellation) — a labeled preview mock, not a data claim.

## Intentional

- **Illustrative numbers in a labeled "preview" mock** — the artifact is a
  designed snapshot preview, not the buyer's real data; the numbers are
  representative and the *structure/labels* now match what ships.
- **"draft · needs your review" + "you approve before publishing"** — keeps the
  no-auto-publish discipline and matches `answer_evidence_status`.
- **Findability surfaced as a mechanism (zero-result search), not a ranking
  promise** — stays inside D-028.
- **Numbers map to named fields** (`ticket_count`, `ticket_source_count`) — no
  `frequency`/`opportunity_score` mislabeling (the audit's trap).

## Deferred

- Card 2: the comparison table → the real `term_mappings` deliverable
  (findability pillar) — next slice.
- The CFPB `DeflectionReportSample` rebuild — gated on the demo-swap / B2B-SaaS
  sample-source decision (audit Part 3).
- Headline + benefit-ladder rewrite.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size).
- `npm run lint` / `tsc --noEmit` clean; `npm run build` succeeds (the wedge +
  `/partner` both render the shared artifact).
- The hero artifact renders: 3 chips, 3 rows (row 1 with the zero-result signal),
  and the drafted-answer block with steps + the draft/cited footer.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `heroReportRows` (reshape + type + signal) | ~22 |
| chips array | ~4 |
| rows JSX (fields + signal line) | ~8 |
| answer block (prose → steps + footer) | ~30 |
| this plan doc | ~86 |
| **Total** | ~150 |

Well under the 400-LOC soft cap.
