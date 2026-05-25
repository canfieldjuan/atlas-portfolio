# Plan: Build slice 1 — wedge hero (final landing copy)

First slice of the wedge landing-copy build. The full landing copy was
drafted and reviewed section-by-section in the copy thread, against the
canonical `decisions.md` (15–75 ICP, 3–6-month export window, no
deflection %, no cost-ranking, the cost/repeat-answering angle — the
Google/ranking headline is quarantined as a future offer, D-028). This
slice places the **hero** copy into the wedge page and nothing else.

## Why this slice exists

- The live hero leads with a cost-ranking claim ("show which ones cost
  the most support time", "An automated cost cutter…", "repeat-ticket
  cost") that contradicts the claims discipline (no cost-ranking — the
  report ranks by **volume**, not cost), and a stale "last 90 days"
  export window (canon is **3–6 months**, D-027).
- The drafted hero (locked headline A1 + mirrored subhead + body + CTA)
  fixes both and is the highest-visibility part of the page, so it goes
  first as a small, self-contained slice.

## Scope (this PR)

Slice phase: Slice

1. **Hero copy** (`page.tsx` hero config): replace `title`/`intro`/`body`
   with the locked hero; **drop the `kicker`** (the cost-cutter line);
   give the hero its **own inline `cta`** ("Upload your tickets — get a
   free Deflection Snapshot") rather than `sharedCta`, so this slice
   doesn't change the finalCta/footerCta button text (that's a later
   slice).
2. **Hero artifact window chip** (`page.tsx`
   `DeflectionReportHeroArtifact`): the stat chip `['90 days', 'ticket
   window']` → `['3–6 months', 'ticket window']`, so the artifact does
   not contradict the new body ("Upload 3–6 months…"). This chip is
   hero-local (hardcoded in the artifact), not `pipelineStages`.
3. **Optional kicker** (`DiagnosticReportLandingPage.tsx`): `kicker` is
   currently required and rendered unconditionally. Make it `kicker?:`
   and guard the render so a hero can omit it. Small template change in
   direct service of the hero's locked design (a hero shouldn't be forced
   to carry a kicker line).

### Files touched

- `web/plans/PR-Wedge-Build-1-Hero.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/page.tsx` — hero config
  (drop kicker, new title/intro/body, own cta) + artifact window chip
- `web/src/components/landing/DiagnosticReportLandingPage.tsx` — `kicker`
  → optional + guarded render

## Mechanism

- Hero `title` → headline A1; `intro` → the mirrored "step-by-step"
  subhead; `body` → the "it works because your tickets already hold the
  words customers use" paragraph (volume ranking, step-by-step FAQ, team
  reviews/publishes, no integration/platform/data-project). All
  claims-clean: ranks by **volume** (not cost), free first analysis, no
  auto-publish.
- Hero `cta` becomes an inline `{ label, href: GAP_REPORT_INTAKE_HREF }`;
  `sharedCta` is untouched and still feeds finalCta/footerCta.
- Template: `kicker?: string` + `{config.hero.kicker && (…)}` guard.

## Intentional

- **Hero gets its own CTA object** — deliberate. The locked hero button
  ("Upload your tickets — get a free Deflection Snapshot") differs from
  the locked Push button; keeping `sharedCta` for hero would force both
  to match. B3 swaps finalCta/footerCta when it lands.
- **Template touched (2 files, not 1)** — making `kicker` optional is
  required to achieve the hero's locked "no kicker" design; it's in
  service of this slice, not unrelated scope, and is a correct general
  improvement (kicker was over-constrained as required).
- **Only the hero changes.** Problem/solution/pricing/audience/faq copy,
  the 6→3-step mechanism, the risk-reversal block, and `/partner` are
  later slices — not in this PR.

## Deferred

Named so the reviewer knows these are intentional, not missed:

- After this merges, the hero is cost-claim-clean and reads "3–6 months",
  but the **body still carries cost-ranking** in two spots that are NOT
  in the hero: the problem section line "the cost cutter may already be
  sitting in your old tickets" and the deliverables item "Cost-Cutter
  Notes". Those are fixed in **B2** (problem) and **B3** (deliverables).
  One-PR-cycle inconsistency between hero and body, by design.
- `pipelineStages` chip "CSV • Last 90 days" (line 27) still says 90 days;
  that array is rewritten in **B2** (6-stage → 3-step mechanism, D-029).
- Other export-window instances (problem/solution/pricing/deliverables/
  finalCta) → their owning slices.

### Build decomposition (future slices — plan docs written at their turns, not now)

B2 problem(Picture) + solution(6→3-step mechanism); B3 proof + push +
deliverables/comparison alignment + wedge→calculator link; B4 pricing +
who-it's-for (ICP 770 → 15–75) + FAQ(+3) + the risk-reversal block (no
template slot yet — `audience` constraint / pre-FAQ / new slot is a B4
decision); B5 `/partner` route.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 3 == 3 + diff-size).
- `npm run lint` / type-check clean (the `kicker?` change + the guarded
  render must type-check; no other consumer sets a required kicker).
- Hero renders: headline A1, no kicker line, subhead + body, the new CTA,
  and the artifact chip reads "3–6 months".

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `page.tsx` hero config (title/intro/body/cta, drop kicker) | ~23 |
| `page.tsx` artifact window chip | ~2 |
| `DiagnosticReportLandingPage.tsx` (kicker optional + guard) | ~6 |
| this plan doc | ~108 |
| **Total** | ~139 |

Well under the 400-LOC soft cap.
