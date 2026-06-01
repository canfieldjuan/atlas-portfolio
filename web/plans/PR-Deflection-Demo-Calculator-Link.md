# Plan: Deflection demo calculator link

## Why this slice exists

The standalone Support Ticket Deflection demo page currently embeds the full
leaky-bucket calculator directly below the interactive report demo. That makes
the page do two jobs at once: show the report output and run a budget model.
After the calculator strategy cleanup, the demo page should stay focused on the
report shape while linking budget-owner visitors to the full calculator route.

## Scope (this PR)

Slice phase: Product polish

1. Remove the full calculator embed from the demo page.
2. Add a compact card linking to `/systems/support-ticket-deflection/calculator`.
3. Keep the demo page's bottom intake CTA and how-it-works section.
4. Keep the standalone full calculator route unchanged.

### Files touched

- `web/plans/PR-Deflection-Demo-Calculator-Link.md` - this plan doc.
- `web/src/app/systems/support-ticket-deflection/demo/page.tsx` - replace the full calculator embed with a calculator link card.

## Mechanism

The route no longer imports or renders `SupportTaxCalculator`. In the post-demo
stack, the full calculator slot becomes a small bordered link card that points to
the standalone calculator page. The full calculator component remains available
on `/systems/support-ticket-deflection/calculator`.

## Intentional

- This is not a copy rewrite. It changes the asset placement only.
- The demo page still includes `HowItWorks` and the bottom intake CTA.
- The full calculator route is not modified.

## Deferred

- No additional calculator copy or design changes are included.
- No landing-page placement changes are included; PR #180 handled the landing
  mini calculator.

Parked hardening: none.

## Verification

- `npm --prefix web run lint` - passed.
- `bash scripts/local_pr_review.sh` - passed; includes plan-doc audits, drift
  audit, ESLint, Next build, and `git diff --check`.
- `rg -n "SupportTaxCalculator|Open the full calculator|/systems/support-ticket-deflection/calculator" web/src/app/systems/support-ticket-deflection/demo/page.tsx web/src/app/systems/support-ticket-deflection/calculator/page.tsx`
  - confirmed the demo page links to the standalone calculator route and no
    longer imports or renders `SupportTaxCalculator`; confirmed the calculator
    page still renders `SupportTaxCalculator`.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~55 |
| Demo route placement change | ~25 |
| **Total** | ~80 |
