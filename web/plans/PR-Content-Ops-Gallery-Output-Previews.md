# PR-Content-Ops-Gallery-Output-Previews

## Why this slice exists

The Content Ops hub now works as a product gallery, but the live offer cards
still rely mostly on descriptions and bullet lists. The page should let a
visitor quickly see what each offer turns into. Adding compact output-preview
panels makes the product cards more concrete without changing routes,
sub-pages, or the offer copy.

## Scope (this PR)

Slice phase: Product polish

Add lightweight output previews to the live offer cards on
`web/src/app/systems/ai-content-ops/page.tsx`:

1. Extend each live offer with a small preview label and three preview rows.
2. Render the preview between the summary and the feature bullets.
3. Keep the cards data-driven and scoped to the hub page only.

### Files touched

- `web/src/app/systems/ai-content-ops/page.tsx` — live card preview data and rendering
- `web/plans/PR-Content-Ops-Gallery-Output-Previews.md` — this plan doc

## Mechanism

- The `Offer` type gains a `previewLabel` and `previewRows` field.
- Each live offer supplies three short rows that resemble the kind of output a
  buyer gets back: ranked customer questions for the ticket report, and monthly
  operating items for ongoing optimization.
- The card renderer adds a bordered preview panel before the existing checklist.
  This keeps the existing CTA, price, and route behavior untouched.

## Intentional

- This is not adding a mock screenshot or generated image. It is an in-card
  preview of the product output, which is the fastest way to make the gallery
  easier to scan while staying in the existing design system.
- Coming-soon cards stay muted and non-interactive. This slice only improves
  products that are available now.
- The preview rows are illustrative product-shape examples, not claims that a
  specific customer will get those exact issues or results.

## Deferred

- Real product imagery or screenshots per card — design asset work, separate
  slice.
- Gallery filtering/tabbing by category — needs more live products first.
- Third live card when Customer-Language SEO ships.

Parked hardening: none

## Verification

```bash
npm --prefix web run lint
npm --prefix web run build
bash scripts/local_pr_review.sh
```

Visual check: `/systems/ai-content-ops` shows each live product card with a
compact output-preview panel above the existing checklist.

Grep for stale/new recurring strings:
```bash
grep -r "Output preview" web/src/app/systems/ai-content-ops
```
Expected: only the live card renderer in `page.tsx`.

## Estimated diff size

| File | ~LOC |
|---|---|
| `web/src/app/systems/ai-content-ops/page.tsx` | ~35 |
| `web/plans/PR-Content-Ops-Gallery-Output-Previews.md` | ~78 |
| **Total** | ~113 |
