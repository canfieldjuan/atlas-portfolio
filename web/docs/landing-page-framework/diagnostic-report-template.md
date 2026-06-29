# Diagnostic Report Landing Page Template

Use this pattern for focused report-style offers that turn a buyer's existing messy data into a concrete artifact they can review and act on.

## Page Contract

1. Hero: product eyebrow, specific time-bound promise, one primary CTA, and an optional first-viewport artifact preview.
2. Problem: name the operational pain the buyer already recognizes.
3. Solution: explain the mechanism before asking for belief.
4. Optional before/after wedge: show the current broken state against the report-generated action path.
5. Sample artifact: show a realistic version of what comes back.
6. Deliverables: list the report contents and the action each item unlocks.
7. Fit / not fit: define the buyer and disqualify weak-fit cases.
8. Pricing: keep tiers and exclusions explicit.
9. Final CTA: restate the upload/action path.
10. FAQ: answer scope, data, timing, and expectation objections.

## Copy Contract

The voice is plain-spoken diagnostic direct response:

- Lead with a situation the buyer recognizes.
- Use specific numbers, time windows, source data, and prices.
- Explain claims with "because" where the logic matters.
- Show the hidden mismatch before naming the fix.
- Name what the offer does not do.
- Avoid fake urgency, hype, and broad AI transformation language.

Headline formula:

```text
In [timeframe], we'll turn [existing messy/problem source] into [clear artifact/output] that helps [buyer avoid specific repeated pain].
```

## Implementation Contract

Historical note: the original `DiagnosticReportLandingPage` implementation was retired after the live support-ticket page moved to `DeflectionLandingPage` in `src/components/landing/DeflectionLandingPage.tsx`.

For the current support-ticket offer, the route owns the offer-specific copy and data in `landingConfig-v2.tsx`; `DeflectionLandingPage` owns the repeated layout, animation, pricing, FAQ, CTA, and section rhythm.

Use this document as a copy and structure pattern for future report-style offers. Add or extract a new shared template only when more than one live route needs the same structure.

## Naming Contract

"Gap Report" is a reusable wedge pattern, not the permanent customer-facing product brand. Name each report for the wedge the page sells:

- Support tickets to self-service deflection: Support Ticket Deflection Report.
- Sales calls or tickets to objections: Sales Objection Report.
- Product feedback to roadmap input: Feature Request Report.
- Local search inputs to pages: Local SEO Report.

The route owns the public report name. The shared template must stay brand-neutral.

## Visual Contract

The default page style is modern long-copy diagnostic, not a short generic SaaS page. Sections may be longer when each section advances a specific argument, proof point, or action path.

- Use warm off-white surfaces, dark contrast moments, red/orange friction states, and green resolved states.
- Keep proof dense and inspectable: report rows, source counts, customer wording, draft outputs, and explicit exclusions.
- Use visual artifacts to make the first 24-hour deliverable concrete before asking the buyer to trust the mechanism.
- Avoid decorative SaaS illustrations, vague AI diagrams, and visual claims the product cannot currently support.
