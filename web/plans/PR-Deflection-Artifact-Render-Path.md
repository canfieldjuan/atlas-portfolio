## Why this slice exists

The free results page renders the `DeflectionSnapshot` shape, and the landing
demo now renders one `TicketFAQItem`-shaped drill-down card. The next missing
piece is the post-payment artifact rendering path: when ATLAS returns a paid
`FAQDeflectionReportArtifact`, the portfolio app needs a typed, honest way to
render the top-level markdown deliverable, summary proof badges, and
`faq_result.items` drill-down cards.

The canonical source of truth remains the merged ATLAS document
`docs/frontend/content_ops_faq_report_contract.md` in `canfieldjuan/ATLAS`. This
slice points to that contract and shares local TypeScript types; it does not copy
the ATLAS doc.

## Scope (this PR)

Slice phase: Product polish

1. Add shared deflection report artifact types for `FAQDeflectionReportArtifact`,
   `TicketFAQMarkdownResult`, `TicketFAQItem`, and `FAQTermMapping`.
2. Move the demo to import `TicketFAQItem` / `FAQTermMapping` from the shared
   report contract module instead of owning those types.
3. Add a full artifact results component that renders:
   - top-level `markdown` as the deliverable,
   - `summary` as proof badges,
   - `faq_result.items` as drill-down cards using the same product item shape.
4. Add a route-level artifact branch that falls back to the existing free
   snapshot while `getArtifact()` returns `null`.

### Files touched

- `web/plans/PR-Deflection-Artifact-Render-Path.md` - plan for this slice.
- `web/src/lib/deflection-report-contract.ts` - shared local types and artifact
  path helper aligned to the ATLAS source-of-truth doc.
- `web/src/lib/deflection-demo.ts` - imports shared report item types.
- `web/src/components/deflection-demo/DeflectionDemo.tsx` - imports shared report
  item types.
- `web/src/components/landing/DeflectionReportArtifactPage.tsx` - full artifact
  renderer for markdown, proof badges, and item drill-downs.
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` -
  route branch for artifact-or-snapshot rendering.

## Mechanism

`deflection-report-contract.ts` holds the local TypeScript contract used by both
the demo and the paid artifact renderer. It includes only type declarations and
path helpers; runtime hydration remains route-owned.

`DeflectionReportArtifactPage` is a server-renderable presentation component. It
renders the top-level artifact markdown with a small safe markdown subset
(headings, bullets, numbered items, and paragraphs), then renders summary proof
badges and the top FAQ items as structured cards. The cards read directly from
`TicketFAQItem`: counts, answer evidence status, `term_mappings`, source labels,
steps, action items, and `when_to_contact_support`.

The results route calls `getArtifact(requestId)` before `getSnapshot(requestId)`.
Today `getArtifact()` returns `null` because the deployed ATLAS host, auth scope,
and payment unlock behavior are not configured in this repo. Once wired, a `200`
artifact can render the full report; `403` or `404` should continue rendering the
free snapshot.

## Intentional

- No payment flow is added in this slice.
- No live ATLAS network call is added yet; the route has the typed branch but
  still falls back to the snapshot fixture.
- The markdown renderer does not use `dangerouslySetInnerHTML` and does not try
  to support arbitrary Markdown extensions.
- The free snapshot component remains unchanged.

## Deferred

- Live `GET /content-ops/deflection-reports/{request_id}/artifact` hydration,
  including ATLAS base URL, B2B JWT, 200/403/404 handling, timeout, and runtime
  validation.
- Checkout/session creation and post-payment unlock probing.
- Full Markdown feature support beyond headings, bullets, numbered lists, and
  paragraphs.

Parked hardening: none.

## Verification

- `rg -n "export type (FAQDeflectionReportArtifact|TicketFAQMarkdownResult|TicketFAQItem|FAQTermMapping)|deflectionArtifactPath|DeflectionReportArtifactPage|getArtifact|dangerouslySetInnerHTML" web/src/lib/deflection-report-contract.ts web/src/lib/deflection-demo.ts web/src/components/deflection-demo/DeflectionDemo.tsx web/src/components/landing/DeflectionReportArtifactPage.tsx web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` - expected shared contract, artifact path, renderer, and route-branch references found; no `dangerouslySetInnerHTML` reference appears.
- `rg -n "isPipeTableRow|isPipeSeparatorRow|<table|<ol|<ul|<h1|dangerouslySetInnerHTML" web/src/components/landing/DeflectionReportArtifactPage.tsx` - pipe-table branch, semantic lists, and the page-level `<h1>` are present; markdown headings are demoted under it; no `dangerouslySetInnerHTML` reference appears.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| Plan doc | ~103 |
| Shared contract | ~89 |
| Demo imports | ~10 |
| Artifact renderer | ~456 |
| Results route | ~15 |
| Total | ~711 |

This is over the 400-LOC soft cap because the renderer needs enough structure to
make the paid artifact path meaningful without wiring payment or live ATLAS
calls.
