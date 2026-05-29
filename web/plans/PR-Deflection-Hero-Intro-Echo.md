# Plan: Deflection hero intro echo

## Why this slice exists

PR #138 changed the hero headline to "Stop guessing search terms. Customers are
handing them to you in every support ticket." The unchanged intro directly below
it still starts with "Stop guessing," so the hero now repeats the same opening
phrase twice in its most prominent copy. This slice detunes the intro while
preserving the same offer.

## Scope (this PR)

Slice phase: Product polish

1. Replace the hero intro opener so it no longer repeats "Stop guessing."
2. Keep the approved H1, body, CTA, page structure, pricing, FAQ, and intake
   behavior unchanged.

### Files touched

- `web/plans/PR-Deflection-Hero-Intro-Echo.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — hero intro copy only.

## Mechanism

Update `landingPageConfigV2.hero.intro` to start with the mechanism instead of
repeating the H1's first words. The new intro still says the product mines
support tickets for customer language and turns that language into reviewable
FAQ drafts.

## Intentional

The H1 remains unchanged because the review called it doctrine-clean. The body
still carries the 3–6 month upload, 24-hour timing, ranked repeats, wording
gaps, and FAQ draft promise.

This slice also records `bash scripts/local_pr_review.sh` in the plan
Verification to avoid repeating the plan/body completeness nit from PR #138.

## Deferred

Hero body tightening, mobile button fit, CTA strategy, pricing copy, FAQ
ordering, and intake page copy remain out of scope.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "Stop guessing what customers search for|We mine your support tickets for the exact phrases customers use" web/src web/plans` — confirmed the old active intro is gone and the new intro appears in active source.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` on the existing local dev server — page loaded, framework error overlay check returned `OK`, the new intro is present, the old intro is absent, and `agent-browser errors` returned no page errors.
- Mobile browser check at 390px width — hero H1, intro, body, and CTA render without horizontal overflow; `agent-browser errors` returned no page errors.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~63 |
| Landing config intro copy | ~2 |
| Total | ~65 |
