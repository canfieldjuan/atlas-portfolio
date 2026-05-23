# Plan: Content Ops hub (Phase 1, link-first)

Turn `/systems/ai-content-ops` from the retired FAQ Report landing into the
**Content Ops hub** — an index that presents the Content Ops umbrella and links
to its productized wedges. Smallest correct Phase-1 step: link to the existing
wedge routes; route-nesting + 301s and the GLM demo are later slices.

## Why this slice exists

- Per the locked IA roadmap, `/systems/ai-content-ops` should be the **parent
  hub** over Content Ops wedges, not a single-wedge landing. Today it still
  serves the retired FAQ Report (URL ↔ content mismatch).
- Support Ticket Deflection is the live wedge; this hub frames Content Ops as the
  umbrella and routes buyers to the wedge(s) that exist today.
- **Over the 400-LOC soft cap (~1060):** diff size counts added + deleted, and
  the rewrite *deletes* the ~810-line retired FAQ Report page while adding the
  ~250-line hub on the same URL. The gross diff is mostly deletion; retiring the
  page + standing up the hub on one URL is a single indivisible move.

## Scope (this PR)

1. Rewrite `web/src/app/systems/ai-content-ops/page.tsx` as a hub/index:
   Content Ops umbrella positioning + cards linking to the live offers.
2. Rewrite `web/src/app/systems/ai-content-ops/layout.tsx` metadata (FAQ Report →
   Content Ops hub).

### Files touched

- `web/plans/PR-Content-Ops-Hub.md` — this plan doc (new)
- `web/src/app/systems/ai-content-ops/page.tsx` — rewrite as the Content Ops hub
- `web/src/app/systems/ai-content-ops/layout.tsx` — hub metadata

## Mechanism

- The page becomes a self-contained client component (matching `systems/page.tsx`
  patterns: framer-motion, lucide, `next/link`, `buildAuditHref`) — it no longer
  imports `DiagnosticReportLandingPage`. Hero (umbrella) + product cards
  (Support Ticket Deflection → `/systems/support-ticket-deflection`; Ongoing
  Optimization → `/systems/ai-content-ops/ongoing-support`) + a "what Content Ops
  produces" strip + an audit CTA.
- **Link-first:** cards link to the existing wedge routes; no route moves or 301s
  this slice.
- Headings use `text-foreground` (visible on the light theme), **not** the
  `text-white` pattern that renders invisible on light `glass`/page surfaces (see
  the systemic note in Deferred).
- `layout.tsx` swaps the FAQ Report metadata for Content Ops hub metadata; the
  breadcrumb already reads "AI Content Ops".

## Intentional

- **Link-first, smallest step** — nesting the deflection route under
  `/systems/ai-content-ops/` (+ 301) and the GLM demo page are their own later
  slices, in logical order.
- **Leave the `intake/` and `ongoing-support/` subroutes untouched** this slice.
  The FAQ Report intake at `/systems/ai-content-ops/intake` is now orphaned (the
  hub doesn't link to it); retiring/redirecting it is a follow-up.
- **Correct colors** — headings are `text-foreground`, not `text-white`, so the
  hub is visible on the light theme.

## Deferred

- Nest the Support Ticket Deflection wedge under `/systems/ai-content-ops/` (+ 301).
- Retire/redirect the orphaned `/systems/ai-content-ops/intake` (FAQ Report CSV).
- The GLM "Clarify" demo page; the thin-config wedge refactor; Phase 2 suite offer.
- **Systemic invisible-text bug (surfaced here, not fixed here):** `text-white`
  headings on light `glass` surfaces render invisible — confirmed on
  `systems/page.tsx`; `text-white` appears 195× across 44 page files, an unknown
  subset being the same bug as the intake form (#52). Warrants a dedicated
  theme-contrast audit slice; logged for follow-up.
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` and `npm --prefix web run build` pass.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape, files-touched,
  diff-size).
- Browser spot-check: `/systems/ai-content-ops` renders the hub with **visible**
  headings, cards link to the live wedge routes, no overflow.

## Estimated diff size

Counts added **+ deleted**, so replacing the ~810-line retired FAQ Report page
dominates even though the hub itself is small:

| Area | LOC (added + deleted) |
|---|---|
| replace retired FAQ Report `page.tsx` with the hub | ~960 |
| `layout.tsx` metadata | ~15 |
| this plan doc | ~90 |
| **Total** | ~1060 |

Over the 400-LOC soft cap — justified in "Why this slice exists": the bulk is
deletion of the retired page, and retiring it + standing up the hub on the same
URL is indivisible.
