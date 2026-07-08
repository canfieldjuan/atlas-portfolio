# PR-Support-Tax-Personalized-OG-Card

## Why this slice exists

Shared `/support-tax?v=&c=&r=&t=` links unfurl on Reddit/LinkedIn with the
*static* default card ("$108K/yr"), not the sharer's numbers — the parked
`SUPPORT-TAX-OG-PERSONALIZED-1`. Now that the share button ships (#500), the
unfurl mismatch is the last gap in the share loop: a pasted "$40k/mo" link
should preview with that figure. The root cause is that `og:image` for this
route is emitted by the `opengraph-image.tsx` file convention, which in this
Next version receives only route `params` (never `searchParams`) and outranks
any `generateMetadata`-supplied image — structurally query-blind and
un-overridable. Personalization therefore requires moving image generation to a
mechanism that can read the query and be pointed at by metadata.

## Scope (this PR)

Slice phase: Product polish

1. Replace the query-blind, overriding OG producer with a query-aware one and
   wire the page's metadata to it, so a shared link's `og:image`/`twitter:image`
   reflects the sharer's configured numbers; bare links keep today's default
   card.

### Files touched

- `web/src/app/systems/support-ticket-deflection/support-tax/share-card/route.tsx` — edge ImageResponse handler rendering the card from the share-state query (git tracks it as a rename of the deleted static `opengraph-image.tsx`, which it replaces).
- `web/src/app/systems/support-ticket-deflection/support-tax/page.tsx` — add `generateMetadata({ searchParams })` pointing the OG/Twitter image at the share-card URL.
- `web/src/app/systems/support-ticket-deflection/support-tax/layout.tsx` — drop the static `metadata` export (moved to the page); keep the breadcrumb JSON-LD.
- `web/src/lib/seo.ts` — add optional `ogImage` override to `generatePageMetadata` (default unchanged).
- `web/src/lib/support-tax-share-state.ts` — add `buildSupportTaxShareCardUrl` helper.
- `web/src/lib/support-tax-share-state.test.ts` — cases for the helper.
- `HARDENING.md` — mark `SUPPORT-TAX-OG-PERSONALIZED-1` resolved.
- `web/plans/PR-Support-Tax-Personalized-OG-Card.md` — document the slice.

## Mechanism

`share-card/route.tsx` is an edge `GET` handler that reads
`new URL(request.url).searchParams`, normalizes it through
`parseSupportTaxShareState` (clamp/default — safe on crafted input), computes
`annualTax` via `computeQuickSupportTax`, and returns a 1200x630
`ImageResponse`. It imports only `next/og` plus the two dependency-free,
edge-safe libs. Its visuals are the exact card the deleted `opengraph-image.tsx`
rendered; only the annual figure and the "At N tickets a month with P% repeats"
clause are dynamic, so with no params (calculator defaults: 1,500 / $15 / 40% /
12 min) it reproduces the $108,000 card byte-for-visual. A `route.tsx` cannot
share a segment with `page.tsx`, hence the `share-card` child segment.

`page.tsx` gains `generateMetadata({ searchParams })` (page-only; layouts do not
receive `searchParams`). It awaits `searchParams`, copies the calculator-owned
`v/c/r/t` keys into a `URLSearchParams`, derives a route-relative share-card URL
via `buildSupportTaxShareCardUrl` (which reuses the pinned parse/build pipeline,
so crafted params are clamped to a numeric canonical before entering the meta
tag), prefixes `SITE_URL`, and passes it to `generatePageMetadata` via the new
`ogImage` override. Because a page's `openGraph` replaces the layout's wholesale,
reusing `generatePageMetadata` keeps the full block (title/url/siteName/twitter)
intact while swapping only the image. The route metadata args move from the
layout's static `metadata` export into this `generateMetadata` so there is a
single source; the layout keeps only its breadcrumb JSON-LD.

`generatePageMetadata` gains an optional `ogImage?: string`, defaulting to the
existing `${SITE_URL}/opengraph-image`, so every other caller is byte-identical.

## Intentional

- Deleting the static `opengraph-image.tsx` is required: file-based metadata
  outranks `generateMetadata`, so it would otherwise win unconditionally and the
  personalized URL would never appear. Its default appearance is preserved by
  the route handler's no-param branch.
- `twitter:image` now personalizes too. There was no `twitter-image` file, so
  `/support-tax` previously showed the generic site card on X; routing through
  `generatePageMetadata` sets both — a deliberate improvement aligned with the
  goal.
- og:image `alt` becomes `SITE_NAME` (the deleted file's specific caption is not
  reproduced). Accepted minor consequence; the metadata API is not expanded for
  alt.
- The page becomes dynamically rendered (it reads `searchParams`). Acceptable —
  it already renders a `useSearchParams` client subtree under `<Suspense>`.
- The route handler and `generateMetadata` parse via the same helper, so the
  meta `og:image` URL and the rendered image always agree on the number. A
  scraper that strips the query degrades gracefully to the default card.

## Deferred

- Personalizing the leaky-bucket (`/calculator`) OG card is out of scope; that
  route has no share-state URL and keeps its static per-route card.

Parked hardening: none

## Verification

- `npm --prefix web run test:support-tax-share-state` — new
  `buildSupportTaxShareCardUrl` cases (bare path at defaults; canonical query;
  crafted `?v=<script>` clamped to numeric, no raw string in the URL).
- `npm --prefix web run test:support-tax-math` — the annual figure the card
  renders is unchanged/pinned.
- `npm --prefix web run test:deflection-public-reachability-smoke` — guarded
  surfaces (landing/intake copy, calculator CTA strings) untouched; this route's
  layout metadata is not in its pinned set.
- `npm --prefix web run lint` — clean.
- `npm --prefix web run check:dead-code` — knip baseline unchanged (the new
  route + `generateMetadata` are framework entry points; the new lib export is
  consumed by the page).
- `bash scripts/local_pr_review.sh` — full local gate; the Next build compiles
  the edge route and the dynamic metadata.
- Manual: `GET /systems/support-ticket-deflection/support-tax/share-card?v=3000&r=55`
  returns a personalized PNG; view-source of `/support-tax?v=3000&r=55` shows
  `og:image` and `twitter:image` pointing at that share-card URL; the bare
  `/support-tax` unfurls the unchanged $108K card.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `.../support-tax/share-card/route.tsx` (renamed from `opengraph-image.tsx`) | ~40 |
| `.../support-tax/page.tsx` | ~40 |
| `.../support-tax/layout.tsx` | ~13 |
| `web/src/lib/seo.ts` | ~4 |
| `web/src/lib/support-tax-share-state.ts` | ~12 |
| `web/src/lib/support-tax-share-state.test.ts` | ~22 |
| `HARDENING.md` | ~2 |
| `web/plans/PR-Support-Tax-Personalized-OG-Card.md` | ~125 |
| Total | ~260 |
