# Plan: Deflection offer body pinpoints

## Why this slice exists

The "WHAT YOU GET" headline now promises a list of data-backed fixes for expensive repeat questions, but the body still opens with a broader dashboard/benchmark contrast. The operator supplied a cleaner body that directly explains how the report pinpoints repeat questions and what the buyer sees for each one.

## Scope (this PR)

Slice phase: Product polish

1. Replace the offer-section intro with the operator-supplied pinpoint/ranking sentence.
2. Replace the current six deliverable bullets with a tighter four-item "for each question" list: customer wording, documentation gap, source tickets, and FAQ draft/no-proven-answer status.
3. Keep the existing best-fit paragraph and the rest of the landing page unchanged.

### Files touched

- `web/plans/PR-Deflection-Offer-Body-Pinpoints.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — offer-section body copy only.

## Mechanism

Update only `landingPageConfigV2.offer.content` in the support-ticket-deflection landing config. The existing `CopyBlock` and `SectionList` components remain in place; only the paragraphs and list items inside the offer section change.

## Intentional

The new list is shorter and more buyer-readable than the previous six-item inventory. It treats the report as a per-question artifact instead of a broad list of possible outputs.

The FAQ draft bullet keeps the operator's "ready-to-review" framing, but qualifies drafts to questions the tickets already solve. Questions without answer evidence are marked "no proven answer yet" instead.

The offer section keeps the deterministic/no-LLM qualifier co-located with the FAQ draft deliverable because that is where a skeptical buyer will ask whether the answers are AI-written.

No SEO ranking, churn reduction, or guaranteed ticket-deflection promise is introduced here.

## Deferred

Any later proof, risk-reversal, pricing, FAQ, CTA, or intake copy changes remain out of scope.

The parked `DEFLECTION-INTAKE-PII-1` hardening item was considered because it touches the same landing flow area, but this copy-only product-polish slice does not change intake behavior or privacy claims.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "You do not need another dashboard|The report counts the exact number of times|Here’s what you get|Ranked repeat questions|Customer-term-to-doc-term mismatches|Exact search terms|Source tickets and evidence|Review-ready FAQ drafts|No proven answer yet|The report pinpoints which repeat questions|For each question|100% deterministic|no LLM-generated answers" web/src web/plans` — confirmed the old active offer phrases are gone, the new body appears in `landingConfig-v2.tsx`, and the deterministic/no-LLM qualifier remains in the offer section.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` on the existing local dev server — desktop and 390px mobile views render the rewritten offer body cleanly; `agent-browser errors` returned no page errors.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~56 |
| Landing config copy | ~17 |
| Total | ~73 |
