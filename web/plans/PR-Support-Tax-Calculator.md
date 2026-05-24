# Plan: Support Tax Calculator — standalone page + demo embed

Port the operator's standalone "Support Tax Calculator" HTML
(`~/Downloads/support-tax-calc.html`) into the site as a reusable React
component, re-themed to our tokens and re-voiced to our measured tone, mounted
both on its own page and embedded in the demo page.

## Why this slice exists

- The operator built a support-cost calculator and wants it on the site, themed
  to match, both standalone and embedded in the demo.
- It strengthens the funnel: the demo shows *this question → why it matters*; the
  calculator shows *what repeat tickets cost across volume*; how-it-works shows
  *the path*. It's a new top-of-funnel interactive surface that drives the same
  free-Snapshot CTA.

## Scope (this PR)

Slice phase: Vertical slice

1. Add `SupportTaxCalculator` — a reusable client component: two user inputs
   (monthly ticket volume, fully-loaded cost per Tier-1 ticket) + an adjustable
   repeat-rate assumption; outputs the monthly/annual cost of repeat tickets,
   monthly hours, and a volume breakdown; re-themed + re-voiced; CTA → the intake.
2. Add the standalone page + metadata at `/systems/support-ticket-deflection/calculator`.
3. Embed the same component on the demo page (between the interactive demo and
   how-it-works).
4. Add the calculator URL to the sitemap.
5. Add the user-input-calculator exception to the claims-discipline section of the
   funnel brief, so the calculator and the no-cost-claim rule coexist.

### Files touched

- `web/plans/PR-Support-Tax-Calculator.md` — this plan doc (new)
- `web/src/components/deflection-demo/SupportTaxCalculator.tsx` — the calculator component (new)
- `web/src/app/systems/support-ticket-deflection/calculator/page.tsx` — standalone page (new)
- `web/src/app/systems/support-ticket-deflection/calculator/layout.tsx` — metadata + breadcrumb (new)
- `web/src/app/systems/support-ticket-deflection/demo/page.tsx` — embed the calculator
- `web/src/app/sitemap.ts` — add the calculator URL
- `web/docs/landing-page-framework/ticket-deflection-funnel-brief.md` — claims-doc exception note

## Mechanism

- **Pure logic, user-driven:** `repeatVolume = round(ticketVolume × repeatPct)`,
  `monthlyCost = repeatVolume × costPerTicket`, `annualCost = monthlyCost × 12`,
  `hours = repeatVolume × 0.2` (12-min touch time). Faithful to the source HTML.
  State is `ticketVolume` / `costPerTicket` / `repeatPct`; outputs are derived
  inline. Client component (`'use client'`), no backend, no seam.
- **Re-themed** to our tokens (`glass`, `--surface`, `--primary`, `text-foreground`,
  `border-border`; range inputs use `accentColor: var(--primary)`) — drops the
  source's amber/rose/slate dark theme. **No count-up animation** — values render
  directly (the source's rAF/reduced-motion machinery is omitted; it's polish, not
  substance).
- **Two mount points, one component:** the standalone `calculator/page.tsx` and the
  demo page both render `<SupportTaxCalculator />`. Lives in
  `web/src/components/deflection-demo/` beside `DeflectionDemo` / `HowItWorks`.
- **CTA → `/systems/support-ticket-deflection/intake`** (the free-Snapshot path),
  same target as the wedge/playbook — not a new opt-in.

## Intentional

- **Re-voiced to the site's measured tone** — the source copy is deliberately
  snarky ("adorable little chaos machine," "character-building"). That's a fine
  voice; it isn't ours. Rewritten plain, not because the original was wrong.
- **Claims kept defensible** (this is a customer-facing artifact with cost + scale
  language, so it's held to the claims doc):
  - **Dropped the "parses up to 50k tickets in 2 minutes" microcopy** entirely — a
    cost calculator is the wrong surface for a throughput claim, and it brushes the
    `FAQSCALE-1` hosted-scale line. Engine claims belong past the CTA, if anywhere.
  - **De-loaded the result vocabulary** — "margin leak / cash burned / annual cash
    leak" → "monthly/annual cost of repeat tickets." The tool's *name* ("Support
    Tax Calculator") stays as a metaphor; the result cards don't double down on it.
  - **Bottom-of-card disclaimer:** "Illustrative estimate from your inputs + a
    stated repeat-rate / 12-min assumption. Not a forecast of what the Report will
    save." The last clause holds the no-guaranteed-deflection-% line.
  - **The cost is defensible because the user supplies cost-per-ticket** — it's
    their number, not a product cost-claim. The funnel brief's claims section is
    updated to name this exception.
- **Repeat-rate is an adjustable slider** (default 40%, labeled "industry-average
  assumption") — the one change from the source's fixed constant. It makes the
  result *the prospect's* number and lets a skeptic lower it and still see a real
  figure — a stronger argument than a baked-in default.

## Deferred

- Count-up metric animation (source had it; omitted as polish).
- A second assumption slider for touch-time (kept fixed at 12 min, labeled).

Parked hardening: none.

## Verification

- `npm --prefix web run lint` clean; `npm --prefix web run build` compiles — the
  calculator page prerenders, the demo page still builds.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  7 == 7 + diff-size).
- Browser spot-check: sliders/inputs update the outputs live; lowering the
  repeat-rate lowers the cost; CTA → the intake; theme matches the demo/playbook.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `SupportTaxCalculator.tsx` | ~235 |
| `calculator/page.tsx` | ~40 |
| `calculator/layout.tsx` | ~30 |
| `demo/page.tsx` (embed) | ~6 |
| `sitemap.ts` (one URL) | ~1 |
| funnel brief (claims exception) | ~3 |
| this plan doc | ~110 |
| **Total** | ~425 |

Modestly over the 400 soft cap — justified as one indivisible new interactive
tool (the component is ~235 of it, mostly presentational); splitting the embed
from the component is ceremony without review value.
