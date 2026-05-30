# Plan: Tighten deflection landing section spacing

## Why this slice exists

After the deflection landing page section backgrounds were made opaque, the
default section padding became too visible. Each transition now has a large
empty area above the break and another large empty area below it, so section
labels/headlines feel too far away from the transition they belong to.

## Scope (this PR)

Slice phase: Product polish

1. Tighten vertical padding for support-ticket-deflection landing sections only.
2. Keep the cleaner opaque section backgrounds from the previous slice.
3. Leave content, copy, order, CTAs, calculator behavior, demo behavior, pricing,
   FAQ behavior, and other pages unchanged.

### Files touched

- `web/plans/PR-Tighten-Deflection-Section-Spacing.md` — this plan doc.
- `web/src/app/globals.css` — scoped deflection landing section padding.

## Mechanism

The existing `.deflection-landing .section-band` scoped rules gain vertical
padding values. Mobile/default padding becomes `3rem` and desktop padding
becomes `4rem` inside the existing media query. This keeps headings inside the
new section color, but reduces the dead space on both sides of section breaks.

The global `.section-band` rhythm remains unchanged for other pages.

## Intentional

- No copy changes.
- No React component changes.
- No global section spacing change.
- The calculator's explicit compact padding remains controlled by its existing
  important utility classes.

## Deferred

- Any broader page-order or section-content changes.
- A sitewide section-spacing system for non-deflection pages.
- Parked hardening: none

## Verification

- `rg -n "deflection-landing \\.section-band|padding-top: 3rem|padding-top: 4rem|padding-bottom: 3rem|padding-bottom: 4rem" web/src/app/globals.css` — confirmed the scoped spacing rules.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed.
- Browser check of `/systems/support-ticket-deflection` on the worktree dev
  server — desktop sections report `64px` top/bottom padding, 390px mobile
  sections report `48px` top/bottom padding, with no framework overlay, no
  browser errors, and no horizontal overflow.
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~60 |
| Scoped spacing CSS | ~8 |
| Total | ~70 |

Well under the 400-LOC soft cap.
