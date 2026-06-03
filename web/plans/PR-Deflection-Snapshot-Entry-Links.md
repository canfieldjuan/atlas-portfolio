# PR-Deflection-Snapshot-Entry-Links

## Why this slice exists

atlas-portfolio#197 now has an additive snapshot-first page at
`/systems/support-ticket-deflection/snapshot`, with the first-screen
before/after proof order reviewed in PR-Deflection-Snapshot-Proof-Order. The
page still gets little normal traffic: the public systems directory and the AI
Content Ops hub continue linking visitors to the long-form deflection page.

This slice promotes the snapshot-first page from direct/sitemap-only discovery
into the existing product entry points without deleting or replacing the old
long page. The old `/systems/support-ticket-deflection` route remains live for
deeper explanation and existing links.

## Scope (this PR)

Slice phase: Product polish

1. Point the Support Ticket Deflection card on `/systems` to the snapshot-first
   page and label the link around the free snapshot offer.
2. Point the Support Ticket Deflection offer on `/systems/ai-content-ops` to
   the snapshot-first page and label the CTA around the free snapshot offer.
3. Update the AI Content Ops hero's live-offer link to the same snapshot-first
   page.
4. Leave the long deflection page, intake route, result route, checkout, pricing,
   sitemap, and no-chrome behavior unchanged.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Entry-Links.md` - plan contract for this slice.
- `web/src/app/systems/page.tsx` - systems-directory Support Ticket Deflection link target and label.
- `web/src/app/systems/ai-content-ops/page.tsx` - AI Content Ops hub live-offer and product-card link target and label.

## Mechanism

The two hub pages already drive link targets from local config objects and
static `Link` components. This slice changes only the Support Ticket Deflection
entry URLs from `/systems/support-ticket-deflection` to
`/systems/support-ticket-deflection/snapshot`, and updates visible labels to say
the visitor is viewing or getting the free Deflection Snapshot. Existing
`/systems/support-ticket-deflection` route registration, metadata, sitemap
entry, and page implementation are untouched.

## Intentional

- This does not replace the existing long-form deflection page or redirect its
  URL.
- This does not change any upload/intake CTA target inside the snapshot page;
  the snapshot page still sends qualified visitors to the existing intake route.
- This does not change pricing copy, checkout behavior, result-page copy, or
  ATLAS payload contracts.
- The AI Content Ops card still describes the paid report because that is the
  product family; the CTA now starts with the free snapshot entry point.

## Deferred

- A/B testing, traffic splitting, redirects, or retiring the long page remain out
  of scope until the operator decides the snapshot route should become canonical.
- Closing #197 remains an operator call after the promoted entry path is reviewed.

Parked hardening: none

## Verification

- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- Browser check with `agent-browser` on `/systems` and
  `/systems/ai-content-ops` - passed; accessibility snapshots showed the
  promoted Support Ticket Deflection links, and DOM href checks confirmed all
  three point to `/systems/support-ticket-deflection/snapshot` with no browser
  page errors.
- `rg -n "/systems/support-ticket-deflection/snapshot|View the free Deflection Snapshot|See the free snapshot offer|View the free Snapshot" web/src/app/systems/page.tsx web/src/app/systems/ai-content-ops/page.tsx web/plans/PR-Deflection-Snapshot-Entry-Links.md` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~80 |
| Entry link updates | ~8 |
| Total | ~88 |
