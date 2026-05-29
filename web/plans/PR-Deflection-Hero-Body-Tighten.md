# Plan: Deflection hero body tighten

## Why this slice exists

The support-ticket-deflection hero H1 and intro now clearly frame the product
around customer search terms inside tickets. The hero body still says "wording
gaps you're missing" and "ready-to-publish FAQ drafts," which is looser than the
current deterministic report promise. This slice tightens that body sentence so
the first viewport matches the report shape.

## Scope (this PR)

Slice phase: Product polish

1. Replace the hero body sentence with tighter copy about ranked repeats,
   missing customer wording, and review-ready drafts built from resolved
   replies.
2. Leave the H1, intro, CTA, page structure, pricing, FAQ, and intake behavior
   unchanged.

### Files touched

- `web/plans/PR-Deflection-Hero-Body-Tighten.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — hero body copy only.

## Mechanism

Update `landingPageConfigV2.hero.body` in the support-ticket-deflection v2
landing config. The string is rendered in the hero body by the shared landing
component, so no component or routing change is needed.

## Intentional

The new copy uses "review-ready" instead of "ready-to-publish" to avoid implying
that the output should bypass team review.

The new copy says drafts are built from resolved replies, matching the current
deterministic/no-LLM promise without adding a new guarantee.

## Deferred

Hero layout, mobile button fit, CTA strategy, pricing copy, FAQ ordering, and
intake page copy remain out of scope.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "Upload 3–6 months of support tickets\\. In 24 hours, get a ranked list|Upload 3–6 months of tickets\\. In 24 hours, get the repeat questions ranked|ready-to-publish FAQ drafts|review-ready FAQ drafts built from resolved replies" web/src web/plans` — confirmed the old active hero body is gone from source and the new body appears in active source; remaining old phrase mention is this plan's rationale.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` on the existing local dev server — page loaded, framework error overlay check returned `OK`, the new hero body is present, the old "ready-to-publish FAQ drafts" phrase is absent, and `agent-browser errors` returned no page errors.
- Mobile browser check at 390px width — hero H1, intro, body, and CTA render without horizontal overflow; `agent-browser errors` returned no page errors.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~63 |
| Landing config body copy | ~2 |
| Total | ~65 |
