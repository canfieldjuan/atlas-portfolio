# Diagnostic Report Landing Page Template

Use this pattern for focused report-style offers that turn a buyer's existing messy data into a concrete artifact they can review and act on.

## Page Contract

1. Hero: product eyebrow, specific time-bound promise, one primary CTA.
2. Problem: name the operational pain the buyer already recognizes.
3. Solution: explain the mechanism before asking for belief.
4. Sample artifact: show a realistic version of what comes back.
5. Deliverables: list the report contents and the action each item unlocks.
6. Fit / not fit: define the buyer and disqualify weak-fit cases.
7. Pricing: keep tiers and exclusions explicit.
8. Final CTA: restate the upload/action path.
9. FAQ: answer scope, data, timing, and expectation objections.

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

Use `DiagnosticReportLandingPage` from `src/components/landing/DiagnosticReportLandingPage.tsx`.

The route owns the offer-specific copy and data. The template owns the repeated layout, animation, pricing, FAQ, CTA, and section rhythm. Keep the sample artifact as a custom React slot because it is the highest-trust part of each page.

Do not fork the template for small copy differences. Add typed config fields only when a future page has a real structural need.
