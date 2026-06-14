# PR-Resource-Internal-Links

## Why this slice exists

The four resource articles (`ai-automation-consultant-cost`,
`custom-ai-development-vs-saas`, `what-should-stay-human-reviewed`,
`how-to-scope-ai-automation-project`) are indexed and in the sitemap and
self-canonical correctly, but three of the four have **zero internal links
from any money page** -- they are reachable only via the `/resources` index. So
Google gets no signal that they matter, and buyers on the high-intent pages
never get funneled to the matching guide. Internal links from authoritative
pages are how existing content earns rank and conversions; this adds them.

## Scope (this PR)

Slice phase: Product polish

1. New `RelatedGuides` component: a server-compatible (no client hooks) section
   that renders contextual links to the relevant resource articles, matching
   the existing `/resources` card style.
2. Drop `<RelatedGuides>` near the bottom of the four money pages, each linking
   the articles that match its intent, so every article gains links from >= 2
   money pages:
   - `/services` -> cost, custom-vs-SaaS
   - `/ai-automation-consultant` -> cost, scoping (it already links scoping inline)
   - `/capabilities` -> custom-vs-SaaS, human-reviewed
   - `/process` -> scoping, human-reviewed

### Files touched
- `web/src/components/RelatedGuides.tsx`
- `web/src/app/services/page.tsx`
- `web/src/app/ai-automation-consultant/page.tsx`
- `web/src/app/capabilities/page.tsx`
- `web/src/app/process/page.tsx`
- `web/plans/PR-Resource-Internal-Links.md`

## Mechanism

`RelatedGuides` takes a list of slugs, resolves them through
`getResourceArticle`, and renders a link card per article (title, reading time,
description). It has no `'use client'` directive and no hooks, so it renders
inside both the client money pages (services, capabilities, process) and the
server page (ai-automation-consultant). Each page gets one import line plus one
`<RelatedGuides slugs={[...]} />` placed before the closing `</main>`. No
existing copy, layout, or metadata is changed.

## Intentional

- Homepage is intentionally **not** touched here -- it is mid-refactor in the
  open #305 (homepage server/client split); its "Guides" block lands after #305
  merges, to avoid a conflicting second edit of the same file.
- Pure additive internal links: no on-page copy rewrite, no product-surface
  change, no deflection-surface touch.
- Each orphaned article now has links from at least two money pages.

## Deferred

- Homepage "Guides" block (after #305 merges).
- Adding the literal "build vs buy" phrasing to the custom-vs-SaaS article
  title for that exact query (content tweak, separate slice).

## Parked hardening

None.

## Verification

- `npx tsc --noEmit` clean.
- `npx eslint` clean on the new component and all four pages.
- Each orphaned article (cost, custom-vs-SaaS, human-reviewed) goes from 0 to
  >= 2 money-page links; scoping goes from 1 to 3.
- Vercel preview build on the PR is the full-build gate.

## Estimated diff size

| Area | LOC |
|---|---:|
| `RelatedGuides` component | ~62 |
| 4 money-page inserts (import + section) | ~16 |
| Plan | ~72 |
| **Total** | **~150** |
