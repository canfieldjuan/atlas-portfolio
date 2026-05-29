# PR-Content-Ops-Product-Gallery

## Why this slice exists

The `/systems/ai-content-ops` hub page currently reads like an explanatory
landing page — long hero prose, two informational cards, and a "what this engine
produces" explainer. It doesn't function as a product gallery. A visitor can't
scan and pick an offer; they have to read through paragraphs to understand what
exists. The goal of this slice is to redesign the page so the products dominate,
the hero is tight, and the layout feels like browsing a catalogue of AI content
products rather than reading a service description.

## Scope (this PR)

Slice phase: Product polish

Replace the body of `web/src/app/systems/ai-content-ops/page.tsx` with a
product-gallery layout:

1. Tight hero — category badge, one-liner headline, one-sentence sub, two CTAs.
2. Full-width product gallery grid with visually rich cards (category color
   accent, status badge, feature bullets, pricing signal, explore CTA arrow).
3. "Coming Soon" stub cards to fill the gallery and signal the roadmap.
4. A compact "How the engine works" strip replacing the current "Broader System"
   section — three steps, no separate glass card.
5. Retain the bottom audit CTA section (unchanged).

### Files touched

- `web/src/app/systems/ai-content-ops/page.tsx` — full rewrite of the page body

## Mechanism

- Data-only change: the `offers` array gains a `category`, `price`, and
  `accent` field used for per-card color and pricing signals.
- A `comingSoon` array drives stub cards rendered in the same grid with a
  "Coming Soon" overlay badge and muted styling.
- The hero drops from ~150 words of prose to ~30 words + two CTAs.
- The "Broader System" section is replaced by a horizontal three-step process
  strip that takes up one visual row instead of a full section.
- No layout, routing, metadata, or CSS files changed.

## Intentional

- Only `page.tsx` is modified. The layout, metadata, and all linked sub-pages
  (`ongoing-support`, `support-ticket-deflection`) are untouched.
- Coming Soon cards are non-interactive (no href) — they exist to show roadmap
  breadth, not to drive clicks.
- Pricing signals are approximate ranges, not fixed quotes, matching the
  pattern used on the ongoing-support sub-page.

## Deferred

- Adding real product imagery / illustrations per card — design asset work,
  separate slice.
- Filtering or tabbing the gallery by category — needs more products first.
- Adding a third live offer card when Customer-Language SEO ships.

Parked hardening: none

## Verification

```bash
npm --prefix web run build
npm --prefix web run lint
```

Visual check: `http://localhost:3000/systems/ai-content-ops` shows gallery grid
with product cards and coming-soon stubs.

Grep for stale hub copy strings:
```bash
grep -r "One content system" web/src
grep -r "The same engine produces" web/src
```
Both should return 0 results after the rewrite.

## Estimated diff size

| File | ~LOC |
|---|---|
| `web/src/app/systems/ai-content-ops/page.tsx` | ~160 |
| **Total** | ~160 |
