# PR-Homepage-SEO-Snippet

## Why this slice exists

Google was building the homepage search snippet from the nav labels
("Architect / Services / Systems / Process / Capabilities") instead of money
copy, because `/` had no page-specific metadata -- it inherited the generic
site-wide `SITE_DESCRIPTION` (232 chars, well over Google's ~160 truncation).
Thirteen other indexable pages also carried over-160-char descriptions, so
their snippets were truncated mid-sentence. This gives the homepage and every
over-long page a tight, unique, in-limit description so the search snippet has
a real, page-specific target.

## Scope (this PR)

Slice phase: Product polish

1. **Homepage gets page-specific metadata.** Because `page.tsx` is a
   `'use client'` component (framer-motion), it cannot export `metadata`. It is
   split the standard App Router way: `page.tsx` becomes a thin server wrapper
   that exports the metadata and renders the existing UI, moved verbatim to
   `HomeClient.tsx` (only the function name changes, `Home` -> `HomeClient`).
2. **`SITE_DESCRIPTION` tightened** 232 -> 152 chars (the site-wide default /
   OG fallback).
3. **13 over-160-char page descriptions tightened** to <= 157, keyword-first
   and ASCII (removing Unicode em/en-dashes), with every product claim and
   price preserved.

### Files touched
- `web/src/app/page.tsx`
- `web/src/app/HomeClient.tsx`
- `web/src/app/ai-automation-consultant/layout.tsx`
- `web/src/lib/seo.ts`
- `web/src/app/about/layout.tsx`
- `web/src/app/architecture/layout.tsx`
- `web/src/app/capabilities/layout.tsx`
- `web/src/app/privacy/layout.tsx`
- `web/src/app/process/layout.tsx`
- `web/src/app/proof/layout.tsx`
- `web/src/app/security/layout.tsx`
- `web/src/app/services/layout.tsx`
- `web/src/app/systems/ai-content-ops/layout.tsx`
- `web/src/app/systems/ai-content-ops/ongoing-support/layout.tsx`
- `web/src/app/systems/atlas-llm-gateway/layout.tsx`
- `web/src/app/systems/layout.tsx`
- `web/plans/PR-Homepage-SEO-Snippet.md`

## Mechanism

The split is the standard Next.js pattern (server `page.tsx` for metadata +
client child for interactivity); the homepage body moves verbatim to
`HomeClient.tsx`. Descriptions are swapped in place through
`generatePageMetadata`'s `description` field; titles, keywords, canonical, OG,
and JSON-LD are unchanged. The homepage title "AI Automation Consultant & AI
Solutions Architect" (keyword-first) renders as "... | Juan Canfield" via the
existing root title template. The git move is recorded as a rewrite of
`page.tsx` plus an add of `HomeClient.tsx` (no rename detected, since `page.tsx`
keeps its path with new content), which is why the raw LOC count is large for a
behaviorally small change.

## Intentional

- The two `/systems/support-ticket-deflection*` descriptions are **deliberately
  left untouched** -- that is the protected deflection buyer-facing surface,
  which changes only by an explicit operator decision.
- Em-dashes removed from descriptions (ASCII / house style).
- Only meta descriptions change; no on-page copy, layout, or JSON-LD is touched.

## Deferred

- The 2 deflection-funnel meta descriptions (the report landing + demo, both
  over 160) -- pending explicit operator approval per the no-product-shape rule.
- Query-to-page mapping (the second SEO workstream): dedicated pages for buyer
  searches that lack one ("AI automation consultant cost", "build vs buy AI
  automation", "support ticket clustering", etc.).
- The root layout hardcodes `alternates.canonical: "/"`, so any indexable page
  that does not set its own metadata inherits canonical `/` -- a separate
  canonical-correctness follow-up.

## Parked hardening

None.

## Verification

- `npx tsc --noEmit` clean (the homepage split typechecks).
- `npx eslint src/app/page.tsx src/app/HomeClient.tsx src/lib/seo.ts` clean.
- Homepage, `SITE_DESCRIPTION`, and 13 page descriptions measured <= 157 chars
  (homepage 145, `SITE_DESCRIPTION` 152).
- Vercel preview build on the PR is the full-build gate (passing).

## Estimated diff size

| Area | LOC |
|---|---:|
| Homepage server/client split (`page.tsx` rewrite + `HomeClient.tsx` add) | ~830 |
| `seo.ts` + 13 `layout.tsx` description rewrites | ~28 |
| Plan | ~75 |
| **Total** | **~930** |

The behavioral change is ~30 LOC; the large raw total is the homepage body
recorded as add + delete because git did not detect the move as a rename.
