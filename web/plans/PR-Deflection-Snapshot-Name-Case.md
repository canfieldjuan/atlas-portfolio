## Why this slice exists

PR-Deflection-Snapshot-Support-Tax-Fomo strengthened the Snapshot landing page,
and review explicitly carried forward a non-blocking capitalization nit: the
page treats `Snapshot` as a named artifact in most places, but two high-visibility
strings still say `free snapshot`.

This slice makes the offer name consistent without changing positioning,
layout, routes, pricing, checkout, payloads, or tests.

## Scope (this PR)

Slice phase: Product polish

1. Capitalize `Snapshot` in the hero description.
2. Capitalize `Snapshot` in the final-push heading.
3. Preserve all CTA labels, hrefs, layout, cost math, locked-row copy, intake,
   checkout, results, and smoke scripts.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Name-Case.md`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`

## Mechanism

This is a copy-only edit in `DeflectionSnapshotLandingPage.tsx`: two visible
strings change from `free snapshot` to `free Snapshot` so the page consistently
treats Snapshot as the named free artifact. No component structure, props, data,
or styles change.

## Intentional

- This does not reword the offer or change any CTA.
- This does not touch the live results-page #196 redesign work.
- This does not change long-page, partner-page, or legacy-config behavior.

## Deferred

- Broader style-guide decisions for every product noun remain out of scope.
- Parked hardening: none.

## Verification

Run before push:

- `rg -n "free snapshot|free Snapshot|Get a free Snapshot|Start with the free Snapshot" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/plans/PR-Deflection-Snapshot-Name-Case.md -S` - passed; active component instances now use `free Snapshot`, with lowercase mentions only in this plan's rationale.
- `npm --prefix web run lint` - passed
- `npm --prefix web run build` - passed
- `bash scripts/local_pr_review.sh` - passed

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~60 |
| Copy-only Snapshot capitalization | ~2 |
| Total | ~62 |
