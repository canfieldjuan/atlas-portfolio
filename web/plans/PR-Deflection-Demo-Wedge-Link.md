# Plan: Link the Deflection wedge to its interactive demo (slice 2a)

The interactive demo shipped in #63 is only reachable via the sitemap / direct
URL. Add a prominent link from the wedge page to it, so visitors on the offer
page can jump to the live experience.

## Why this slice exists

- Slice 1 (#63) deferred the wedge → demo link. Without it the demo is orphaned
  from the page that should drive traffic to it.
- The wedge page's static `DeflectionReportSample` is the natural, contextual
  anchor: a static preview that invites "try it live."

## Scope (this PR)

1. Add a prominent "Try it live" link from the `DeflectionReportSample` header to
   `/systems/support-ticket-deflection/demo`.

### Files touched

- `web/plans/PR-Deflection-Demo-Wedge-Link.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/page.tsx` — import `next/link` + add the demo link

## Mechanism

- Import `Link` from `next/link` (the page used only lucide before).
- In the `DeflectionReportSample` header, the right side now shows the source line
  (hidden on small screens) plus a bordered "Try it live →" `Link` to the demo
  route. Localized to the wedge page; no change to the shared
  `DiagnosticReportLandingPage` template.

## Intentional

- **Contextual placement, not a hero CTA** — putting it in the static sample
  header ("static preview → try it live") avoids touching the shared template to
  add a secondary hero CTA, and keeps the hero's single upload CTA primary.
- **Smallest correct step** of slice 2; the GLM supporting sections + wiring the
  seam to the Atlas backend are the next sub-slices.

## Deferred

- GLM supporting sections (cost ticker, full top-10 table, cost-impact metrics,
  how-it-works), re-themed.
- Wire `searchDeflection` to the real Atlas backend + public dataset.
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` clean; `npm --prefix web run build` compiles.
- `bash scripts/pre_push_audit.sh origin/main` green.
- Browser spot-check: the wedge page sample header shows a working "Try it live"
  link to `/systems/support-ticket-deflection/demo`.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| wedge page (import + link in sample header) | ~16 |
| this plan doc | ~70 |
| **Total** | ~86 |

Well under the 400-LOC soft cap.
