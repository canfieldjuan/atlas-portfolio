# Plan: Build slice 2 — wedge mechanism (6-stage → 3-step) + Picture straggler

Second slice of the wedge landing-copy build (B1/#78 placed the hero). This
collapses the how-it-works pipeline from 6 stages to **3 steps** (per D-029:
landing how-it-works = 3 steps, the granular rigor moves to Proof) and clears
the last cost-ranking straggler in the Picture (problem) section.

## Why this slice exists

- **D-029** sets the landing mechanism at **3 steps**; the live page still
  renders a 6-stage pipeline diagram (`Cluster by Intent` / `Rank by Volume`
  / `Extract Customer Wording` / `Draft` / `Review & Publish`). The hero
  (#78) already describes the flow as upload → we find & draft → you review &
  publish, so the diagram should match.
- The problem section still says "the **cost cutter** may already be sitting
  in your old tickets" (L707) — the same cost-ranking framing removed from
  the hero in #78. It's the last cost-ranking line in the Picture.

## Scope (this PR)

Slice phase: Product polish

1. **Mechanism 6 → 3** (`page.tsx` `pipelineStages` + `solution`): replace the
   6-stage array with 3 steps — **Upload your tickets** (CSV · 3–6 months · no
   integration) / **We find & draft the answers** (group repeat questions,
   rank by volume, draft step-by-step FAQs in customer wording) / **You review
   & publish** (your team edits and ships — nothing goes live without you).
   Update `processTitle`/`processDescription` to match the 3-step framing.
2. **Picture straggler** (`page.tsx` problem L707): "the cost cutter may
   already be sitting in your old tickets" → "the **answer** may already be
   sitting in your old tickets" (drops cost-ranking; keeps the setup for the
   next line).

### Files touched

- `web/plans/PR-Wedge-Build-2-Mechanism.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/page.tsx` — pipelineStages 6 → 3, processTitle/processDescription, problem L707 reword

## Mechanism

- `pipelineStages` becomes a 3-element array; the `Pipeline` component already
  renders `stages.length` columns via `--stage-count`, so 3 steps lay out with
  no component change. The 6-stage granular detail (cluster/rank/extract/draft)
  is folded into step 02's sub-label; the deeper "how" resurfaces in the Proof
  section (B3), per D-029's "rigor → proof."
- The solution prose (L719–731, the customer-language explanation) is on-voice
  and unchanged; only the process intro + the 3 steps change.
- L707 reword removes the "cost cutter" metaphor (volume-ranking only, no
  cost-ranking), consistent with #78's hero.

## Intentional

- **6 → 3 is a deliberate altitude drop (D-029),** not lost detail — the
  granular method moves to Proof (B3). Operator confirmed the exact 3 steps
  before this build.
- **`$20` framing not added to the Picture** — operator chose to keep the
  small→large block qualitative; `$20` stays a hero rhetorical device, not a
  body number that could read as a claimed stat.
- **Solution prose left as-is** — it's already in-voice; rewriting it would be
  scope creep beyond the mechanism + the straggler.

## Deferred

- The deliverables item **"Cost-Cutter Notes"** (L58) is the remaining
  cost-ranking string on the page — owned by **B3** (deliverables), tracked
  here so the post-B2 `grep "cost"` result is expected, not a miss.
- Proof section (comparison/sample + the wedge→calculator link) and the
  "rigor → proof" detail → **B3**.
- Pricing / who-it's-for (ICP → 15–75) / FAQ / risk-reversal → **B4**;
  `/partner` route → **B5**.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size).
- `npm run lint` / `tsc --noEmit` clean (3-stage array type-checks; no
  component change).
- **No stale value remains (per AGENTS.md §1a):** `grep -nE "Cluster by
  Intent|Rank by Volume|Extract Customer Wording|cost cutter" page.tsx` returns
  **only** L58 "Cost-Cutter Notes" (the deliverable, tracked for B3) — every
  old 6-stage label is gone and the Picture cost-cutter line is reworded.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `page.tsx` `pipelineStages` (6 → 3) | ~10 |
| `page.tsx` `processTitle`/`processDescription` | ~5 |
| `page.tsx` problem L707 reword | ~2 |
| this plan doc | ~95 |
| **Total** | ~112 |

Well under the 400-LOC soft cap.
