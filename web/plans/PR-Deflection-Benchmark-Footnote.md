## Why this slice exists

Issue #196 requires the unpaid snapshot cost math to stay claim-safe: measured
ticket counts can be multiplied by an industry benchmark, but the benchmark must
be visibly labeled and sourced. The current results page says the default
assisted-contact cost is Gartner's benchmark, but it does not include the
source footnote/link that makes the claim reviewable.

This slice adds that source cue without changing the Support Tax math, checkout,
snapshot payload, paid artifact render, or public price.

## Scope (this PR)

Slice phase: Production hardening

1. Add a visible benchmark-source footnote to the unpaid results-page Support
   Tax projection.
2. Link the footnote to Gartner's public research abstract for "Benchmarks to
   Assess Your Customer Service Costs", which lists the self-service and
   assisted-channel median cost-per-contact benchmarks used by this page.
3. Keep every projection and per-question cost formula unchanged.
4. Preserve checkout, unlock polling, snapshot parsing, locked-row withholding,
   and paid report rendering.

### Files touched

- `web/plans/PR-Deflection-Benchmark-Footnote.md`
- `web/src/components/landing/DeflectionResultsPage.tsx`

## Mechanism

`DeflectionResultsPage` gets a small source URL constant and renders an
external-link footnote inside `SupportTaxProjection`, immediately below the
estimate disclaimer. The link uses a normal anchor with `target="_blank"` and
`rel="noreferrer noopener"` because it leaves the Next.js app.

The copy says the benchmark source is the default for the adjustable
assisted-contact cost and repeats that the output is an estimate, not a savings
guarantee. No numbers, labels, event handlers, API calls, or Stripe fields
change.

## Intentional

- This uses Gartner's public abstract URL instead of quoting or embedding a
  paywalled research artifact.
- This does not add more citation chrome around each ranked question; a single
  footnote under the projection keeps the page readable while sourcing the
  benchmark that drives the repeated cost overlays.
- This does not revisit the broader landing-page benchmark proof section.

## Deferred

- A shared benchmark-source constant for all deflection landing surfaces can be
  added if a future slice sources the static landing-page benchmark cards.
- Parked hardening: none.

## Verification

Ran before push:

- `rg -n "Gartner benchmark source|Benchmarks to Assess Your Customer Service Costs|https://www.gartner.com/en/documents/5164231|noreferrer noopener" web/src/components/landing/DeflectionResultsPage.tsx web/plans/PR-Deflection-Benchmark-Footnote.md -S` - passed
- `npm --prefix web run lint` - passed in a clean worktree
- `npm --prefix web run build` - passed in a clean worktree
- `bash scripts/local_pr_review.sh` - passed in a clean worktree
- `gh pr list --state open --limit 20 --json number,title,headRefName,url` - returned no open PRs

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~60 |
| Results-page source footnote | ~18 |
| Total | ~78 |
