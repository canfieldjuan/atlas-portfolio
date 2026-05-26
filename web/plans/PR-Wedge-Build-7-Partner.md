# Plan: Build slice 7 — the /partner page ($1,000 design-partner pricing, noindex)

Final slice of the wedge build. Adds the partner-priced landing at
`/systems/support-ticket-deflection/partner` (D-025), closing the outbound
dead-link. It reuses the shared `landingConfig` (extracted in #84), so it is
**identical to the wedge except pricing** and cannot drift.

## Why this slice exists

- D-025: the partner page at `/systems/support-ticket-deflection/partner` shows
  the Full Deflection Report at **$1,000** (vs $1,500 public), **first 5 design
  partners only**. The URL is shared only in outbound DMs/cold email and **never
  linked from the public page** — the outbound sequence currently dead-links here.
- The page must be the same cost-angle wedge (D-028 keeps the Google/ranking
  headline a separate future offer — **not** this page), differing only in price.

## Scope (this PR)

Slice phase: Vertical slice

1. **`partner/page.tsx`** (`'use client'`): import the shared `landingPageConfig`
   + `pricingTiers`; map the `full-report` tier to **$1,000**, badge **"FIRST 5
   DESIGN PARTNERS"**, and a design-partner note; render
   `<DiagnosticReportLandingPage config={partnerConfig} />`. Snapshot + Quarterly
   tiers unchanged. Every non-pricing section comes from the shared config.
2. **`partner/layout.tsx`** (server): `metadata` via `generatePageMetadata` +
   **`robots: { index: false, follow: false }`** (noindex), modeled on
   `intake/layout.tsx` — hardens D-025's gate so the $1,000 price stays out of
   search. Metadata copy uses **3–6 months** (not "90 days").

### Files touched

- `web/plans/PR-Wedge-Build-7-Partner.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/partner/page.tsx` — partner landing (shared config + $1,000 pricing override)
- `web/src/app/systems/support-ticket-deflection/partner/layout.tsx` — noindex metadata

## Mechanism

- `partnerPricingTiers = pricingTiers.map(t => t.id === 'full-report' ? {...t,
  price:'$1,000', badge:'FIRST 5 DESIGN PARTNERS', note:<design-partner terms>} :
  t)`; `partnerConfig = { ...landingPageConfig, pricing: {
  ...landingPageConfig.pricing, tiers: partnerPricingTiers } }`. Spreads keep
  every other section identical to the wedge — future wedge copy edits propagate.
- `partner/page.tsx` is `'use client'` (mirrors the wedge `page.tsx`); the
  noindex `metadata` lives in the server `partner/layout.tsx` (a client page
  can't export metadata — same split the repo uses for `intake/`).

## Intentional

- **Cost angle, not Google (D-028).** The partner page is the current wedge at a
  different price; the Google/SEO-ranking headline stays quarantined as a future
  offer — it does **not** go here. (The research pass flagged `copy-template.md`'s
  Google hero as "the partner hero"; that's the future-offer doc, not this page.)
- **noindex chosen (operator).** D-025's gate is the unlinked URL; noindex hardens
  it so the $1,000 price can't be indexed. Trivial metadata flag, not engineering.
- **Only the full-report tier changes.** Snapshot (FREE · NO CARD) + Quarterly
  ($1,500/qtr) are the same offer; the design-partner framing (removed from the
  public badge in #82) lives here, on the partner tier.

## Deferred

- **First-ask "90 days" sweep (B8):** a repo-wide grep found ~10 stale "last 90
  days" first-ask refs the #78 page-only sweep missed — `layout.tsx:6`, both
  `intake/layout.tsx`, `HowItWorks.tsx`, `SupportTicketCsvIntakePage.tsx`,
  `ai-content-ops/page.tsx`, `playbook`, `demo`, `systems/page.tsx`. Live SEO
  metadata + sibling copy contradict the 3–6-month canon. **This page is built
  correct (3–6 months)**; the straggler sweep is its own slice. (Not the legit
  quarterly-refresh "every 90 days", nor the data-retention / demo-content "90
  days" in `deflection-demo.ts`/`playbook.ts`/`gap-report-intake/route.ts`.)
- Minor: hero "self-serve" vs page "self-service" (1-word tidy).

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 3 == 3 + diff-size).
- `npm run lint` / `tsc --noEmit` clean.
- **`npm run build` succeeds** and emits `/systems/support-ticket-deflection/partner`
  (the new route + the server-layout/client-page/imported-config combo only
  validate at build).
- **Grep:** `partner/` files contain no "90 days" (the body inherits the shared
  3–6-month config); the partner full-report tier reads `$1,000` + "FIRST 5
  DESIGN PARTNERS"; `robots: { index: false` present in the layout.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `partner/page.tsx` | ~28 |
| `partner/layout.tsx` | ~24 |
| this plan doc | ~96 |
| **Total** | ~148 |

Well under the 400-LOC soft cap.
