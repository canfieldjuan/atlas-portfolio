# Plan: Theme-contrast pass (coherence detour)

A one-shot site-wide fix for the invisible-text bug surfaced during the Content
Ops hub work: `text-white` left on light surfaces by the light-theme migration
(#40) renders white-on-near-white. Convert every confirmed light-surface
`text-white` → `text-foreground` across all affected pages and components, so the
site is visually coherent. Then back to the Content Ops sequence.

## Why this slice exists

- `.glass` / `bg-surface` / page gradient are near-white, but `text-white`
  headings, nav links, demo panels, and emphasis spans sit on them across the
  site — invisible. Same bug class as the intake form (#52) and `/systems` (#60).
- The operator asked for one **coherence detour**: fix it on all pages now rather
  than opportunistically, so nothing ships visibly broken.
- Over the 400-LOC soft cap (~530): it's a mechanical, one-line-per-occurrence
  swap across many files — indivisible *as a coherence pass* (a partial pass
  leaves the site half-broken). Pure className change, no logic.

## Scope (this PR)

1. Convert `text-white` → `text-foreground` everywhere it sits on a light surface
   (every occurrence in the listed files — verified below).
2. Leave genuinely-dark contexts untouched: there are **none** — no
   `text-white` on a solid `bg-primary` (buttons use `text-black`) and none
   inside the Deflection page's dark `--artifact-*` panels (those use
   `--artifact-*` text tokens, not `text-white`). The hub's only `text-white` is
   an explanatory comment and is intentionally left.

### Files touched

- `web/plans/PR-Contrast-Pass-Coherence.md` — this plan doc (new)
- `web/src/app/page.tsx` — home page headings
- `web/src/app/about/page.tsx` — about headings
- `web/src/app/admin/intake/page.tsx` — admin intake viewer
- `web/src/app/ai-automation-consultant/page.tsx` — consultant page
- `web/src/app/architecture/page.tsx` — architecture page
- `web/src/app/audit/page.tsx` — audit intake page
- `web/src/app/capabilities/page.tsx` — capabilities page
- `web/src/app/demo/page.tsx` — demo index page
- `web/src/app/privacy/page.tsx` — privacy page
- `web/src/app/process/page.tsx` — process page
- `web/src/app/proof/page.tsx` — proof page
- `web/src/app/resources/page.tsx` — resources index
- `web/src/app/resources/[slug]/page.tsx` — resource article page
- `web/src/app/security/page.tsx` — security page
- `web/src/app/services/page.tsx` — services page
- `web/src/app/systems/ai-content-ops/ongoing-support/page.tsx` — ongoing optimization
- `web/src/app/systems/atlas-llm-gateway/page.tsx` — LLM gateway landing
- `web/src/app/systems/support-ticket-deflection/page.tsx` — deflection landing
- `web/src/components/ContentOpsDemo.tsx` — content-ops demo widget
- `web/src/components/CostObservabilityDemo.tsx` — cost demo widget
- `web/src/components/DocClassificationDemo.tsx` — doc-classification demo widget
- `web/src/components/Navigation.tsx` — site nav (inactive links were invisible)
- `web/src/components/landing/DiagnosticReportLandingPage.tsx` — shared landing template

## Mechanism

- Mechanical `sed s/text-white/text-foreground/g` across the verified files
  (`text-foreground` = `--foreground`, dark, legible on the light surfaces).
- Classification was verified before swapping: only `support-ticket-deflection`
  has dark surfaces, and its `text-white` are all outside the dark artifact (in
  light `glass`/`bg-surface` sections); no `text-white` on solid `bg-primary`
  anywhere; no `text-white` in comments/strings except the hub's (excluded).

## Intentional

- **One coherence pass, not opportunistic** — per the operator; over budget but
  indivisible as a pass.
- **Hub comment left as-is** — its `text-white` is prose, not a className.

## Deferred

- Resume the Content Ops sequence (nest the Deflection wedge + 301, retire the
  orphaned `/intake`, GLM demo page).
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` clean; `npm --prefix web run build` compiles all 36
  routes.
- `grep -rn text-white web/src` returns only the hub's comment.
- Browser spot-check: home, nav, /systems pages, deflection, demos — headings and
  nav links legible.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `text-white` → `text-foreground` swaps (23 files, ~212 each side) | ~424 |
| this plan doc | ~110 |
| **Total** | ~530 |

Over the 400-LOC soft cap — justified above as an indivisible site-wide coherence
pass (mechanical, pure className).
