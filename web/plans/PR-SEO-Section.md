# Plan: Give the SEO/search-visibility angle its own dedicated section

The prior passes (#110/#111) **wove** SEO to the top (hero + first content beat +
offer bullet) and left a payoff paragraph buried inside the mechanism. The operator
asked for what the weave was always meant to sit alongside: SEO as **its own
section** — a major benefit gets a major beat, not just threads. This adds that
section and stops the page from arguing SEO twice in a row.

## Why this slice exists

- "I only see SEO one time" → wove it (good), but a top-tier benefit still has no
  section of its own. The dedicated beat makes search-visibility unmissable and
  gives it room for the documented proof + the asset/compounding argument the
  woven mentions can't carry.

## Scope (this PR)

Slice phase: Product polish

1. **New `seoVisibility` section** — added as a fixed slot on the landing component
   (label / title / content), placed **right after `mechanism`**, on the accent
   (`section-band-blue`) band so it reads as a highlighted benefit, not another
   muted body section.
2. **Lifted the SEO argument out of `mechanism` P3 into the new section.** Mechanism
   P3 already ran the full SEO case ("phrases they type into Google," "how a page
   gets found," "visibility is yours to earn"). Keeping it *and* adding a section
   would argue SEO twice in adjacent sections, so the content moved up into the
   dedicated beat; mechanism now ends on the deliverable (P1 export + P2 ranked
   fix list).
3. **Moved the Gartner 74% findability stat** from the `problemAgitation` volume
   line into the SEO section as its documented proof — it's a findability stat, so
   it belongs to the findability argument, and this avoids citing it in two places.

Result: SEO now lands as **hero → first content beat → offer bullet → its own
section** (with sourced proof), instead of a weave plus a buried mechanism aside.

### Files touched

- `web/plans/PR-SEO-Section.md` — this plan doc (new)
- `web/src/components/landing/DeflectionLandingPage.tsx` — new `seoVisibility` config slot (type) + render block (accent band, after mechanism)
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — new section content; lift SEO out of mechanism P3; move 74% stat out of agitation

## Mechanism

- The landing component renders a fixed set of section keys; a brand-new section
  requires a new key on `DeflectionLandingPageConfig` + a render block (not config
  alone). The partner page spreads `landingPageConfigV2`, so it inherits the new
  required field with no change there.

## Intentional

- **Fact, not guarantee** (claims doctrine [[claims-doctrine-fact-not-guarantee]]):
  the section asserts only wording facts — "published in the same words customers
  search," "written in your internal product language, not the words customers
  search," "the visibility is yours to earn," "what gets found is the work you
  ship." Ranking/being-found stays the reader's inference. Avoided the
  guarantee-leaning "written to be found" shape (the cousin of the "becomes THE
  result" line Codex P2'd on #110).
- **Ogilvy** — documented proof is sourced (Gartner 74%); specific, no hype.
- **Kept the weave** (hero/first-beat/offer) — the section is *in addition to* it,
  per the operator ("not just its own section" = both).

## Deferred

- The deflection + cost fact-claim passes from the copy map (separate slices).

Parked hardening: none.

## Verification

- `tsc --noEmit` / `npm run lint` clean; `npm run build` green (both
  `/support-ticket-deflection` and `/partner` compiled — partner inherits the new
  required field via spread).
- SEO section renders after mechanism; mechanism no longer double-argues SEO; 74%
  cited once (in the SEO section).
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  3 == 3 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| component: type slot + render block | ~16 |
| config: new section | ~22 |
| config: mechanism P3 removed + agitation 74% trimmed | ~ -8 |
| this plan doc | ~90 |
| **Total** | ~120 |

Well under the 400-LOC soft cap.
