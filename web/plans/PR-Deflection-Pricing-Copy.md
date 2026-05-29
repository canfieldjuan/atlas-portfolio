# Plan: Deflection pricing copy

## Why this slice exists

The pricing section still says "Start free. Pay when the queue proves the opportunity is real." That worked earlier, but the page now uses sharper language around repeat questions, customer wording, documentation gaps, source evidence, and review-ready drafts. This slice aligns the pricing headline and description with the updated promise without changing package structure.

## Scope (this PR)

Slice phase: Product polish

1. Replace the pricing heading with snapshot-first language.
2. Replace the pricing description with copy that explains when to upgrade and what the full report adds.
3. Leave pricing tiers, prices, exclusions, FAQ, CTA, intake, and surrounding sections unchanged.

### Files touched

- `web/plans/PR-Deflection-Pricing-Copy.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — pricing title and description only.

## Mechanism

Update only `landingPageConfigV2.pricing.title` and `landingPageConfigV2.pricing.description` in the support-ticket-deflection landing config. The pricing tier data, constraints, and component structure remain unchanged.

## Intentional

The new description uses "enough repeated questions to justify the full report" instead of implying the queue itself proves a purchase decision.

The list of full-report outputs mirrors the updated offer section: ranked questions, customer wording, documentation gaps, source evidence, and review-ready drafts.

No pricing, guarantee, privacy, storage, PII, or intake claim changes are introduced here.

## Deferred

Pricing tiers, tier bullets, CTA button label, FAQ, intake, and privacy/storage copy remain out of scope.

The parked `DEFLECTION-INTAKE-PII-1` hardening item was considered because pricing is close to the upload path, but this copy-only product-polish slice does not change intake behavior or privacy claims.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "Start free\\. Pay when the queue proves|old tickets are hiding deflectable work|Start with the snapshot|enough repeated questions to justify the full report|ranked questions, customer wording" web/src web/plans` — confirmed the old active pricing strings are gone; the old headline remains only in this plan's rationale.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` on the existing local dev server — desktop and 390px mobile views render the pricing heading and description cleanly; `agent-browser errors` returned no page errors.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~54 |
| Landing config copy | ~4 |
| Total | ~58 |
