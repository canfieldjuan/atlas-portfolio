# Plan: Deflection FAQ copy

## Why this slice exists

The FAQ answers still carry older page language: broad promises, longer phrasing,
and a few lines that undersell the current report shape. The landing page now
promises a deterministic ticket-history report with ranked repeat questions,
customer wording, documentation gaps, source evidence, review-ready drafts, and
no-proven-answer flags. This slice aligns the FAQ answers with that promise.

## Scope (this PR)

Slice phase: Product polish

1. Tighten the support-ticket-deflection FAQ answers around the current report
   promise.
2. Keep the FAQ questions stable for continuity in the page accordion and
   JSON-LD.
3. Leave pricing tiers, section structure, intake behavior, privacy/storage
   behavior, and CTA routing unchanged.

### Files touched

- `web/plans/PR-Deflection-FAQ-Copy.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — FAQ answer copy only.

## Mechanism

Update the `pricingFaqs` answer strings in the shared support-ticket-deflection
landing config. The v2 landing page imports the same FAQ array for the on-page
accordion and for `generateFaqJsonLd`, so changing this one array updates both
surfaces without adding a second source of truth.

## Intentional

The FAQ questions remain unchanged. This avoids turning a copy pass into a search
metadata and accordion-structure change.

The private-data answer preserves the existing self-strip recommendation,
30-day deletion claim, deterministic analysis claim, and no-training/no-sharing
language. It does not add a new storage, redaction, or security promise.

The repeat-ticket answer avoids a guaranteed percentage. It explains the
mechanism: rank repeat questions, capture customer wording, draft from existing
resolved replies, and let the customer publish reviewed answers.

## Deferred

FAQ section title/description, FAQ ordering, accordion behavior, pricing tiers,
CTA labels, intake behavior, and privacy/storage implementation remain out of
scope.

The parked `DEFLECTION-INTAKE-PII-1` hardening item was considered because one
FAQ answer mentions private customer data. This slice preserves the current copy
claims and does not change intake storage behavior.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "old tickets are worth turning|complete working list|Messy is fine|Plan on light editing|so fewer repeat questions reach|A knowledge base that is not working usually is not broken|fix the answers and the bot improves too" web/src web/plans` — returned no matches for the stale active FAQ phrases.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` on the existing local dev server — desktop FAQ accordion renders; rewritten FAQ answer text is present in the page; framework error overlay check returned `OK`.
- Mobile browser check at 390px width — FAQ section renders without horizontal overflow; `agent-browser errors` returned no page errors.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~74 |
| Landing config FAQ copy | ~30 |
| Total | ~104 |
