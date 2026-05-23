# Plan: Support Ticket Deflection demo — core (slice 1)

Build the GLM "Clarify" demo as its own standalone page, re-themed to our
aesthetic and re-framed to the real offer. Slice 1 ships the modular data layer
(the backend seam) + the core interactive experience (search → today's jargon doc
vs the Report's answer → illustrative volume) + the bottom CTA. Supporting
sections and the prominent wedge link come in slice 2.

## Why this slice exists

- The operator wants the GLM demo as its own page, re-themed to our look, built
  **modular and easy to plug into a backend** (the search dataset will live in
  the Atlas repo), with **useful** frontend components and the bottom CTA kept.
- A faithful GLM port would import claims the offer's voice forbids ("Clarify"
  SaaS, Zendesk integration, guaranteed 30–58% deflection). So the copy is
  re-framed to the real offer: a CSV-based Report, illustrative numbers (from the
  public dataset), no guaranteed rate.

## Scope (this PR)

1. Add the modular data/logic layer — types, an illustrative dataset, the
   `searchDeflection` seam (async; swap its body for the Atlas fetch later), and
   an illustrative savings helper.
2. Add the interactive demo component (search + chips → today-vs-Report
   comparison → illustrative volume) + the kept bottom CTA, themed to the site.
3. Add the demo page + metadata at `/systems/support-ticket-deflection/demo`,
   and a sitemap entry.

### Files touched

- `web/plans/PR-Deflection-Demo-Core.md` — this plan doc (new)
- `web/src/lib/deflection-demo.ts` — data + the `searchDeflection` backend seam (new)
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — interactive demo component (new)
- `web/src/app/systems/support-ticket-deflection/demo/page.tsx` — demo page (new)
- `web/src/app/systems/support-ticket-deflection/demo/layout.tsx` — demo metadata (new)
- `web/src/app/sitemap.ts` — add the demo URL

## Mechanism

- **Backend seam:** `searchDeflection(query)` is `async` and currently resolves
  from the local `DEMO_ISSUES` dataset by phrase-matching. To wire the Atlas
  backend, change that function's body to `fetch` the live endpoint (same return
  type). The consuming component already **debounces** input and **guards
  against out-of-order responses** (request id), so the data-source swap is the
  only change needed for a real async fetch.
- **Component** is presentation-only: it calls `searchDeflection` / `estimateSavings`
  and renders the two-doc comparison + illustrative volume + CTA. Re-themed to our
  tokens (blue `--primary`, light `--surface`/`glass`, `text-foreground`,
  lucide icons, framer-motion) — none of the GLM emerald/navy/Font-Awesome.
- **Copy** maps to the offer: "what your help center returns today" (jargon doc)
  vs "what the Report would publish" (actionable, customer-language FAQ), with an
  explicit *illustrative / sample dataset / no guaranteed result* disclaimer.

## Intentional

- **Modular, backend-ready** (operator ask): single data seam, typed contracts,
  reusable `DocCard` / `MatchBar` pieces.
- **Copy re-framed, not faithfully ported** — drops the "Clarify" brand, the
  integration framing, and guaranteed-% claims (voice + `decisions.md`).
- **Bottom CTA kept**; no top CTA added (operator: it doesn't fit well there).
- **Illustrative numbers** sourced from the public-dataset framing, never
  presented as a guaranteed deflection rate.

## Deferred

Slice 2:

- Supporting sections from the GLM demo (cost ticker, full top-10 issue table,
  cost-impact metrics, how-it-works), re-themed.
- Prominent link from the Deflection wedge page to this demo.
- Wire `searchDeflection` to the real Atlas backend + the real public dataset.
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` clean; `npm --prefix web run build` compiles —
  `/systems/support-ticket-deflection/demo` prerenders.
- `bash scripts/pre_push_audit.sh origin/main` green.
- Browser spot-check: search/chips return the comparison; headings legible; CTA
  links to the deflection intake.

## Estimated diff size

| Area | LOC (added) |
|---|---|
| `deflection-demo.ts` data/seam | ~285 |
| `DeflectionDemo.tsx` component | ~275 |
| demo page + layout | ~80 |
| sitemap entry | ~1 |
| this plan doc | ~100 |
| **Total** | ~740 |

Over the 400-LOC soft cap — justified as one indivisible new demo page (a
self-contained interactive component + its data layer); slice 2 enriches it.
