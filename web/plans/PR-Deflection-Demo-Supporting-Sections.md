# Plan: Support Ticket Deflection demo — supporting sections (slice 2b-i)

Slice 1 (#63) shipped the demo's core: search → today's jargon doc vs the
Report's answer → illustrative per-issue volume → bottom CTA. This slice adds
three of the GLM demo's *static* supporting sections — a cost strip, the
aggregate "math," and a "how it works" — re-themed to our look and re-voiced to
the real offer. The interactive top-10 issue table is a separate concern (data
extension + cross-component wiring) and is deferred to 2b-ii.

## Why this slice exists

- The operator asked to port the GLM demo's supporting sections (cost ticker,
  top-10 table, cost-impact metrics, how-it-works), re-themed + offer-aligned.
- The three *static* sections carry no interaction or new data, so they are the
  smallest correct step: pure presentation that enriches the demo page without
  touching the search/match logic.
- The page currently ends on the bottom CTA inside `DeflectionDemo`. To place
  the math + how-it-works *before* the final CTA (GLM's narrative order), the CTA
  is hoisted to the page so the page owns the full vertical flow.

## Scope (this PR)

1. Add a pure `estimateDeflectionTotals` helper to the data layer (aggregate of
   the existing `estimateSavings` across the sample dataset — no new constants).
2. Add three static, server-rendered sections, themed to our tokens:
   - `CostTicker` — a responsive strip of illustrative support economics.
   - `DeflectionMath` — aggregate sample totals ("the math"), labelled illustrative.
   - `HowItWorks` — the three-step Report flow, re-voiced.
3. Hoist the bottom CTA out of `DeflectionDemo` into the demo page, and compose
   the page as: intro → cost strip → demo → math → how-it-works → CTA.

### Files touched

- `web/plans/PR-Deflection-Demo-Supporting-Sections.md` — this plan doc (new)
- `web/src/lib/deflection-demo.ts` — add `estimateDeflectionTotals` + its type
- `web/src/components/deflection-demo/CostTicker.tsx` — illustrative cost strip (new)
- `web/src/components/deflection-demo/DeflectionMath.tsx` — aggregate sample math (new)
- `web/src/components/deflection-demo/HowItWorks.tsx` — three-step Report flow (new)
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — remove the bottom CTA (hoisted)
- `web/src/app/systems/support-ticket-deflection/demo/page.tsx` — compose sections + the hoisted CTA

## Mechanism

- **Data:** `estimateDeflectionTotals(issues = DEMO_ISSUES)` reduces the existing
  per-issue `estimateSavings` into a `DeflectionTotals` (tickets/mo, monthly cost,
  deflected/mo, monthly savings). It introduces no new magic numbers — it sums the
  same illustrative dataset slice 1 already ships, so the "math" can't drift from
  the per-search block.
- **Sections** are presentation-only **server** components (no client hooks): they
  read `DEMO_ISSUES` / the totals helper and render static markup with our tokens
  (`glass`/`--surface`, `--primary`, `text-foreground`, lucide icons). No
  framer-motion, no marquee animation — a clean static strip matches the page and
  avoids a motion-preference concern.
- **CTA hoist** is a behavior-preserving relocation: the exact CTA block (heading,
  copy, `Link` to `/systems/support-ticket-deflection/intake`) moves verbatim from
  the end of `DeflectionDemo` to the end of the page. `DeflectionDemo` drops the
  now-unused `Link`, `FileText`, and `ArrowRight` imports; the page gains them.

## Intentional

- **Three static sections only; top-10 table deferred** — the table needs a data
  extension and "Try it" rows that drive `DeflectionDemo`'s search state (cross-
  component wiring). That is a different, larger concern → 2b-ii.
- **CTA hoisted, not removed** — the operator said keep the bottom CTA; it stays
  as the bottom-of-page element. Hoisting is the only way to put math + how-it-
  works before it (GLM's order) without nesting sections inside the demo.
- **Offer-voice re-write — these GLM claims are dropped on purpose:**
  - Cost strip drops `Clarify avg. deflection rate: 58%` entirely. Industry
    self-service deflection (~20–30%) is kept only with an *illustrative* label.
  - How-it-works step 1 drops the desk vendor list (Zendesk/Intercom/Freshdesk/
    Help Scout) — the offer is desk-agnostic; neutral "export a CSV" language.
  - How-it-works step 3 drops `30–60% of repeat questions never become tickets`
    — no guaranteed deflection %.
  - "We build your self-service center" is softened to "we surface your top
    repeat questions and draft answers your team reviews and publishes" — the
    Report drafts, the team publishes; not a managed service.
- **Math labelled, in the UI, not just in a comment** — a visible badge
  ("Across the sample issues in this demo · illustrative") sits above the metrics,
  and the footnote repeats it is not a guaranteed result.

## Deferred

- **2b-ii:** the interactive top-10 issue table (extend the dataset toward 10
  illustrative issues; rows with a "Try it" action that drives the search state).
- **2c:** wire `searchDeflection` to the real Atlas backend + public dataset.
- Optional polish: count-up animation on the math metrics (kept static here).
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` clean; `npm --prefix web run build` compiles —
  `/systems/support-ticket-deflection/demo` prerenders with the new sections.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  7 == 7 + diff-size).
- Browser spot-check: cost strip renders below the intro; math totals match the
  illustrative dataset; how-it-works reads in the Report's voice (no guaranteed
  %, no vendor list); the bottom CTA still links to the deflection intake.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `deflection-demo.ts` totals helper + type | ~24 |
| `CostTicker.tsx` | ~45 |
| `DeflectionMath.tsx` | ~70 |
| `HowItWorks.tsx` | ~70 |
| `DeflectionDemo.tsx` CTA removal (delete + import trim) | ~22 |
| `demo/page.tsx` compose + hoisted CTA | ~45 |
| this plan doc | ~95 |
| **Total** | ~371 |

Under the 400-LOC soft cap; the >50%-drift FAIL threshold sits well above this.
