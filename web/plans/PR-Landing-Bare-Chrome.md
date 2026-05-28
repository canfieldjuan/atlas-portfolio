# Plan: Strip the global menu + footer from the public wedge landing only

Operator wants the public Support Ticket Deflection landing to be a focused page:
no global menu, no footer — nothing leading off the page except the page's own
CTAs (the Upload/intake conversion) and the calculator link. Every other page on
the site must keep the normal chrome.

## Why this slice exists

- The menu and footer are off-ramps to the rest of the site; on a focused landing
  they leak attention away from the single conversion path. Removing them is the
  standard focused-landing pattern.

## Scope (this PR)

Slice phase: Product polish

The menu (`Navigation`) and footer (`Footer`) are rendered in the **root layout**,
so they apply to every route. A nested layout can only *add* to a parent layout,
not remove from it — so the removal is done by a pathname-gated client wrapper:

1. **New `components/SiteChrome.tsx`** (`'use client'`) — renders `Navigation` /
   `Footer` only when the current path is not in `BARE_ROUTES`. Exact-match on
   `/systems/support-ticket-deflection`, so sub-routes (`/intake`, `/calculator`,
   `/partner`, `/demo`, `/playbook`) and every other page keep their chrome.
2. **`app/layout.tsx`** — render `<SiteChrome>{children}</SiteChrome>` instead of
   `<Navigation /> {children} <Footer />`; drop the now-unused direct imports.
3. **`DeflectionLandingPage.tsx`** — new optional `bare` prop. The hero's `pt-32`
   exists only to clear the fixed menu bar; with the menu gone it would leave an
   ~8rem gap, so `bare` drops it to `pt-16`. Defaults `false`.
4. **public landing `page.tsx`** — passes `bare`. Partner page does not, so it
   keeps `pt-32` + its menu/footer (it is not a `BARE_ROUTE`).

Kept: the Upload/intake CTAs (hero, final CTA, pricing buttons → `/intake`) and the
calculator link — operator confirmed the conversion path stays.

### Files touched

- `web/plans/PR-Landing-Bare-Chrome.md` — this plan doc (new)
- `web/src/components/SiteChrome.tsx` — pathname-gated menu/footer wrapper (new)
- `web/src/app/layout.tsx` — use SiteChrome; drop direct Navigation/Footer imports
- `web/src/components/landing/DeflectionLandingPage.tsx` — `bare` prop adjusts top padding
- `web/src/app/systems/support-ticket-deflection/page.tsx` — pass `bare`

## Mechanism

- `usePathname()` resolves correctly during SSR for client components in the App
  Router, so the landing renders without chrome server-side too — no flash of a
  menu that then disappears. A client component may render server-rendered
  `children` passed as a prop; this is the supported pattern.
- The `bare` padding switch lives on the shared component but is opt-in per route,
  so the partner twin (which keeps its menu) is unaffected.

## Intentional

- **Exact-match `BARE_ROUTES`** (not prefix) — the operator said "without affecting
  the other pages," and the sub-routes are real pages that should keep chrome.
- **Did not touch** the partner page, intake, or calculator — out of scope.
- **Kept the in-content CTAs** — only the global menu/footer links are removed.

## Deferred

- Applying the bare treatment to the partner twin (operator scoped to the public
  landing; easy to add to `BARE_ROUTES` + pass `bare` later if wanted).

Parked hardening: none.

## Verification

- `tsc --noEmit` / `npm run lint` clean; `npm run build` green — all routes compile.
- On preview: landing has no menu/footer and no top gap; partner + every other page
  still show the menu/footer.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  5 == 5 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| SiteChrome (new) | ~22 |
| layout.tsx (swap) | ~4 |
| DeflectionLandingPage `bare` prop | ~6 |
| page.tsx | ~1 |
| this plan doc | ~80 |
| **Total** | ~113 |

Well under the 400-LOC soft cap.
