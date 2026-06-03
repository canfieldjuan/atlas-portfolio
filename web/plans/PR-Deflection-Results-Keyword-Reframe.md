## Why this slice exists

Issue #196 still has its keyword / SEO reframe and full-report artifact framing open after the support-tax and locked-count slice. The results page already receives `customer_wording`, but it presents that field as a small "in their words" aside instead of the buyer-facing asset: the exact customer phrases the team can use to target help-center answers and search synonyms. This slice closes that gap without adding keyword-volume, SERP, traffic, rank, LLM, or external-data claims.

## Scope (this PR)

Slice phase: Product polish

1. Reframe visible `customer_wording` values as a help-desk SEO targeting list mined from the uploaded tickets.
2. Add a short, claim-safe phrase-list section to the results page using only already-rendered snapshot data.
3. Reframe the full-report box around the complete ranked list, drafts, phrase list, and no-proven-answer write-next list.
4. Add smoke coverage for the new rendered marker so hosted/browser-upload checks catch stale deploys.

### Files touched

- `web/plans/PR-Deflection-Results-Keyword-Reframe.md` - plan doc for this slice.
- `web/src/components/landing/DeflectionResultsPage.tsx` - results-page phrase-list copy and full-report framing.
- `web/scripts/smoke-deflection-hosted-results.mjs` - required hosted render marker for the phrase-list section.
- `web/scripts/test-deflection-hosted-results-smoke.mjs` - marker contract fixtures.
- `web/scripts/test-deflection-browser-upload-smoke.mjs` - browser-upload result-marker fixture.

## Mechanism

The component derives a de-duplicated list of visible phrases from `top_questions[].customer_wording`, renders those phrases in a compact "Help-desk SEO targeting list" section, and relabels each top question's wording line as the target phrase. The section explicitly frames the phrases as inputs for help-center headings, internal search synonyms, and FAQ wording; it does not claim search volume, Google rank, organic traffic, or guaranteed deflection.

The full-report box adds the complete phrase list as a paid artifact and tightens the remaining bullets around the complete ranked backlog, drafted answers, no-proven-answer questions, and traceable evidence. The hosted results smoke now requires the phrase-list heading, and the browser-upload smoke inherits that check through `runDeflectionHostedResultsSmoke`.

## Intentional

- No keyword-volume API, SERP integration, Google Ads call, LLM rewrite, or traffic/ranking promise is introduced; #196 explicitly rejected customer-specific SEO facts we did not measure.
- The phrase list uses only visible top-question wording in the free snapshot. Locked rows continue to expose rank and counts only, with question text withheld.
- The date-window support-tax normalization gap remains out of scope; this PR does not touch projection math.

## Deferred

- Date-window-normalized support-tax copy remains deferred until ATLAS exposes the upload/report date span.
- External keyword-volume, SERP rank, and organic-traffic claims remain intentionally out of product scope unless a future slice adds real measured data and claim-safe sourcing.
- Live hosted smoke should be rerun after this deploys with a fresh report so the new marker proves production is serving this version.

Parked hardening: none.

## Verification

- `node web/scripts/test-deflection-hosted-results-smoke.mjs` - passed.
- `node web/scripts/test-deflection-browser-upload-smoke.mjs` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed.
- `rg -n "in their words:" web/src/components/landing/DeflectionResultsPage.tsx web/scripts -S` - no matches.
- `rg -n "organic visits|Page 3|you'll rank|you will rank|you currently rank|monthly searches|search volume|SERP" web/src/components/landing/DeflectionResultsPage.tsx web/scripts/smoke-deflection-hosted-results.mjs web/scripts/test-deflection-hosted-results-smoke.mjs web/scripts/test-deflection-browser-upload-smoke.mjs -S` - no matches.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | Estimated LOC |
|---|---:|
| `web/plans/PR-Deflection-Results-Keyword-Reframe.md` | ~55 |
| `web/src/components/landing/DeflectionResultsPage.tsx` | ~70 |
| `web/scripts/smoke-deflection-hosted-results.mjs` | ~1 |
| `web/scripts/test-deflection-hosted-results-smoke.mjs` | ~8 |
| `web/scripts/test-deflection-browser-upload-smoke.mjs` | ~4 |
| Total | ~138 |
