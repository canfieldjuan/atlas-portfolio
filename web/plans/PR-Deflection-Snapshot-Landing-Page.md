## Why this slice exists

atlas-portfolio#197 calls for an additive, shorter support-ticket deflection
landing page, and atlas-portfolio#196 clarified that the page should sell the
free Deflection Snapshot as the primary offer. The current
`/systems/support-ticket-deflection` page remains the long-form version; this
slice adds a snapshot-first alternative without changing intake, results,
checkout, or the existing page.

## Scope (this PR)

Slice phase: Product polish

1. Add a new `/systems/support-ticket-deflection/snapshot` route.
2. Build a short 4-P landing page around the free Deflection Snapshot: promise,
   picture, proof, and push.
3. Reuse the existing demo snapshot/teaser shape so the sample page shows the
   same bounded proof object the results page can render.
4. Register the route for no-chrome conversion focus and sitemap discovery.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Landing-Page.md` - plan contract for this PR.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - new snapshot-first landing page.
- `web/src/app/systems/support-ticket-deflection/snapshot/page.tsx` - App Router route and metadata.
- `web/src/lib/no-chrome-routes.ts` - hides global chrome on the new conversion route.
- `web/src/app/sitemap.ts` - lists the additive route for discovery.

## Mechanism

The new page is a server-rendered route that imports the existing
`DEMO_DEFLECTION_SNAPSHOT` fixture from `deflection-snapshot.ts`. It renders a
first-viewport sample snapshot panel with ranked questions, customer wording,
one drafted-answer teaser, locked preview rows, and a single primary CTA to the
existing intake route. The copy uses #196's claim doctrine: benchmark/cost
language stays framed as an estimate and the page does not claim search volume,
rank, guaranteed deflection, or customer-specific measurements before upload.

## Intentional

- The existing `/systems/support-ticket-deflection` page is not replaced.
- No new calculator or cost projection is added because #196 requires raw
  `ticket_count`, total repeat-ticket volume, and locked rows from ATLAS before
  those claims are customer-specific.
- The sample snapshot is labeled as representative demo data; it does not pretend
  to be the visitor's uploaded data.
- Intake, results, checkout, webhook, and paid-artifact behavior stay unchanged.

## Deferred

- ATLAS payload work for raw per-question `ticket_count`, total repeat-ticket
  volume, and locked 6-N rows.
- #196 results-page Support Tax projection, cost overlay, FOMO locked rows, and
  fuller keyword reframe after those backend fields exist.
- Traffic split or A/B routing between the long and short landing pages.

Parked hardening: none

## Verification

- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- Browser check: opened `/systems/support-ticket-deflection/snapshot` with
  `agent-browser` at desktop and mobile viewports; page loaded, no framework
  overlay, meaningful content rendered, and both CTAs pointed to
  `/systems/support-ticket-deflection/intake`.
- Review fix browser check: re-opened
  `/systems/support-ticket-deflection/snapshot` with `agent-browser`; confirmed
  the lock card renders `Ranks 5-47 stay locked` and the stale `Ranks 4-47 stay
  locked` label is absent.
- `rg -n "Get my free Deflection Snapshot|support-ticket-deflection/snapshot" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/src/app/systems/support-ticket-deflection/snapshot/page.tsx web/src/lib/no-chrome-routes.ts web/src/app/sitemap.ts` - confirmed CTA and route registrations.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | 78 |
| Snapshot landing page | 357 |
| Route + registrations | 24 |
| Total | ~459 |

The diff is over the 400 LOC target because the first-screen sample snapshot,
proof section, and route registration are the smallest coherent slice that lets
the page sell the snapshot without relying on the old long config.
