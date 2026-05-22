# PR-FAQ-Report-Visual-Template

## Why this slice exists

The `/systems/ai-content-ops` page already has the right diagnostic sales-page contract, but the visual presentation still reads closer to a standard template than the stronger FAQ demo direction in `FAQs-Demos/GLM-5.1.html`. The page needs the same long-copy diagnostic argument with a stronger first viewport and a more visceral before/after wedge.

This slice keeps the existing `DiagnosticReportLandingPage` template instead of forking a second sales-page template. It also corrects the naming contract: "Gap Report" is a wedge pattern, not the permanent product brand. Each future page can name the report for its wedge, while this support-ticket page stays branded as the FAQ Report.

The diff is near the 400-addition soft cap because the slice includes both the reusable template slots and the first production artifact implementation those slots were created for. Splitting them would leave an unused template seam in one PR and the actual landing-page proof in another.

## Scope (this PR)

1. Lock the contract decisions for one diagnostic template, modern long-copy, and wedge-specific report naming.
2. Extend `DiagnosticReportLandingPage` with optional visual slots for a hero artifact and a comparison/wedge section.
3. Wire `/systems/ai-content-ops` to those slots with GLM-inspired page rhythm, not a wholesale demo import.
4. Preserve the current intake route, CTA destinations, pricing tiers, FAQ data, public demo artifact links, and no-chrome route behavior.
5. Fix the shared full-bleed section overflow at the root layout level so landing bands do not create horizontal scroll range.

### Files touched

- `docs/landing-page-framework/diagnostic-report-template.md`
- `docs/landing-page-framework/decisions.md`
- `src/components/landing/DiagnosticReportLandingPage.tsx`
- `src/app/systems/ai-content-ops/page.tsx`
- `src/app/globals.css`
- `plans/PR-FAQ-Report-Visual-Template.md`

## Mechanism

`DiagnosticReportLandingPageConfig` gains optional `hero.artifact` and `comparison` fields. `comparison.id` is required when the section is supplied so the scroll-anchor contract matches the required `sample.id` shape. The template renders both visual slots only when supplied, so existing diagnostic pages keep their current shape.

The AI Content Ops route provides two local React artifacts:

- `FAQReportHeroArtifact` for the first-viewport preview of uploaded tickets, repeat-question ranking, and generated FAQ draft output.
- `HelpCenterComparison` for the before/after wedge: existing help-center language vs FAQ Report customer-language answer layer.

The route owns the data, naming, and copy. The template owns the section rhythm and keeps CTA, pricing, FAQ, and sample artifact wiring unchanged.

## Intentional

- No new long-copy template yet. The decisions log now treats one template as the default until a measured conversion gap proves a fork is needed.
- No global "Gap Report" brand lock-in. This page is the FAQ Report; future wedges can use names such as Sales Objection Report, Feature Request Report, or Local SEO Report.
- No imported JSX/HTML from `FAQs-Demos/`. Those files are visual references, not production dependencies.
- No new npm dependencies. The existing Next, Tailwind, lucide, and framer-motion stack is sufficient.
- No rank, churn-prevention, or SEO/GEO/AEO guarantee language. Copy stays inside the verified FAQ Report claim set.
- The artifact palette is tokenized in CSS custom properties. The components use report-artifact tokens, not repeated hardcoded hex classes.

## Deferred

- A later PR can add visual regression tests if the portfolio app adopts a browser test suite.
- A later PR can split repeated artifact rows into a data/content file if a second report page reuses the same structure.
- A later PR can create a second page template only after traffic source data shows the one-template strategy is hurting conversion.

## Verification

Completed:

- `git diff --check`
- `npm run lint`
- `npm run build`
- Browser check at `http://127.0.0.1:3100/systems/ai-content-ops`: first-viewport artifact visible, comparison section visible, no global nav/footer chrome, all main CTAs route to `/systems/ai-content-ops/intake`, and horizontal overflow is `0`.
- Mobile browser check at 390px width: first-viewport artifact and comparison section present, horizontal overflow is `0`.
- Intake route check at `http://127.0.0.1:3100/systems/ai-content-ops/intake`: route returns 200, no global nav/footer chrome, and horizontal overflow is `0`.
- Spot-check after root overflow consolidation: `/`, `/systems`, `/services`, `/resources`, and `/systems/atlas-llm-gateway` all report horizontal overflow `0`.

## Estimated diff size

6 files, approximately +391 / -41 lines. Additions remain under the 400 LOC soft cap; total churn is 432 lines after the review-requested artifact tokenization and overflow consolidation.
