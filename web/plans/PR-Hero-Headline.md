# Plan: Rewrite the hero to the felt-state promise (headline + subhead + body)

The page overhaul's headline pass (the operator's #1 complaint — the old headline
front-loaded a mechanism, not a feeling). Rewrite the hero to the **felt state we
deliver on hand-off**: *mess → clean fix list*, relief through clarity —
deliverable-true, no outcome guarantee. Operator-selected headline.

## Why this slice exists

- Old headline: "Stop answering the same $20 questions all day — because your
  help-center docs are written in your words, not your customers'." Clever but
  leads with a mechanism. The promise should be the felt state the report
  creates the moment it lands, verifiable by the customer.

## Scope (this PR)

Slice phase: Product polish

`landingConfig.tsx` hero:
1. **`title`** → "Turn 3–6 months of messy support tickets into a clean
   help-center fix list." (operator-selected; mess → clean, deliverable-true).
2. **`intro`** → "Upload your closed tickets. We hand back the repeat questions —
   in your customers' words — ranked, with drafted, cited answers your team
   reviews and publishes. The first analysis is free." (approved in the preview).
3. **`body`** → benefit-led + reinforcing the felt state: the mess buried across
   months of tickets → a clean prioritized list (customer words, the wording
   gaps where the help center comes up empty = findability, a drafted+cited
   answer each, yours to review/publish), + the no-integration reassurances.

### Files touched

- `web/plans/PR-Hero-Headline.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — hero `title`/`intro`/`body`

## Mechanism

- Three string swaps in the shared hero config (propagates to the wedge +
  `/partner`). The hero artifact (#93) and all sections are unchanged.

## Intentional

- **Felt-state promise, not an outcome guarantee** — "clean fix list" /
  "what to stop first" is true on delivery; no ranking/churn/% claim (D-028).
- **Body leads with benefits** (clarity, customer words, findability gaps,
  drafted+cited answers) and keeps the reassurances (no integration / new
  platform / data project) + no-auto-publish ("yours to review and publish").
- **Findability stays a mechanism** ("wording gaps where your help center comes
  up empty" = zero-result), not a ranking promise.

## Deferred

- The broader benefit-ladder sequencing across sections (problem/solution copy
  focus) — follow-up.
- CFPB `DeflectionReportSample` rebuild — gated on the sample-source decision.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size).
- `npm run lint` / `tsc --noEmit` clean; `npm run build` succeeds; the hero
  renders the new copy on the wedge + `/partner`.
- Only the hero `title`/`intro`/`body` change (the solution section's "It works
  because…" line is untouched).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| hero `title`/`intro`/`body` (3 string swaps) | ~6 |
| this plan doc | ~70 |
| **Total** | ~76 |

Well under the 400-LOC soft cap.
