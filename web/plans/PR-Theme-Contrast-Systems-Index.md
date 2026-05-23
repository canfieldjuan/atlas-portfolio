# Plan: Theme contrast — fix invisible headings on /systems

First slice of the theme-contrast audit. The light-theme migration (#40) left
`text-white` headings on light surfaces across the site; on `/systems/page.tsx`
the product-card titles render white-on-near-white (invisible). Fix that page.

## Why this slice exists

- `.glass` is `background: var(--surface)` (≈ near-white). `systems/page.tsx`
  product-card and section headings use `text-white`, so they render invisible
  on the light theme — the same bug class as the intake form (#52), surfaced
  while building the Content Ops hub (#59).
- `/systems` is high-visibility (the index for every productized system, and the
  parent of the hub just shipped). It's the logical first fix of the audit.

## Scope (this PR)

1. Convert the 4 `text-white` headings in `web/src/app/systems/page.tsx` to
   `text-foreground` (all sit on light `glass` / `bg-surface` / `bg-primary/5`
   surfaces — verified there are no dark surfaces in this file).

### Files touched

- `web/plans/PR-Theme-Contrast-Systems-Index.md` — this plan doc (new)
- `web/src/app/systems/page.tsx` — `text-white` headings → `text-foreground`

## Mechanism

- Replace `text-white` → `text-foreground` (4 occurrences: the product-card `h2`,
  the implementation-model `h2`, the step `h3`, and the audit-CTA `h2`). All are
  on light surfaces, so `text-foreground` (dark) makes them legible.
- No structural/layout change; pure color-token fix.

## Intentional

- **Scoped to `systems/page.tsx`** — the confirmed, highest-visibility instance.
  Other pages with `text-white` need per-file surface analysis (some have
  legit `text-white` on intentionally-dark artifact panels), so they get their
  own audited slices rather than a blanket replace.
- **`text-foreground`, not a bespoke heading token** — matches how the page's
  `h1` and body already render on the light theme.

## Deferred

- Audit + fix the remaining pages with light-surface `text-white`
  (~195 occurrences across 44 files; a subset are bugs). Next theme-contrast
  slices, grouped logically (e.g. other `/systems` pages, then marketing pages),
  each verifying surfaces before converting.
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` + `build` pass.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape, files-touched,
  diff-size).
- Browser spot-check: `/systems` card titles and section headings are now legible.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `systems/page.tsx` (4 heading color swaps) | ~8 |
| this plan doc | ~70 |
| **Total** | ~78 |

Well under the 400-LOC soft cap.
