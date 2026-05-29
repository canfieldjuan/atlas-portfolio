# Plan: Deflection cost copy

Sharpen the Support Ticket Deflection cost section so it completes the
post-hero argument: missed wording creates repeat tickets, and repeat tickets
turn cheap self-service answers into expensive assisted contacts.

## Why this slice exists

- The hero and Broken Loop sections now use stronger urgency-driven,
  data-backed, problem-agitation copy.
- The current What It Costs section still reads more explanatory than urgent,
  even though it contains the strongest financial proof on the page.
- The section should make the budget and team cost feel concrete while staying
  defensible and avoiding unsupported churn, ranking, or deflection guarantees.

## Scope (this PR)

Slice phase: Product polish

1. Rewrite the What It Costs section title around repeat questions bleeding the
   support budget.
2. Rewrite the opening paragraph around Gartner's $1.84 / $13.50 / $11.66
   self-service versus assisted-contact benchmark.
3. Keep the calculator link in the same place.
4. Rewrite the team-cost lead-in and bullets while preserving the 39%, five-hour,
   and Insignia burnout/morale/turnover proof points.
5. Rewrite the customer-effort close while preserving the 94% / 4% CEB
   repurchase-intent proof point.
6. Reconcile the source-doc attribution for the $1.84 / $13.50 benchmark where
   it conflicts with the primary Gartner abstract.
7. Keep hero, Broken Loop, offer, pricing, FAQ, intake, layout, and structured
   data unchanged.

### Files touched

- `web/plans/PR-Deflection-Cost-Copy.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — update What It Costs copy
- `SEO-Ticket-Deflection-Template-Docs/The_Friction_Multiplier.md` — reconcile the $1.84 / $13.50 source attribution

## Mechanism

- Update only `makeProblemCost()` in `landingConfig-v2.tsx`.
- Preserve the existing `calculatorHref` behavior so the public page keeps the
  calculator link and the partner page still omits it.
- Keep the existing paragraph, optional link, list, and closing paragraph
  structure.
- Update the one conflicting source-doc sentence that attributed the Gartner
  $1.84 / $13.50 benchmark to Fullview.

## Intentional

- **Cost section only** — this does not rewrite the hero, Broken Loop, offer,
  pricing, FAQ, or intake flow.
- **Safer budget-leak framing** — the copy avoids "financial hemorrhage,"
  "undeflected question," and direct customer lifetime value claims.
- **Same stats** — the section keeps $1.84, $13.50, $11.66, 39%, five hours,
  and 94% / 4%.
- **No new guarantee** — the section makes repeat cost visible; it does not
  promise a specific reduction.

## Deferred

- Rewriting the offer or proof sections in the same sharper style.
- Adding proof chips or new above-the-fold UI.
- Updating the intake form with an optional "what should we look for?" field.
- Parked hardening considered but out of scope: DEFLECTION-INTAKE-PII-1.

Parked hardening: none.

## Verification

- `npm --prefix web run lint` — passed.
- `git diff --check` — passed.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` —
  verified the rewritten What It Costs heading, calculator link, $1.84 /
  $13.50 / $11.66 proof points, 94% / 4% close, and no framework error overlay.
- Mobile browser check at 390px — verified the rewritten section and same cost
  stats render with no framework error overlay.
- `npm --prefix web run build` — passed.
- `rg -n "Repeat questions are an operating cost line\.|That wording gap is expensive\. Gartner benchmarked it plainly|Multiply that by your own repeat volume and the cost is a number you can run, not one we promise|That repetition taxes the team twice|The same grind drives burnout|And the customers who never find the answer do not just cost more to handle" web`
  — no stale old What It Costs strings remain.
- Primary-source attribution check — Gartner's public abstract for "Benchmarks
  to Assess Your Customer Service Costs" states median cost per contact is
  $1.84 for self-service and $13.50 for assisted channels.
- `rg -n "Fullview|benchmarks compiled by Fullview|Fullview reveal" SEO-Ticket-Deflection-Template-Docs`
  — no conflicting Fullview attribution remains for the $1.84 / $13.50
  benchmark.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `landingConfig-v2.tsx` What It Costs copy | ~15 |
| `The_Friction_Multiplier.md` attribution reconciliation | ~2 |
| this plan doc | ~105 |
| **Total** | ~122 |

Under the 400-LOC soft cap.
