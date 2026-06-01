# Plan: Deflection funnel chrome

## Why this slice exists

The Support Ticket Deflection landing page is already a focused conversion page,
but adjacent funnel routes still inherit the global menu and footer. That gives
visitors broad escape paths after they click into the demo, calculator, or
intake flow. The partner-priced page is also a noindex-focused offer twin, so it
should follow the same chrome rules. The campaign should keep buyers inside the
offer path and leave the page-level CTAs as the intentional navigation.

## Scope (this PR)

Slice phase: Product polish

1. Centralize global chrome hiding through the existing `shouldHideChrome`
   helper.
2. Hide global navigation and footer on the support-ticket-deflection landing,
   demo, calculator, support-tax calculator, intake, partner, and results
   routes.
3. Keep route-level links and CTAs unchanged, including the demo's calculator
   link and each page's back/intake links.
4. Do not change offer copy, calculator behavior, intake behavior, metadata, or
   sitemap entries.

### Files touched

- `web/plans/PR-Deflection-Funnel-Chrome.md` - this plan doc.
- `web/src/lib/no-chrome-routes.ts` - add the deflection funnel no-chrome route list and results prefix.
- `web/src/components/SiteChrome.tsx` - use the centralized no-chrome helper instead of a local route list.

## Mechanism

`NO_CHROME_ROUTES` gains the exact support-ticket-deflection funnel routes that
should not show global navigation or footer. A prefix list covers generated
results pages under `/systems/support-ticket-deflection/results/`. `SiteChrome`
then calls `shouldHideChrome(pathname)` instead of maintaining its own separate
`BARE_ROUTES` and `BARE_PREFIXES`, so the wrapper, `Navigation`, and `Footer`
share one source of truth.

## Intentional

- This is a structural chrome change, not a copy pass.
- The standalone calculator route remains available; it just stops showing the
  global site menu/footer.
- Route-level links remain in place because they are part of the campaign flow:
  back to the offer, demo-to-calculator, and intake CTAs.
- The no-chrome list stays exact-match for static routes so unrelated support
  ticket deflection pages are not stripped by accident.

## Deferred

- No visual repositioning of the demo, calculator, or intake sections is included.
- No sitemap or SEO metadata changes are included.
- No landing-page copy rewrite is included.

Parked hardening: none.

## Verification

- `bash scripts/local_pr_review.sh` - passed; includes plan-doc audits, drift
  audit, ESLint, Next build, and `git diff --check`.
- `rg -n "BARE_ROUTES|BARE_PREFIXES|/systems/support-ticket-deflection($|/(demo|calculator|support-tax|intake|partner|results/))|shouldHideChrome" web/src/components/SiteChrome.tsx web/src/lib/no-chrome-routes.ts`
  - confirmed `SiteChrome` uses `shouldHideChrome`, the deflection funnel routes
    and results prefix live in `no-chrome-routes.ts`, and no local
    `BARE_ROUTES` / `BARE_PREFIXES` list remains.
- `rg -n "'/systems/support-ticket-deflection'|BARE_ROUTES|BARE_PREFIXES" web/src/components/SiteChrome.tsx web/src/lib/no-chrome-routes.ts`
  - confirmed the base landing route is also centralized in
    `no-chrome-routes.ts`.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~60 |
| No-chrome route helper | ~25 |
| SiteChrome cleanup | ~15 |
| **Total** | ~100 |
