# Plan: Tighten the problem + solution copy, lead with benefits (overhaul copy pass)

The last of the operator's "copy isn't focused" work. The problem ("Picture")
and solution sections were long, repetitive prose. Cut ~half the prose, lead with
benefits, and reframe both titles off the cost framing — **keeping the strong
visual blocks** (the small→large grid, the language-mismatch examples, the 3-step
pipeline). Operator-approved copy.

## Why this slice exists

- The problem section ran ~10 paragraphs (much redundant) and its title led with
  "support-cost problem" (the cost framing the reviewer flagged + we removed
  elsewhere); the solution ran 7 paragraphs repeating the customer-language
  point. Tightening sharpens the page and finishes the copy-focus pass.

## Scope (this PR)

Slice phase: Product polish

`landingConfig.tsx`:
1. **Problem title** → "Repeat tickets aren't a missing-answer problem — they're
   a wording problem." (reframes off cost; sets up the term-map thesis).
2. **Problem prose** → 3 tight beats wrapping the two kept visual blocks
   (small→large grid, language-mismatch examples).
3. **Solution title** → "The fix is already in your tickets — you just can't see
   it yet." (benefit/clarity-led, ties to the hero's mess→clean).
4. **Solution prose** → one tight benefit-led block; the "Here's how it works —
   three steps" + 3-step pipeline stay.

### Files touched

- `web/plans/PR-Problem-Solution-Copy.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — problem + solution `title`/`content`

## Mechanism

- Targeted string swaps: the two titles + the prose paragraphs around the kept
  visual blocks (the blocks' JSX is untouched). Shared config → propagates to
  `/partner`.

## Intentional

- **Visual blocks kept** (small→large, language-mismatch, 3-step) — they're the
  effective part; only the slack prose is cut.
- **Titles reframed off the cost framing** — consistent with the swept
  cost-ranking + the new hero; findability/wording framing instead.
- **Findability stays a mechanism** ("not in the words your customers search for"
  / "written in the words customers actually search") — not a ranking promise
  (D-028). "Stop opening the ticket" is the directional mechanism, not a %.

## Deferred

- CFPB `DeflectionReportSample` rebuild — gated on the sample-source decision.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size).
- `npm run lint` / `tsc --noEmit` clean; `npm run build` succeeds; both sections
  render the tightened copy (+ the kept blocks) on the wedge + `/partner`.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| problem title + 3 prose beats (down from ~10 ¶) | ~40 |
| solution title + prose (down from 7 ¶) | ~18 |
| this plan doc | ~78 |
| **Total** | ~136 |

Well under the 400-LOC soft cap.
