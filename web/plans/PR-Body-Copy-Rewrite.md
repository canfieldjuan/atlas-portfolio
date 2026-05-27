# Plan: ship the support-deflection landing rewrite with its research and collateral artifacts

## Why this slice exists

The current `/systems/support-ticket-deflection` route still uses the shared
`DiagnosticReportLandingPage` template. That template was built around the
original wedge page, not the longer Ogilvy-style body copy developed from the
research briefs. It has no first-class place for the proof stack and risk
reversal sections, and squeezing those into the shared config would widen the
API for another page that does not need them.

This slice moves the support-deflection route onto a dedicated
`DeflectionLandingPage` plus a route-specific `landingConfig-v2.tsx`, while
reusing the extracted landing primitives and the existing pricing / FAQ data.
The dirty worktree also contains the research extracts, body-copy source docs,
keyword collateral, and calculator/demo HTML that produced the rewrite. If the
PR is going to carry the full current diff, the plan has to name that full set
explicitly so the AGENTS audit can verify it.

## Scope (this PR)

Slice phase: Product polish

1. Wire `/systems/support-ticket-deflection` to the standalone
   `DeflectionLandingPage` instead of the shared `DiagnosticReportLandingPage`.
2. Add `landingConfig-v2.tsx` to hold the longer narrative sections: problem
   agitation, current-way-vs-this-way, mechanism, proof stack, offer, risk
   reversal, and CTA.
3. Extract the shared landing primitives used by both the old diagnostic page
  and the new standalone page, and repair the import edges that change causes
  in the support-deflection route and partner page.
4. Keep the existing pricing tiers, FAQ items, intake route, and shared visual
  primitives intact.
5. Preserve the JSON-LD FAQ payload on the standalone page so the route does
   not regress on structured data.
6. Include the supporting research, body-copy source material, keyword list,
  and calculator/demo HTML that are already dirty in the worktree so the PR
  matches the actual state on disk.

### Files touched

- `web/plans/PR-Body-Copy-Rewrite.md` — plan doc for the standalone rewrite
- `FAQ Generator Keyword.txt` — Google Ads keyword artifact for the support-deflection / FAQ generator motion
- `SEO-Ticket-Deflection-Template-Docs/The_Friction_Multiplier.md` — research brief on repetitive-support cost and operations
- `SEO-Ticket-Deflection-Template-Docs/body-copy-data-brief.md` — extracted evidence mapped to the landing-page argument
- `SEO-Ticket-Deflection-Template-Docs/body-copy-outline-alt.md` — alternate question-led body-copy outline
- `SEO-Ticket-Deflection-Template-Docs/body-copy-outline.md` — primary body-copy outline
- `SEO-Ticket-Deflection-Template-Docs/body-copy-section-1.md` — drafted problem-agitation section
- `SEO-Ticket-Deflection-Template-Docs/body-copy-section-2.md` — drafted current-way-vs-this-way section
- `SEO-Ticket-Deflection-Template-Docs/body-copy-section-3.md` — drafted mechanism section
- `SEO-Ticket-Deflection-Template-Docs/body-copy-section-4.md` — drafted proof-stack section
- `SEO-Ticket-Deflection-Template-Docs/body-copy-section-5.md` — drafted offer section
- `SEO-Ticket-Deflection-Template-Docs/body-copy-section-6.md` — drafted risk-reversal section
- `SEO-Ticket-Deflection-Template-Docs/body-copy-section-7.md` — drafted CTA section
- `SEO-Ticket-Deflection-Template-Docs/compass_artifact_wf-6079584f-1416-4306-8ae1-3017e6e67b69_text_markdown.md` — sourced business-intelligence brief on repetitive support cost
- `SEO-Ticket-Deflection-Template-Docs/compass_artifact_wf-b40e704d-e762-46e3-a8b8-5eb0ef3af3db_text_markdown.md` — sourced sales-intelligence brief on repeat-question language and triggers
- `SEO-Ticket-Deflection-Template-Docs/internal-language-extract.md` — extracted internal support-language phrases
- `SEO-Ticket-Deflection-Template-Docs/leaky-bucket-calculator.html` — calculator HTML with accessibility-label fix
- `SEO-Ticket-Deflection-Template-Docs/preview.html` — calculator / preview HTML artifact
- `SEO-Ticket-Deflection-Template-Docs/sourced-facts-extract.md` — ranked sourced-facts extract
- `web/src/components/landing/DeflectionLandingPage.tsx` — standalone page component for the support-deflection route
- `web/src/components/landing/DiagnosticReportLandingPage.tsx` — shared page updated to consume extracted primitives
- `web/src/components/landing/LandingPrimitives.tsx` — extracted shared landing primitives and exported types
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — exports shared support-deflection constants used by the new config
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — route-specific long-form copy config
- `web/src/app/systems/support-ticket-deflection/page.tsx` — swap the route from the shared template to the standalone page
- `web/src/app/systems/support-ticket-deflection/partner/page.tsx` — import-edge repair after type extraction

## Mechanism

The standalone page keeps the existing section-band layout and reuses
`AnimatedCard`, `Pipeline`, `PricingTierCard`, `PrimaryCta`, and `SectionLabel`
from `LandingPrimitives`. That keeps the design language aligned with the rest
of the site without forcing the shared diagnostic template to grow new optional
sections.

`landingConfig-v2.tsx` imports `GAP_REPORT_INTAKE_HREF`, `pricingTiers`, and
`pricingFaqs` from the existing `landingConfig.tsx`. That means pricing and FAQ
content stay single-sourced while the persuasive narrative moves into the new
route-specific config.

`LandingPrimitives.tsx` becomes the shared home for the diagnostic landing
types and reusable UI pieces that were previously defined inline in
`DiagnosticReportLandingPage.tsx`. That extraction is what lets the new route
reuse the same cards, CTA, pipeline, and pricing visuals without duplicating
the rendering logic.

The standalone component now renders the same optional JSON-LD script hook as
the shared template, so FAQ structured data survives the route swap.

The non-`web` files in the diff are the source and collateral artifacts for the
same support-deflection motion: the research briefs, body-copy source docs,
keyword list, calculator preview, and calculator accessibility fix. This plan
names them because the PR will otherwise fail the exact-files-touched audit.

## Intentional

- Standalone component over shared-template expansion: the proof stack and risk
  reversal are specific to this route, so the lowest-risk change is to keep
  them out of the shared diagnostic config.
- Carry the research bundle in the same PR: the working tree already includes
  the source materials that produced the rewrite, and the user explicitly asked
  to add the dirty files to the PR rather than split them out.
- Reuse shared pricing / FAQ data: pricing and FAQ copy should not fork unless
  the commercial offer changes.
- Keep copy in JSX config blocks: this page is content-heavy, and colocating the
  copy with its section config makes the render order explicit and easy to edit.

## Deferred

- Refresh `layout.tsx` metadata if the new headline and body copy prove out.
- Add a dedicated visual treatment for analyst pull quotes if the team wants a
  stronger editorial look.
- A/B test the standalone long-form page against the original wedge if traffic
  volume justifies it.
- Split the research/collateral artifacts into a separate docs-only slice if the
  team decides the eventual PR should stay under a smaller review surface.

Parked hardening: none.

## Verification

1. `npm --prefix web run build`
2. `npm --prefix web run lint`
3. Visual check on `/systems/support-ticket-deflection` for section order,
   pricing, FAQ, and intake CTAs
4. Plan-doc audit should see the same file list as `git status --short`

## Estimated diff size

| Area | LOC |
|---|---|
| `DeflectionLandingPage.tsx` | ~20 |
| `landingConfig-v2.tsx` | ~260 |
| landing primitive extraction + import repairs | ~230 |
| route wiring + config export changes | ~25 |
| research and collateral artifacts | ~3500+ |
| Plan doc update | ~130 |
| Total | large, justified by user-requested full dirty worktree inclusion |