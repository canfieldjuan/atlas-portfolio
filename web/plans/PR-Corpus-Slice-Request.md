# Plan: Add the corpus-slice request doc (resolution evidence + search-log rows)

The follow-up ask to the generator/backend session for a **v2** of the B2B-SaaS
demo sample — adding labeled-synthetic resolution evidence + search-log rows so
the demo can drop its two honesty caveats (all-`draft_needs_review`, no
`zero_result_search`). Docs only; no product change.

## Why this slice exists

- The demo swap (#99–#101) shipped on the v1 sample, which is data-truthfully
  limited: every item is `draft_needs_review` (so demo answers are hand-authored
  illustrative, not grounded) and there's no `zero_result_search` signal (so the
  findability / zero-result cards have no real data behind them — the page leads
  the product there). Closing both needs a corpus slice the generator dev owns.
  This doc is the precise, paste-ready ask so the handoff doesn't round-trip on
  missing fields (the lesson from `demo-sample-request.md`).

## Scope (this PR)

Slice phase: Workflow/process

1. **New request doc** `web/docs/landing-page-framework/demo-sample-corpus-slice-request.md`:
   context (the v1 sample + its two gaps), exactly what we need (A: resolution
   evidence for a grounded-answer *mix*; B: search-log rows for zero-result
   proof — field-by-field), the fields the demo renders (so v2 fills them with no
   round-trip), the defensibility constraint (labeled-synthetic, real generator
   output, D-028), four questions (search-log ingestion = already supported vs a
   generator change; resolved-ticket vs help-article text; shape changes;
   overwrite vs v2), and the ideal deliverable. Includes quantity targets
   (≥2–3 resolution sources/item; zero-result counts ~3–10), a topic-stability
   constraint (keep the 6 topics + questions; flag any label rename), and the
   evidence-quote citation format.

### Files touched

- `web/plans/PR-Corpus-Slice-Request.md` — this plan doc (new)
- `web/docs/landing-page-framework/demo-sample-corpus-slice-request.md` — the request (new)

## Mechanism

- Pure documentation, modelled on `demo-sample-request.md`. Lists the exact
  `TicketFAQItem` / report-level fields the rebuilt cards + live demo consume, so
  the returned v2 fills the demo with no missing-field round-trip; asks (doesn't
  decide) the ingestion-path / overwrite-vs-v2 questions — those are the dev's call.

## Intentional

- **Request, not a decision** — search-log shape, resolution-text source, and
  overwrite-vs-v2 are left to the generator dev.
- **Field list mirrors what ships** — incl. `answer_evidence_status`,
  `resolution_source_count`, `term_mappings.zero_result_source_count`,
  `failure_risk_signals: zero_result_search`, `source_type_counts` — the fields
  the demo will render once grounded.
- **Mix, not all-resolved** — explicitly asks to keep some `draft_needs_review`
  items, because showing grounded-vs-draft is itself a selling point (no-slop).
- **Round-trip guards** — quantity targets (so counts aren't a toy 1), a
  topic-stability constraint (the demo's 6 topic/intent labels in two files mustn't
  drift silently on regen), a feature-vs-data fork on search-log ingestion, and the
  literal evidence-quote citation format the card renders.

## Deferred

- The actual v2 swap (real grounded answers + real zero-result data on the cards)
  — once the dev delivers.
- #88 deploy follow-ups (verify direct-to-blob on the deploy; remove the old
  route; rate-limit the open endpoints).

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size). Markdown only — no lint/build impact.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `demo-sample-corpus-slice-request.md` (new) | ~143 |
| this plan doc | ~61 |
| **Total** | ~204 |

Well under the 400-LOC soft cap.
