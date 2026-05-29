# Plan: Deflection offer headline

## Why this slice exists

The current "WHAT YOU GET" headline, "A ranked fix list for the repeat questions already costing you tickets.", is too abstract and confusing. The operator supplied a stronger replacement that is more direct, more urgent, and keeps the data-backed positioning intact.

## Scope (this PR)

Slice phase: Product polish

1. Replace the "WHAT YOU GET" headline with the operator-approved line.
2. Leave the surrounding offer copy, bullets, structure, pricing, FAQ, CTA, and intake flow unchanged.

### Files touched

- `web/plans/PR-Deflection-Offer-Headline.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — offer headline copy only.

## Mechanism

Update only `landingPageConfigV2.offer.title` in the support-ticket-deflection landing config. No component or layout code changes.

## Intentional

The replacement headline is used as supplied: "Data-Backed Fixes for Your Costliest Repeat Question". It is not softened or rewritten into a more generic report headline.

The singular "Question" is preserved because this slice follows the operator-approved copy exactly.

## Deferred

Any later pluralization, body-copy alignment, or broader offer-section rewrite remains out of scope unless the operator asks for it.

The parked `DEFLECTION-INTAKE-PII-1` hardening item was considered because it touches the same landing flow area, but this copy-only product-polish slice does not change intake behavior or privacy claims.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "A ranked fix list for the repeat questions already costing you tickets|Data-Backed Fixes for Your Costliest Repeat Question" web/src web/plans` — confirmed the new headline appears in `landingConfig-v2.tsx`; the rejected headline remains only in this plan's rationale.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` on the existing local dev server — desktop and 390px mobile views render the replacement headline cleanly; `agent-browser errors` returned no page errors.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~51 |
| Landing config copy | ~2 |
| Total | ~53 |
