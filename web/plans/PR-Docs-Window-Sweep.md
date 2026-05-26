# Plan: Sweep first-ask window + "self-serve" in the internal landing-framework docs

A **repo-wide** grep (the §1a check finally run across `web/docs`, not just
`web/src` — the scope miss the #82 and #89 NITs flagged) found the first-ask
"90 days" and the product-output "self-serve" still in the internal
planning/voice docs that copy is drawn from. Reconcile them to the canon (3–6
months per D-027; "self-service answers" per the page) so future drafts don't
inherit stale values. **No user-facing/live copy changes — all rendered copy
was already reconciled (#78–#89).**

## Why this slice exists

- `ticket-deflection-funnel-brief.md`, `support-deflection-first-analysis.md`,
  and `voice-reference.md` are source docs the outbound + page copy is drawn
  from. They still quote the first-ask window as "90 days" and call the
  deliverable "self-serve FAQ answers" — both superseded (D-027 3–6 months; the
  page/FAQ/deliverables say "self-service answers").

## Scope (this PR)

Slice phase: Product polish

Swap, in the three internal docs (9 edits):
1. **First-ask window "90 days" → "3–6 months"** — `funnel-brief` L84/L119,
   `first-analysis` L30/L46/L80, `voice-reference` L189 (factual paid-batch
   description) + L431 (the current cold-DM template, matching the acq-pack copy
   reconciled in #89).
2. **Product-output "self-serve" → "self-service"** — `funnel-brief` L81/L85
   ("self-serve FAQ answers/content").

### Files touched

- `web/plans/PR-Docs-Window-Sweep.md` — this plan doc (new)
- `web/docs/landing-page-framework/ticket-deflection-funnel-brief.md` — window + self-serve
- `web/docs/landing-page-framework/support-deflection-first-analysis.md` — first-ask window
- `web/docs/landing-page-framework/voice-reference.md` — paid-batch + cold-DM window

## Mechanism

- Pure copy swaps in internal docs; en-dash "3–6 months" to match the canon.
  Nothing rendered changes.

## Intentional

- **`voice-reference.md` L252 + L399 left as-is** — these are *worked
  hero-candidate examples* with illustrative metrics (47 FAQs, 31% drop, 12,400
  tickets) and a move-by-move annotation (L411–424) that explicitly cites "90" as
  a "specific always" teaching point. Swapping their window cascades into the
  teaching annotation; they're frozen voice illustrations, not live offer copy.
  Named here, not silently skipped.
- **`decisions.md` left entirely** — its "90 days" are the D-027/D-019 decision
  *records* + history, the quarterly-refresh cadence, and the D-017
  *fulfillment-model* "self-serve" (a genuinely different concept), all correct.
- **`$1,500` untouched** — the public price; the partner price is `/partner`-gated.

## Deferred

- #88 follow-ups: remove the old `/api/gap-report-intake` POST after the
  direct-to-blob flow is verified on a deploy; rate-limit the open endpoints
  (`HARDENING.md` `DEFLECTION-INTAKE-RATELIMIT-1`).
- The two `voice-reference` worked examples (above) — revisit if those examples
  are ever refreshed (would also touch the illustrative metrics + annotation).

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 4 == 4 + diff-size). Markdown only — no lint/build impact.
- **§1a repo-wide grep:** `grep -rnE "90 day|90-day|self-serve" web/docs` leaves
  only the intentional refs named in Intentional (decision records/history,
  quarterly-refresh, D-017 fulfillment self-serve, and the two flagged
  voice-reference worked examples).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `ticket-deflection-funnel-brief.md` (4 edits) | ~8 |
| `support-deflection-first-analysis.md` (3 edits) | ~6 |
| `voice-reference.md` (2 edits) | ~4 |
| this plan doc | ~80 |
| **Total** | ~98 |

Well under the 400-LOC soft cap.
