# PR-Content-Ops-Demo-Scale-Copy

## Why this slice exists

The public FAQ demo replaced mock SaaS data with a real CFPB-derived sample, but
the visible `46 rows sampled` copy makes the demo feel small. A visitor could
read that number as the system's processing limit instead of an intentionally
small on-page excerpt.

This slice reframes the sample artifact so visitors understand the distinction:
the public archive is large, the FAQ generator has now passed a real 1,000-row
validation run, customer reports are meant for full uploaded CSV batches, and
the visible FAQ card only shows a compact excerpt for readability.

## Scope (this PR)

1. Reword the FAQ Report sample header and headline copy so `46 rows` is framed
   as an excerpt, not the processing ceiling.
2. Add compact scale indicators for archive size, narrative rows, the validated
   1,000-row run, and excerpt size.
3. Update ranked-list labels from raw "sources" language to excerpt-source
   language.
4. Update the static Markdown demo with the same scale framing.
5. Keep CTA routes, pricing, intake flow, and the landing-page component seam
   unchanged.

### Files touched

- `src/app/systems/ai-content-ops/page.tsx`
- `public/systems/ai-content-ops/public-support-ticket-faq-demo.md`
- `plans/PR-Content-Ops-Demo-Scale-Copy.md`

## Mechanism

`FAQReportSample` gains a small static `demoScaleStats` array rendered as a
four-column stat strip:

```tsx
const demoScaleStats = [
  { value: `1.28M`, label: `public archive rows` },
  { value: `383k`, label: `narratives available` },
  { value: `1,000`, label: `rows validated` },
  { value: `46`, label: `rows shown in excerpt` },
];
```

The prose now states that 46 rows are shown for readability, that the generator
passed a fail-closed 1,000-row public complaint run, and that customer reports
analyze the uploaded batch, including common 500-1,000+ ticket exports. The
Markdown artifact receives matching language so the linked demo does not
reintroduce the small-sample ambiguity.

## Intentional

- The page does not claim a benchmark or throughput guarantee. It claims a real
  1,000-row validation run and a product-fit claim for common 500-1,000+ row CSV
  batches.
- The excerpt stays at 46 rows because it is enough to show grounded source IDs
  without turning the landing page into a long report.
- No runtime processing or new data pipeline is introduced in this portfolio
  slice.

## Deferred

- A future PR can link a generated 1,000-row static artifact if we want a
  heavier downloadable proof asset.
- A future PR can add measured hosted-service throughput proof if the production
  service exposes repeatable benchmark data.

## Verification

Completed:

- `git diff --check`
- `npm run lint`
- `npm run build`
- Text sweep confirmed the page names the 1,000-row validation, still frames 46
  rows as an excerpt, and does not reintroduce `Sample / Mock`, `12,400`,
  `password reset`, `downgrade plan`, or `API keys`.
- Started the local Next dev server on `http://127.0.0.1:3100` and checked
  `/systems/ai-content-ops` for the 1,000-row validation copy and unchanged
  `/systems/ai-content-ops/intake` CTA routing.
- Static artifact check returned `200 OK` for
  `/systems/ai-content-ops/public-support-ticket-faq-demo.md` and confirmed the
  Markdown names the 1,000-row validation plus the 46-row excerpt.

## Estimated diff size

3 files, approximately +125 / -9 lines. This is under the 400 LOC soft cap.
