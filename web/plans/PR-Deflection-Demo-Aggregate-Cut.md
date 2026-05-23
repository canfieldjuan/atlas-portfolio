# Plan: Deflection demo — cut the fabricated-economics aggregate sections (slice 3b)

Slice 3a moved the per-search panel onto real signals. Two aggregate sections
below it still run on fabricated economics: `DeflectionMath` ("$ saved / mo",
summed from the assumed `costPerTicket` × `deflectionShare`) and `CostTicker`
(invented industry figures — `~$12–16/ticket`, `~$22/hr`). Both contradict the
"lean into real signals" direction, and `DeflectionMath` re-derives — at lower
resolution — what the per-search panel already shows per issue. This slice
removes both and folds the one piece worth keeping (dataset provenance) into a
one-line caption.

## Why this slice exists

- The transient inconsistency 3a flagged (panel shows real signals, the math
  section still shows `$/mo`) closes here.
- `DeflectionMath` is redundant with the per-search `SignalsPanel`; a second
  aggregate panel adds fabricated numbers without adding information.
- `CostTicker`'s value was never the invented economics — it was answering "what
  am I searching?" before the search. That belongs in a caption, not a 60-LOC
  fabricated-cost strip.

## Scope (this PR)

1. Delete `DeflectionMath.tsx` and `CostTicker.tsx`.
2. In the demo page: drop both imports + renders, fix the now-stale intro copy
   (it still describes the two-doc "jargon-y article beside the answer" framing
   that 3a removed), and add a concise dataset provenance caption near the intro
   (honest about the data being illustrative today; the real source lands in 3c).

### Files touched

- `web/plans/PR-Deflection-Demo-Aggregate-Cut.md` — this plan doc (new)
- `web/src/components/deflection-demo/DeflectionMath.tsx` — delete (fabricated savings section)
- `web/src/components/deflection-demo/CostTicker.tsx` — delete (fabricated economics strip)
- `web/src/app/systems/support-ticket-deflection/demo/page.tsx` — drop both sections, add provenance caption

## Mechanism

- **Both files deleted** (appear as `D` in the diff; the files-touched audit reads
  unfiltered `git diff --name-only`, so deletions are claimed like any path).
- **Page composition** goes from `intro → CostTicker → demo → space-y-16[Math,
  HowItWorks, CTA]` to `intro(+ provenance caption) → demo → space-y-16[
  HowItWorks, CTA]`. The `space-y-16` container keeps consistent spacing with two
  children; no cavernous gap.
- **Provenance caption** is a single muted line under the intro: the demo searches
  an illustrative sample of repeat-question clusters; the real Report ranks the
  customer's own ticket export. It states "illustrative" plainly — the real
  CFPB-dataset provenance copy lands when Atlas is wired (3c).
- **Intro copy fix:** the intro `<p>` still narrates the cut two-doc comparison
  ("the jargon-y article … beside the actionable answer … the gap"). It's
  rewritten to the real-signals framing (the Report answer + the demand behind
  it), matching what `DeflectionDemo` now renders.

## Intentional

- **Cut, not rework** — reworking either section to "real aggregate signals" would
  re-present, at lower resolution, what the per-search panel already shows. The
  honest "lean into real signals" move is to remove the fabricated sections, not
  to re-skin them. (Confirm or correct here — if you want an aggregate
  real-signals section, that's a follow-up, not a re-skin of the savings math.)
- **`how-it-works` stays** — it's a process explainer, not data-driven, so the
  real-signals direction doesn't touch it.
- **Lib cleanup deferred to 3b-cleanup** — deleting `DeflectionMath` leaves
  `estimateDeflectionTotals` / `estimateSavings` / `DeflectionSavings` /
  `DeflectionTotals` exported-but-unused (lint doesn't flag unused *exports*, so
  this compiles clean). They're removed alongside the deprecated
  `traditional` / `ticketsPerMonth` / `costPerTicket` / `deflectionShare` fields
  in the next slice, which also updates `route.ts`'s `mapAtlasMatch` validation —
  keeping this slice a focused UI removal and that one a focused data cleanup.

## Deferred

- **3b-cleanup:** drop the deprecated `DeflectionIssue` fields
  (`traditional`, `ticketsPerMonth`, `costPerTicket`, `deflectionShare`), make the
  signal fields required, remove the now-dead savings helpers/types, trim
  `DEMO_ISSUES`, and update `route.ts`'s `mapAtlasMatch` validation to the new
  required fields (minimal — full gate close is 3c).
- **3c:** `mapAtlasMatch` → Atlas `{ query, results:[…], count }` envelope; close
  the 4-item go-live gate (`PATTERNS.md`); set the env. Also fold in the 3a NIT —
  `SignalsPanel`'s metrics row is `grid-cols-2` even with one metric (empty
  half-cell), which only matters once Atlas can supply partial issues.
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` clean; `npm --prefix web run build` compiles — the
  demo page prerenders without the two sections.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  4 == 4 + diff-size).
- Browser spot-check: demo page reads intro (+ provenance caption) → search →
  how-it-works → CTA; no cost strip, no savings/math section.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| delete `DeflectionMath.tsx` | ~74 |
| delete `CostTicker.tsx` | ~36 |
| `demo/page.tsx` (drop 2 sections, fix intro copy, add caption) | ~28 |
| this plan doc | ~100 |
| **Total** | ~238 |

Under the 400-LOC soft cap.
