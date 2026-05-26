# Plan: Add the page-overhaul onboarding brief

Adds a self-contained handoff doc so a second working session can get up to speed
on the Support Ticket Deflection landing page — what the product is, how the page
is built, what's shipped (#78–#90), what the product actually delivers, the
guardrails, and the operator's next-phase problem list (copy focus, benefit
architecture, the demo-card label/data mismatch). Docs only; no product change.

## Why this slice exists

- The page is built + consistent but not yet persuasive; the operator is bringing
  in a second session to help with page structure / copy / benefit architecture,
  starting with the on-page demos. They need one cold-readable context doc instead
  of re-deriving 13 PRs of history.

## Scope (this PR)

Slice phase: Workflow/process

1. **New brief** `web/docs/landing-page-framework/page-overhaul-brief.md`:
   product/offer/ICP/angle, claims discipline, page anatomy (config-driven
   template + the three demo artifacts + siblings), what the product actually
   ships (deliverable shape + Atlas search contract), the 13-PR build log +
   current state, the next-phase problem list, guardrails, and pointers.

### Files touched

- `web/plans/PR-Page-Overhaul-Brief.md` — this plan doc (new)
- `web/docs/landing-page-framework/page-overhaul-brief.md` — the onboarding brief (new)

## Mechanism

- Pure documentation. Summarizes existing canon (`decisions.md`,
  `voice-reference.md`, the acquisition pack, `AGENTS.md`) + the merged PRs into
  one onboarding doc; adds no new decisions and changes no rendered copy.

## Intentional

- **Doc, not a product change** — nothing under `src/` is touched; the live page
  is unaffected.
- **Restates, doesn't re-decide** — the brief points to `decisions.md` etc. as
  canon; if it and a decision ever diverge, the decision wins.

## Deferred

- The actual overhaul work (demo-card fixes, benefit architecture, headline, copy
  focus) — separate slices, starting with the on-page demos.
- #88 follow-ups (verify direct-to-blob on the deploy; remove the old intake
  route; rate-limit the open endpoints).

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size). Markdown only — no lint/build impact.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `page-overhaul-brief.md` (new) | ~215 |
| this plan doc | ~55 |
| **Total** | ~270 |

Well under the 400-LOC soft cap.
