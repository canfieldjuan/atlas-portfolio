# Plan: Canonicalize the decisions doc (promote `decisions-updated.md` + lock the resolved decisions)

Establish a single source of truth for the landing-page/product decisions before
we draft landing copy. The operator added a newer `decisions-updated.md`; this
promotes it into the committed canonical location and locks the decisions we just
resolved (ICP, mechanism, headline angle) on top of it.

## Why this slice exists

- We had two decision docs: the committed `web/docs/landing-page-framework/decisions.md`
  (stale — 5 items still OPEN) and `SEO-Ticket-Deflection-Template-Docs/decisions-updated.md`
  (newer — those 5 DECIDED + 3 added). Copy drafting can't be stable on two docs.
- A diff confirmed the updated doc is a **clean superset** (`+148 / −38`, where the
  38 "deletions" are OPEN/`_pending_` placeholders replaced by DECIDED content —
  nothing of substance dropped), so promoting it is safe.
- It also lets us lock the decisions resolved in discussion (2026-05-25): ICP stays
  10-50, the 3-step mechanism, and the Google-headline-as-separate-future-offer.

## Scope (this PR)

Slice phase: Workflow/process

1. Promote `decisions-updated.md` → the committed `decisions.md` (it supersedes the
   stale one cleanly; flips D-009/011/012/013/016 OPEN→DECIDED; adds D-025/026/027).
2. Lock the resolved overrides on top: D-001 ICP **stays 10-50** (supersedes
   `offer-locked.md`'s 10-100); add **D-028** (Google/SEO-ranking headline = separate
   future offer, not the current wedge) and **D-029** (landing "how it works" = 3
   steps; relocate the 6-stage pipeline rigor to proof); note the quarterly-refresh
   "90 days" stays while the first-ask export window → 3-6 months.

### Files touched

- `web/plans/PR-Canonicalize-Decisions.md` — this plan doc (new)
- `web/docs/landing-page-framework/decisions.md` — promoted superset + ICP-10-50 lock + D-028/D-029

## Mechanism

- The committed `decisions.md` is overwritten with the verified-superset content of
  `decisions-updated.md`, then three targeted edits add the overrides (the ICP bullet
  in D-001, the two new index rows, and the D-028/D-029 bodies + the export-window
  per-instance note).
- The `SEO-Ticket-Deflection-Template-Docs/` folder stays as the operator's input
  drop-zone; its `decisions-updated.md` is now **superseded** by the committed
  canonical. The other docs there (`copy-template.md`, `offer-locked.md`,
  `outbound-sequence.md`, `social-posts.md`) remain working drafts for the copy/build
  phase and are **not** committed in this slice.

## Intentional

- **ICP 10-50, not 10-100** — operator override; `offer-locked.md`'s 10-100 is
  superseded and called out inline in D-001 so it can't leak into copy.
- **Export window: 3-6 months for the first ask, but the quarterly refresh stays
  "every 90 days"** — they're two different "90 days"; the eventual copy swap is
  per-instance, not a global find-replace (noted in D-027).
- **6-stage pipeline relocates, not deleted** (D-029) — the rigor is proof; the
  landing's how-it-works is 3 buyer-altitude steps.
- **Google/SEO-ranking headline quarantined** (D-028) — kept off the live wedge to
  stay inside the no-guaranteed-ranking claims guardrail; it's a separate future test.
- **Docs-only, no code** — this changes no app behavior; it's the source-of-truth
  that the copy/build phase will draw from.

## Deferred

- The copy/build phase that this unblocks: draft the landing copy (`copy-template.md`
  structure into the existing template), then build — the `/partner` route (the one
  real build gap), the per-instance export-window + 3-step + partner-price copy swaps,
  and the wedge→calculator link.
- Committing the other `SEO-Ticket-Deflection-Template-Docs/` assets into the repo, if
  we want them tracked.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  2 == 2 + diff-size). No lint/build impact (Markdown under `web/docs/`).
- `decisions.md` index now runs D-001…D-029; D-009/011/012/013/016 read DECIDED;
  D-001 carries the 10-50 lock; D-028/D-029 bodies present; diff vs HEAD is the
  superset delta + the three overrides, no unexpected removals.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `decisions.md` (promote superset + 3 overrides) | ~245 |
| this plan doc | ~95 |
| **Total** | ~340 |

Under the 400-LOC soft cap (the bulk is an editorial doc promotion, not code).
