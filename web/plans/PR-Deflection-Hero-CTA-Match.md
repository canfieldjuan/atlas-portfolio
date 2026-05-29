# Plan: Deflection hero CTA match

## Why this slice exists

The support-ticket-deflection hero CTA still says "Find my repeat-ticket gaps"
while the later primary CTAs say "Upload your tickets — get a free Deflection
Snapshot." The page should use one clear action language for the same intake
route instead of asking visitors to interpret two different CTAs.

## Scope (this PR)

Slice phase: Product polish

1. Change the hero CTA label to match the existing repeated page CTA.
2. Leave the CTA route, final CTA, footer CTA, pricing CTAs, intake behavior,
   and surrounding copy unchanged.

### Files touched

- `web/plans/PR-Deflection-Hero-CTA-Match.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — hero CTA label only.

## Mechanism

Update `landingPageConfigV2.hero.cta.label` from "Find my repeat-ticket gaps" to
"Upload your tickets — get a free Deflection Snapshot." The hero, final CTA, and
footer CTA already point at the same intake route, so the change is copy-only.

## Intentional

The longer CTA is kept because it names the concrete action and the free snapshot
offer. No button styling, route, section structure, or intake claim changes are
included.

## Deferred

Broader CTA strategy, pricing CTA labels, intake page copy, and hero headline or
body copy remain out of scope.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "Find my repeat-ticket gaps" web/src/app/systems/support-ticket-deflection web/src/components/landing` — returned no matches for the old active CTA label.
- `rg "Find my repeat-ticket gaps|Upload your tickets — get a free Deflection Snapshot" web/src web/plans` — confirmed the active source now uses the shared CTA label; old matches are historical plan/rationale only.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` on the existing local dev server — page loaded, framework error overlay check returned `OK`, the new CTA text is present, the old hero CTA text is absent, and `agent-browser errors` returned no page errors.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~57 |
| Landing config CTA copy | ~2 |
| Total | ~59 |
