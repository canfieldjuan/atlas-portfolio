# Plan: Rework the hero promise + weave SEO to the top (Ogilvy, fact-claim rule)

Two operator-directed copy changes to the rewritten wedge landing, shipped
together so they preview as one piece:
1. A hero headline that makes an explicit, ticket-specific **promise**.
2. **Weave SEO/findability to the top** as a major benefit (it was a dangling
   mid-page aside), with documented proof, Ogilvy-style.

Both follow the claims doctrine the operator set: **promise the fact, let the
buyer infer the outcome** — state the strongest *provable* fact (sourced) where we
can't guarantee an outcome (a ranking, a deflection %), and let the reader close
the loop. Bolder than hedging, and survives "could they say you lied?".

## Why this slice exists

- The old hero ("Stop answering the same questions") was vague — didn't name the
  asset (tickets) or the differentiator (the words customers search).
- SEO was the weakest thread: referenced in `mechanism` as "the SEO angle" as if
  it had been introduced earlier (a dangling callback), and never surfaced as a
  benefit. SEO is what turns "fewer repeats" into deflection at the search box, so
  it belongs near the top with sourced proof.

## Scope (this PR)

Slice phase: Product polish

`landingConfig-v2.tsx`:
1. **hero.title** → "Your repeat support tickets are search queries your help
   center can't answer." (reframe hook; explicit about tickets + search).
2. **hero.intro** → "We surface them in your customers' own words — and draft the
   FAQs you publish." (mechanism / promise).
3. **hero.body** → the existing upload-3–6mo / 24h / ranked / drafted specifics
   (moved down); dropped the now-redundant "answers already in your queue" body.
4. **problemAgitation re-led with the SEO/findability fact** (now the first thing
   read after the hero): "73% try self-service, only 14% succeed (Gartner) — the
   answer exists, just not in the words they searched; every ticket records those
   words." The cost line follows ("that wording gap is expensive: $1.84 vs $13.50").
5. **Customer churn fact** kept as the section closer (CEB 94%/4%); the duplicated
   73%/14% was promoted up to the findability lead (no double-citation).
6. **mechanism dangling reference fixed** → the validated-keyword payoff: "that fix
   list is also your SEO list… publish in that language and the page becomes the
   result… visibility is yours to earn; the keywords are validated by your queue."

### Files touched

- `web/plans/PR-Hero-Promise.md` — this plan doc
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — hero copy + SEO weave + fact-claim edits

## Mechanism

- Copy-only, all in `landingConfig-v2.tsx`. The component's section `content` slots
  are flexible `ReactNode`, so SEO is *woven* through hero → agitation lead →
  mechanism payoff (+ the existing proof citations) rather than bolted on as a
  standalone section — which is what "not just its own section" called for. No
  component change.

## Intentional

- **Fact, not guarantee** (claims doctrine): SEO lands as "validated search
  keywords, proven by your own volume" + the sourced findability gap (Gartner
  73/14); ranking stays the reader's inference. No deflection %, no ranking
  guarantee. Reverses D-028's SEO quarantine (operator's call).
- **Ogilvy** — every claim is specific + sourced (Gartner, CEB), no hype words.
- **Kept the rest prose/structure** from #109's pass; this only adds the SEO thread
  + the hero promise.

## Deferred

- Further section-by-section fact-claim passes as the operator works down the page.
- Recording the claims doctrine in the repo decisions doc (currently in memory).

Parked hardening: none.

## Verification

- `tsc --noEmit` / `npm run lint` clean; `npm run build` green; no dangling "SEO
  angle" reference remains; 73/14 not double-cited within a section.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  2 == 2 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| hero copy (title/intro/body) | ~8 |
| SEO/findability lead + churn rework (agitation) | ~22 |
| mechanism SEO payoff | ~6 |
| this plan doc | ~78 |
| **Total** | ~114 |

Well under the 400-LOC soft cap.
