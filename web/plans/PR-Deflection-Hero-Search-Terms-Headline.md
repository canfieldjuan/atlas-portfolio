# Plan: Deflection hero search terms headline

## Why this slice exists

The support-ticket-deflection hero headline is directionally right but still
reads like a static statement. The new line is punchier and makes the reader's
current mistake obvious: they are guessing search terms even though customers
already provide that language in support tickets.

## Scope (this PR)

Slice phase: Product polish

1. Replace the support-ticket-deflection hero headline with the approved search
   terms line.
2. Leave the hero intro, body, CTA, page structure, pricing, FAQ, and intake
   behavior unchanged.

### Files touched

- `web/plans/PR-Deflection-Hero-Search-Terms-Headline.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — hero headline only.

## Mechanism

Update `landingPageConfigV2.hero.title` from "Your support tickets already
contain the keywords your help center is missing." to "Stop guessing search
terms. Customers are handing them to you in every support ticket."

## Intentional

Only the H1 changes. The existing intro still explains the mining mechanism, and
the existing body still explains the 24-hour deliverable.

The phrase "search terms" is used instead of "keywords" because it sounds closer
to the support lead's problem and matches the act of guessing what customers
type.

## Deferred

Hero intro/body tightening, mobile button fit, CTA strategy, pricing copy, FAQ
ordering, and intake page copy remain out of scope.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "Your support tickets already contain the keywords your help center is missing|Stop guessing search terms\\. Customers are handing them to you in every support ticket" web/src web/plans` — confirmed the old active headline is gone and the new headline appears in active source.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` on the existing local dev server — page loaded, framework error overlay check returned `OK`, the new H1 is present, the old H1 is absent, and `agent-browser errors` returned no page errors.
- Mobile browser check at 390px width — the new H1 renders in the first viewport with no horizontal overflow; `agent-browser errors` returned no page errors.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~61 |
| Landing config headline copy | ~2 |
| Total | ~63 |
