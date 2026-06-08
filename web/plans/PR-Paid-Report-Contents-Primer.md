# Plan: Paid report contents primer

## Why this slice exists

Issue #280 approved moving the paid report contents sidebar out of the sticky
right rail and into an above-the-report primer. The current two-column layout
squeezes the prose report and the ranked opportunities table, while the sticky
contents card keeps following the reader after its single-read value is spent.

This slice gives the paid report the full existing `max-w-5xl` width and splits
the contents panel's three jobs - trust signal, metrics, and table of contents -
into distinct visual zones.

## Scope (this PR)

Slice phase: Product polish

1. Replace the two-column paid report layout with a stacked primer-then-report
   layout.
2. Convert the sticky `ReportContentsPanel` into a static report contents
   primer with separate trust, metrics, and contents sections.
3. Keep the report section labels and factual artifact-derived values unchanged.
4. Add a minimum table width inside the existing horizontal scroll wrapper so
   wide report tables do not collapse in narrower viewports.
5. Extend the already-enrolled paid unlock smoke test with focused source-level
   layout assertions.

### Files touched

- `web/plans/PR-Paid-Report-Contents-Primer.md` - this plan doc.
- `web/src/components/landing/DeflectionReportArtifactPage.tsx` - paid report
  primer layout and table min-width.
- `web/scripts/test-deflection-paid-unlock-smoke.mjs` - source-level layout
  assertions for the paid report render contract.

## Mechanism

`DeflectionReportArtifactPage` renders `ReportContentsPrimer` before
`MarkdownDeliverable` inside a stacked `space-y-*` container. The primer remains a
single outer panel but uses internal dividers and responsive grids to separate:

- the `ShieldCheck` trust row and `Paid report contents` label,
- the first ranked opportunity and top opportunity score metrics,
- the five existing report contents entries.

The markdown table wrapper keeps `overflow-x-auto`; tables keep `w-full` with a
fixed readable minimum width so they fill wide containers and scroll instead of
squeezing in narrow ones.

## Intentional

- `PaidReviewerGuidance` is unchanged; issue #280 explicitly leaves that section
  out of scope.
- The markdown prose typography is unchanged. Only the table minimum width moves
  because the issue names the ranked opportunities table as the visible casualty
  of the squeezed two-column layout.
- No new report sections, SEO claims, traffic promises, ranking promises, or
  artifact-derived values are invented.
- The primer is static on every viewport. Its value is as an up-front map, not a
  pinned reference rail.

## Deferred

- Broader `MarkdownDeliverable` typography density remains a follow-up if the
  full-width report still feels cramped after this layout lands.
- More advanced table treatment such as sticky headers or column-specific widths
  remains deferred until real paid reports prove the need.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-paid-unlock-smoke` - passed; printed
  `Deflection paid unlock smoke tests passed.` and covered the new source-level
  layout assertions.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed; compiled successfully, TypeScript
  finished, generated `44/44` static pages, and copied the deterministic routes
  manifest.
- `bash scripts/local_pr_review.sh` - passed; plan shape, files touched,
  diff-size, drift advisory, dead-code baseline, ESLint, Next build, and
  whitespace checks passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | +91 |
| Paid report layout | +32 / -21 |
| Paid unlock source assertions | +46 / -0 |
| Total | ~190 changed |
