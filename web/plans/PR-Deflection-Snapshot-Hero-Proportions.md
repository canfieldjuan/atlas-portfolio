# PR-Deflection-Snapshot-Hero-Proportions

## Why this slice exists

The Snapshot landing hero now has the right intake/form behavior, but the left
hero still reads smaller than the product-style reference. The user wants the
existing hero to take up more visual space without changing the intake form
model, copy, upload flow, or security/data claims.

## Scope (this PR)

Slice phase: Product polish

1. Increase the desktop hero container width so the left promise has more room.
2. Rebalance the desktop grid proportions toward the left hero column while
   keeping the existing intake form on the right.
3. Increase the desktop headline size at large viewports.
4. Preserve mobile layout, all visible copy, form behavior, smoke markers, and
   the current intake/security structure.

### Files touched

- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - hero grid and headline proportions only.
- `web/plans/PR-Deflection-Snapshot-Hero-Proportions.md` - plan contract for this slice.

## Mechanism

The hero section moves from the existing `max-w-6xl` layout to a wider desktop
container and gives the left grid track a larger share of the horizontal space.
The headline keeps its current mobile size and grows one step larger at large
desktop widths. The right-side intake keeps its existing component, max width,
copy, and behavior.

## Intentional

- No copy changes.
- No form, upload, validation, PII/security, or data-handling changes.
- This slice does not mirror the alternate dropzone intake design; it only
  borrows the larger desktop hero proportions.

## Deferred

PII/backend scrubbing, storage claims, copy changes, and any dropzone-first
intake redesign remain deferred to their dedicated lanes.

Parked hardening: none.

## Verification

- `npm --prefix web ci` - passed; npm reported 6 existing audit
  vulnerabilities.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- Browser check at `http://127.0.0.1:3131/systems/support-ticket-deflection/snapshot`
  with Turbopack dev server:
  - Desktop 1440x1100 screenshot:
    `/tmp/deflection-snapshot-hero-proportions-desktop.png`; no horizontal
    overflow (`scrollWidth: 1425`, `innerWidth: 1440`), hero section width
    `1280`, headline font `72px`, headline width `694`, right intake width
    `530`, and next section top `952`.
  - Mobile 390x844 screenshot:
    `/tmp/deflection-snapshot-hero-proportions-mobile.png`; no horizontal
    overflow (`scrollWidth: 375`, `innerWidth: 390`), headline font remains
    `36px`, form top `430`, and next section top `1588`.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3131`
  - passed.
- `npm --prefix web run build` - passed.
- `bash scripts/local_pr_review.sh` - passed with an advisory open-PR file
  overlap against #327 on `DeflectionSnapshotLandingPage.tsx`; no blocking
  drift detected.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` | ~6 |
| `web/plans/PR-Deflection-Snapshot-Hero-Proportions.md` | ~78 |
| **Total** | **~84** |
