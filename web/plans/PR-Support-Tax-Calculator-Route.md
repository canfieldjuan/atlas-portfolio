# Plan: 30-Second Support Tax Calculator route

Adds a second, simpler, manager-facing calculator as a proper site route, alongside
the existing exec "leaky bucket" calculator at `/calculator`. It gives the outbound
manager lane (and visitors) a fast two-input cost estimate, and a clean URL to link.

## Why this slice exists

- The outbound copy routes the support-manager lane to a "simple support-tax
  calculator" (agent time + cost), distinct from the exec leaky-bucket one. That
  asset existed only as a standalone HTML file, not a live URL, so it could not be
  linked from outreach.
- The portfolio already has the exec calculator (`SupportTaxCalculator`, the leaky
  bucket, 7 inputs) at `/calculator`. The simpler model (2 inputs: ticket volume +
  fully loaded cost per ticket) deserves its own route, built native to the site's
  design system rather than a ported HTML blob.

## Scope (this PR)

Slice phase: Vertical slice

1. **`src/components/deflection-demo/ThirtySecondCalculator.tsx`** (new, client) — the
   simple model: `repeatVolume = tickets * 40%`, `monthlyTax = repeatVolume * cost`,
   `annualTax = monthlyTax * 12`, `hours = repeatVolume * 0.2`. Self-contained slider +
   metric helpers using the site tokens (`glass`, `border-border`, `bg-surface`,
   `text-foreground`, `text-primary`, `accentColor: var(--primary)`), mirroring the
   existing `SupportTaxCalculator` patterns. CTA links to `/intake`.
2. **`.../support-tax/page.tsx`** (new) — route shell mirroring `/calculator/page.tsx`
   (back link, eyebrow, H1, intro, the calculator).
3. **`.../support-tax/layout.tsx`** (new) — SEO metadata + breadcrumb JSON-LD, same
   shape as the calculator layout.
4. **`src/app/sitemap.ts`** — add the `/support-tax` URL next to `/calculator`.

### Files touched

- `web/plans/PR-Support-Tax-Calculator-Route.md` — this plan doc (new)
- `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` — the calculator (new)
- `web/src/app/systems/support-ticket-deflection/support-tax/page.tsx` — route shell (new)
- `web/src/app/systems/support-ticket-deflection/support-tax/layout.tsx` — SEO layout (new)
- `web/src/app/sitemap.ts` — sitemap entry

## Mechanism

- Pure client calculator, no network, no persistence. Same math the standalone HTML
  used (verified correct), ported to React state.
- Copy follows the current doctrine: sizes the *cost* ("annual spend on repeat
  tickets", "this sizes current spend, not a forecast of what the Report will save"),
  no deflection-percentage promise, soft speed ("you won't wait days"), the new
  positioning (drops the old "SEO search terms" framing), no em dashes, "3 months"
  language is not used here (no ticket-window claim on this page).

## Intentional

- A distinct component, not a `compact`/mode variant of `SupportTaxCalculator` — the
  two calculators model different things (multi-leak exec view vs single-cost manager
  view) and should evolve independently.
- The standalone `SEO-Ticket-Deflection-Template-Docs/30-sec-support-calc.html` is left
  in place as the design reference; this route is the canonical live version.
- Inherits the global chrome like the other deflection subroutes (only the exact
  landing strips it), so no `SiteChrome` change is needed.

## Deferred

- No cross-links between the two calculators, and no change to the existing
  `/calculator` route or `SupportTaxCalculator` component.
- Wiring the live `/support-tax` URL into the outbound copy `[link]` is a separate copy
  edit (lane 4), not part of this route PR.

Parked hardening: none.

## Verification

- `npm run lint` = 0; `npm run build` compiles and lists `/systems/support-ticket-deflection/support-tax`
  as a static route.
- Math matches the verified standalone model (1,500 tickets, $15 -> 600 repeat,
  $9,000/mo, $108,000/yr, 120 hrs/mo).
- `bash scripts/pre_push_audit.sh origin/main` + python files-touched and diff-size
  audits green (committed diff).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| ThirtySecondCalculator.tsx | ~250 |
| support-tax/page.tsx | ~40 |
| support-tax/layout.tsx | ~30 |
| sitemap.ts | ~1 |
| this plan doc | ~90 |
| **Total** | ~411 |
