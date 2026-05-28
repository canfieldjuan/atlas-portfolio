# Plan: Surface SEO/search-visibility explicitly + front-loaded (not one mid-page mention)

The prior weave (#110) made SEO *adjacent* at the top ("search queries," "words
they searched") but the explicit **SEO / Google / get-found** benefit only landed
mid-page (the mechanism paragraph + comparison grid). Operator: "I only see SEO
one time, in the same exact place." This makes it explicit and repeated, front-loaded.

## Why this slice exists

- A reader doesn't register "search queries" as the SEO benefit. The literal
  search-visibility promise needs to be unmistakable and appear early, not buried
  in the how-it-works section.

## Scope (this PR)

Slice phase: Product polish

`landingConfig-v2.tsx`:
1. **hero.intro** → names Google + the findability payoff: "We mine them for the
   exact words your customers type into Google… so the answer is finally written
   where search can find it."
2. **problemAgitation first beat** → leads with the search behavior: "Before a
   customer ever contacts you, they Google it… your help center just isn't written
   in the words they searched, so it never surfaces. Every ticket is a list of the
   exact search terms you're missing." (Keeps the sourced Gartner 73/14.)
3. **offer deliverable bullet (new)** → "The exact search terms your customers use
   — the keywords your help-center pages should target." (SEO now in the offer, not
   only the mechanism.)

Result: SEO/search-visibility now appears at **hero → first content beat →
deliverables → mechanism** — four explicit touchpoints, front-loaded.

### Files touched

- `web/plans/PR-SEO-Explicit.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — 3 copy edits

## Mechanism

- Copy-only, all in `landingConfig-v2.tsx`. No component change.

## Intentional

- **Fact, not guarantee** (claims doctrine [[claims-doctrine-fact-not-guarantee]]):
  "type into Google," "written where search can find it," "it never surfaces,"
  "search terms you're missing," "keywords your pages should target" are all facts
  about the wording/keywords. Ranking stays the reader's inference — no "you'll
  rank," no %.
- **Ogilvy** — the findability stat is sourced (Gartner 73/14); specific, no hype.

## Deferred

- The deflection + cost fact-claim passes from the map (separate slices).

Parked hardening: none.

## Verification

- `tsc --noEmit` / `npm run lint` clean; `npm run build` green.
- 4 explicit SEO/Google touchpoints confirmed (hero / first beat / offer / mechanism).
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  2 == 2 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| hero intro + first beat + offer bullet | ~10 |
| this plan doc | ~58 |
| **Total** | ~68 |

Well under the 400-LOC soft cap.
