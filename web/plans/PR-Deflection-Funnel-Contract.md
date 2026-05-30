# Plan: Lock the deflection landing funnel contract

## Why this slice exists

The public Support Ticket Deflection landing page has now had the major funnel
pieces added: no global menu/footer, embedded calculator, embedded demo, intake
CTAs, pricing, and FAQ. A browser audit confirms the page is more focused than
the older plan language: the calculator is embedded on-page, so visible links no
longer need to leave for `/calculator`; every visible landing link goes to the
intake route.

The active code still has stale calculator-link plumbing and comments in
`landingConfig-v2.tsx`, which can confuse future passes into re-adding a
calculator off-ramp that no longer matches the embedded-calculator funnel.

## Scope (this PR)

Slice phase: Product polish

1. Remove obsolete calculator-link plumbing from the v2 landing config.
2. Update partner-page comments that still describe the old off-page calculator
   link.
3. Keep the embedded calculator section and its intake CTA unchanged.
4. Keep the public landing exact-match bare chrome behavior unchanged.
5. Record the browser audit results that define the current funnel contract:
   no global nav/footer, no horizontal overflow, and all public-landing links
   point to the intake route.

### Files touched

- `web/plans/PR-Deflection-Funnel-Contract.md` — plan and browser-audit record.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — remove stale calculator-link imports, comments, and optional href parameter.
- `web/src/app/systems/support-ticket-deflection/partner/page.tsx` — update stale partner-funnel comments after the calculator became embedded on the public landing.

## Mechanism

`makeProblemCost()` no longer accepts an optional `calculatorHref`, and the
conditional `Run the numbers on your own volume` link is removed from the config.
The page still embeds `<SupportTaxCalculator compact />` through the existing
`calculator: true` flag in `DeflectionLandingPage`; the calculator's own CTA
continues pointing to `/systems/support-ticket-deflection/intake`.

The partner twin still calls `makeProblemCost()` and omits `calculator`; its
comments now describe the embedded-calculator contract instead of the removed
off-page calculator link.

This does not touch `SiteChrome`, because the browser audit confirms the public
landing already hides the global menu/footer and keeps subroutes unchanged.

## Intentional

- The public landing now has no calculator off-page link because the calculator
  is embedded in the landing flow.
- The standalone `/systems/support-ticket-deflection/calculator` route remains
  available for direct use, sitemap discovery, and non-landing contexts.
- Intake CTAs are intentionally repeated. They are the conversion path, not
  off-ramps.

## Deferred

- No visual redesign of the calculator, demo, pricing, or FAQ sections.
- No changes to the standalone calculator route's own menu/footer behavior.
- No new automated link crawler; this slice records browser verification in the
  plan and keeps the code change small.

Parked hardening: none.

## Verification

- `rg -n "calculatorHref|Run the numbers on your own volume|ArrowRight|from 'next/link'|public /calculator link|no calculator link|makeProblemCost\\(" web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx web/src/app/systems/support-ticket-deflection/partner/page.tsx`
  — only expected `makeProblemCost()` definitions/calls remain; the obsolete
  calculator-link imports, copy, parameter, and comments are gone.
- Browser check at `http://127.0.0.1:3003/systems/support-ticket-deflection`
  desktop — no framework overlay, no global nav/footer, no horizontal overflow
  (`scrollWidth: 1265`, `innerWidth: 1280`), and all 7 visible links point to
  `/systems/support-ticket-deflection/intake`.
- Browser check at `http://127.0.0.1:3003/systems/support-ticket-deflection`
  390px — no framework overlay, no global nav/footer, no horizontal overflow
  (`scrollWidth: 375`, `innerWidth: 390`), and all 7 visible links point to
  `/systems/support-ticket-deflection/intake`.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed.
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~93 |
| Remove stale calculator-link config | ~22 |
| Partner comment cleanup | ~10 |
| Total | ~125 |
