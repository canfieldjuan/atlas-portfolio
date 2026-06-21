# Uploaded Search Contract Pointers

## Why this slice exists

PR #343 added the deployed uploaded-search smoke. Review confirmed it is
fail-closed and PII-safe, then noted a non-blocking drift risk: the renderable
`TicketFAQItem` shape is now checked in the portfolio parser, the uploaded-search
smoke, and the ATLAS backend gate. A future contract change should update those
validators together instead of silently drifting.

## Scope (this PR)

Slice phase: Production hardening

1. Add cross-reference comments near the two local renderable-item validators.
2. Point both comments at the ATLAS backend admission gate as the third contract
   copy.

### Files touched

- `web/plans/PR-Uploaded-Search-Contract-Pointers.md` — this plan doc.
- `web/src/lib/atlas-deflection-client.ts` — parser validator comment.
- `web/scripts/smoke-deflection-uploaded-search.mjs` — smoke validator comment.

## Mechanism

This is comment-only. The comments name the paired portfolio validator and the
ATLAS `_deflection_report_full_item` gate so a future `TicketFAQItem` shape
change has a visible checklist at each local copy.

## Intentional

- No runtime behavior changes.
- No attempt to share code between the app parser and the Node smoke in this
  slice; that would turn a small drift guard into a build/module-boundary change.

## Deferred

- A single shared renderable-item validator remains a possible follow-up if the
  contract changes frequently enough to justify the coupling.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-uploaded-search` — passed.
- `npm --prefix web run lint -- src/lib/atlas-deflection-client.ts scripts/smoke-deflection-uploaded-search.mjs` — passed.
- `npm --prefix web ci` — passed; installed dependencies inside this fresh worktree before the full local review gate.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Uploaded-Search-Contract-Pointers.md` | ~58 |
| `web/src/lib/atlas-deflection-client.ts` | ~3 |
| `web/scripts/smoke-deflection-uploaded-search.mjs` | ~3 |
| **Total** | **~64** |
