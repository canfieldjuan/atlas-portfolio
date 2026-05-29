# Plan: Deflection final CTA copy

## Why this slice exists

The final CTA still says "See what your tickets are telling you", which is softer than the sharpened offer and risk-reversal sections above it. The operator supplied a more urgent close that names the gaps fueling ticket volume, the 24-hour CSV workflow, and the either-way proof value of the snapshot.

## Scope (this PR)

Slice phase: Product polish

1. Replace the final CTA title with the operator-supplied gap/ticket-volume framing.
2. Replace the two CTA body paragraphs with the operator-supplied urgency and proof-value copy.
3. Preserve the existing CTA button, privacy line, pricing, FAQ, intake flow, and surrounding sections.

### Files touched

- `web/plans/PR-Deflection-Final-CTA-Copy.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — final CTA copy only.

## Mechanism

Update only `landingPageConfigV2.finalCta.title` and `landingPageConfigV2.finalCta.body` in the support-ticket-deflection landing config. No component, route, button, privacy, pricing, FAQ, or intake behavior changes.

## Intentional

The body uses urgency around repeated support work, but it stops short of guaranteeing a deflection percentage, ranking outcome, churn reduction, or queue reduction.

The review follow-up softens "to reduce your queue" to "to start clearing the repeats" so the CTA stays purpose-oriented without promising an operational result.

The copy says "publishable drafts" because the page already frames the workflow as review-first and the pricing exclusions keep "No auto-publishing" explicit.

No new privacy, security, deletion, or PII-handling claim is introduced.

## Deferred

CTA button label, privacy line, pricing, FAQ, intake, and storage/privacy hardening remain out of scope.

The parked `DEFLECTION-INTAKE-PII-1` hardening item was considered because this section sits next to the upload CTA, but this copy-only product-polish slice does not change intake behavior or privacy claims.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "See what your tickets are telling you|Upload your CSV\\. Get the repeat questions|If the pattern is not there|to reduce your queue|Find the gaps fueling your ticket volume|Every day you wait|If the repetition is not there|to start clearing the repeats" web/src web/plans` — confirmed the old active CTA strings are gone from page code; the old title and review-flagged phrase remain only in this plan's rationale/review note.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` on the existing local dev server — desktop and 390px mobile views render the final CTA cleanly; `agent-browser errors` returned no page errors.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~56 |
| Landing config copy | ~6 |
| Total | ~62 |
