# PR-Deflection-Snapshot-Hero-Supporting-Copy-Proportions

## Why this slice exists

The desktop hero headline now has the larger visual weight the user wanted, but
the supporting paragraph still uses the older, smaller proportions. That makes
the left hero drop from a large product-style promise to comparatively modest
body copy. This slice scales the supporting copy to better match the enlarged
desktop hero without changing any wording or the intake form.

## Scope (this PR)

Slice phase: Product polish

1. Increase the hero supporting paragraph width and type size at large desktop
   viewports.
2. Preserve the current mobile paragraph size and wrapping.
3. Preserve all visible copy, form behavior, upload flow, smoke markers, and
   security/data claims.

### Files touched

- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - hero supporting-copy proportions only.
- `web/plans/PR-Deflection-Snapshot-Hero-Supporting-Copy-Proportions.md` - plan contract for this slice.

## Mechanism

The hero paragraph keeps the same text and base/mobile styling, then adds a
wider large-desktop max width and a modest `lg:` type-size/line-height increase.
The headline, grid, intake form, and trust panel are untouched.

## Intentional

- No copy changes.
- No form, upload, validation, PII/security, or data-handling changes.
- This is a proportion pass only; it does not add left-side CTA buttons or alter
  the intake model.

## Deferred

PII/backend scrubbing, storage claims, copy changes, left-side CTA additions,
and any dropzone-first intake redesign remain deferred to their dedicated lanes.

Parked hardening: none.

## Verification

- `npm --prefix web ci` - passed; npm reported 6 existing audit
  vulnerabilities.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- Browser check at `http://127.0.0.1:3133/systems/support-ticket-deflection/snapshot`
  with Turbopack dev server:
  - Desktop 1440x1100 screenshot:
    `/tmp/deflection-snapshot-hero-copy-proportions-desktop.png`; no
    horizontal overflow (`scrollWidth: 1425`, `innerWidth: 1440`), paragraph
    font `20px`, line height `32.5px`, width `694`, and next section top `944`.
  - Mobile 390x844 screenshot:
    `/tmp/deflection-snapshot-hero-copy-proportions-mobile.png`; no horizontal
    overflow (`scrollWidth: 375`, `innerWidth: 390`), paragraph font remains
    `18px`, width `327`, form top `430`, and next section top `1562`.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3133`
  - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed with an advisory open-PR file
  overlap against #327 on `DeflectionSnapshotLandingPage.tsx`; no blocking
  drift detected.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` | ~2 |
| `web/plans/PR-Deflection-Snapshot-Hero-Supporting-Copy-Proportions.md` | ~75 |
| **Total** | **~77** |
