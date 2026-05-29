# Plan: Deflection offer copy

## Why this slice exists

The support-ticket-deflection landing page has a sharper hero, broken-loop, and cost story, but the "WHAT YOU GET" section still reads more like a general report description than a concrete buying artifact. This slice tightens that section around the ranked fix list the buyer receives, while preserving the deterministic/no-LLM constraint for FAQ answer drafts.

## Scope (this PR)

Slice phase: Product polish

1. Rewrite the "WHAT YOU GET" title around a ranked fix list for repeat questions.
2. Replace the intro with two short paragraphs that separate the buyer's need from the report's counting proof.
3. Reframe the deliverables as named artifacts: ranked questions, language mismatches, search terms, evidence, review-ready FAQ drafts, and no-proven-answer gaps.
4. Preserve the claim that FAQ answer output is 100% deterministic and does not use LLM-generated answers.
5. Leave the section structure, pricing, proof, FAQ, CTA, and intake flow unchanged.

### Files touched

- `web/plans/PR-Deflection-Offer-Copy.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — offer-section copy only.

## Mechanism

The change updates only `landingPageConfigV2.offer` in the support-ticket-deflection landing config. The existing `CopyBlock` and `SectionList` structure remains in place; the copy changes the title, adds one clarifying paragraph, adds a short "Here's what you get" lead-in, and converts the deliverable bullets to label-first phrasing using the section's existing text styling patterns.

## Intentional

The FAQ draft bullet says "review-ready" instead of "publishable" because this product still keeps human review in the loop.

The no-LLM claim is scoped to the FAQ answer output in this section; broader page claims about automation and drafting are left untouched.

No SEO ranking, churn reduction, or guaranteed ticket-deflection promise is introduced here. Those remain possible outcomes, not guaranteed deliverables.

## Deferred

Risk-reversal, final CTA, proof, pricing, and FAQ copy remain follow-up copy slices.

The optional intake-form question field remains out of scope.

The parked `DEFLECTION-INTAKE-PII-1` hardening item was considered because it touches the same landing flow area, but this copy-only product-polish slice does not change intake behavior or privacy claims.

The stale-copy grep found two expected remaining references outside this active v2 section: `web/plans/PR-SEO-Explicit.md` is historical plan documentation, and `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` is the older landing config variant. This slice intentionally updates only `landingConfig-v2.tsx`.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "A report your team can act on this week|You do not have to guess how much of your queue is repeat work|A ranked list of the repeat questions your customers keep asking|The exact search terms your customers use|A drafted, publishable answer|A flagged" web/src web/plans` — only expected remaining references in `web/plans/PR-SEO-Explicit.md` and the older `web/src/app/systems/support-ticket-deflection/landingConfig.tsx`, both named in Deferred.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` on the existing local dev server — desktop and 390px mobile views render the rewritten "WHAT YOU GET" section cleanly; `agent-browser errors` returned no page errors.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~60 |
| Landing config copy | ~20 |
| Total | ~80 |
