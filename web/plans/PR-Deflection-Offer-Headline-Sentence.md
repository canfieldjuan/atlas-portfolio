# Plan: Deflection offer headline sentence

## Why this slice exists

The current "WHAT YOU GET" headline, "Data-Backed Fixes for Your Costliest Repeat Question", is punchier than the previous version but still reads like a title fragment. The operator supplied a clearer sentence that directly names what the buyer gets.

## Scope (this PR)

Slice phase: Product polish

1. Replace the "WHAT YOU GET" headline with the operator-supplied sentence.
2. Leave the surrounding offer copy, bullets, layout, pricing, FAQ, CTA, and intake flow unchanged.

### Files touched

- `web/plans/PR-Deflection-Offer-Headline-Sentence.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — offer headline copy only.

## Mechanism

Update only `landingPageConfigV2.offer.title` in the support-ticket-deflection landing config. No component or layout code changes.

## Intentional

The replacement headline is used as a complete sentence: "You get a list of data-backed fixes for your most expensive repeat questions."

The line keeps the buyer-facing promise concrete without adding an SEO ranking, churn reduction, or ticket-deflection guarantee.

## Deferred

Any broader body-copy alignment or offer-section rewrite remains out of scope unless the operator asks for it.

The parked `DEFLECTION-INTAKE-PII-1` hardening item was considered because it touches the same landing flow area, but this copy-only product-polish slice does not change intake behavior or privacy claims.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "Data-Backed Fixes for Your Costliest Repeat Question|You get a list of data-backed fixes for your most expensive repeat questions" web/src web/plans` — confirmed the new headline appears in `landingConfig-v2.tsx`; the prior headline remains only in plan-history rationale.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` on the existing local dev server — desktop and 390px mobile views render the sentence headline cleanly; `agent-browser errors` returned no page errors.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~51 |
| Landing config copy | ~2 |
| Total | ~53 |
