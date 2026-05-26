# Plan: Add the demo-card + benefit audit (page-overhaul prep)

Saves the audit of the landing page's demo/artifact cards against **what the FAQ
report actually returns** (`TicketFAQItem`), plus a benefit inventory
(direct vs indirect, keyed to real fields) and the demo-swap consideration.
Companion to `page-overhaul-brief.md`; raw material for the overhaul + the second
session. Docs only; no product change.

## Why this slice exists

- The operator flagged that the demo cards have wrong labels / data that doesn't
  match what we ship, and that the page under-surfaces benefits. The operator
  then provided the real report shape. This doc captures, durably, the
  card-by-card mapping to real fields + the defensible benefit inventory so the
  rebuild starts from ground truth, not invented numbers.

## Scope (this PR)

Slice phase: Workflow/process

1. **New audit doc** `web/docs/landing-page-framework/demo-card-benefit-audit.md`:
   the report's real fields (source of truth), Part 1 (per-card audit: hero
   artifact, comparison/term-map, CFPB sample, deliverables cards → the real
   field + corrected label), Part 2 (benefit inventory, direct vs indirect),
   Part 3 (demo-swap consideration), and the labeling traps (`frequency` vs
   `ticket_count`, derived scores, search-`score` vs `opportunity_score`,
   draft-not-publish-ready).

### Files touched

- `web/plans/PR-Demo-Benefit-Audit.md` — this plan doc (new)
- `web/docs/landing-page-framework/demo-card-benefit-audit.md` — the audit (new)

## Mechanism

- Pure documentation. Maps the current `landingConfig.tsx` demo data (exact
  values) to the operator-provided report schema; adds no decisions, changes no
  rendered copy.

## Intentional

- **Analysis, not a product change** — nothing under `src/` is touched.
- **Part 3 (demo swap) is explicitly open**, not a decision — it depends on
  finding a defensible B2B-SaaS sample source.

## Deferred

- The card rebuild itself (each card → exact field + corrected copy) — next slice.
- The headline/benefit-ladder rewrite — later slices.
- #88 follow-ups (deploy-verify; remove old intake route; rate-limit endpoints).

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size). Markdown only — no lint/build impact.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `demo-card-benefit-audit.md` (new) | ~150 |
| this plan doc | ~50 |
| **Total** | ~200 |

Well under the 400-LOC soft cap.
