# Plan: Make the embedded demo read like the report

## Why this slice exists

The landing page now embeds the interactive demo in the right general area:
after the mechanism explains how the report works and before the offer explains
what buyers get. But the rendered result still feels like a generic
"published FAQ plus signal panel" rather than the actual Deflection Report shape
we are selling: ranked repeat question, customer wording, documentation gap,
source evidence, and a drafted FAQ.

## Scope (this PR)

Slice phase: Product polish

1. Extend the demo result contract with report-shape fields: customer wording,
   documentation gap, source ids, and evidence status.
2. Populate those fields in the local sample dataset and Atlas adapter.
3. Rework the interactive demo result cards so the answer appears as a report
   finding with evidence and an FAQ draft, not an "ours vs theirs" help article.
4. Adjust the landing demo intro copy to match the report-finding presentation.
5. Keep the demo placement after the mechanism and before the offer.

### Files touched

- `web/plans/PR-Demo-Report-Shape.md` — this plan doc.
- `web/src/lib/deflection-demo.ts` — demo contract and local sample fields.
- `web/src/app/api/demo/deflection-search/route.ts` — Atlas adapter fields for the same contract.
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — report-finding result presentation.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — demo section description.

## Mechanism

`DeflectionIssue` gains the report-facing fields the UI needs. The local dataset
uses explicit customer wording, documentation-gap summaries, source ids, and
evidence status for each sample issue. The Atlas adapter maps its compact search
projection into the same fields using the returned question/source ids and a
generic gap summary, because the compact search response does not carry the full
`term_mappings[]` detail.

`DeflectionDemo` keeps the existing search/chip/error behavior, but the result
presentation changes from "answer card beside signals" into two cards:

- a ranked finding card showing customer wording, documentation gap, repeat
  volume, source tickets, and evidence status;
- a draft FAQ card showing the review-ready question, answer steps, and action
  items.

The source-evidence chip row may show only a short preview of source ids. Its
omitted-count badge is derived from the finding's `sourceCount`, not from the
preview array length, so the visible evidence preview stays consistent with the
advertised source-ticket count.

## Intentional

- No page-order change yet; the demo placement after "How it works" is kept
  because buyers first need the mechanism before the sample makes sense.
- No copy claims that the sample data is the buyer's data.
- The Atlas adapter uses a generic documentation-gap summary until the live
  endpoint exposes full term mappings in this compact route.
- No calculator, pricing, CTA, FAQ, or intake changes.

## Deferred

- Moving the demo earlier or later after seeing the revised report-shape card in
  review.
- Exposing full `term_mappings[]`, `evidence_quotes[]`, and action-item arrays
  through the public demo search route.
- Parked hardening: none

## Verification

- `rg -n "What the Report would publish|Why this matters|answer to publish|ticket demand behind it|Report finding|FAQ draft|documentationGap|sourceIds|customerWording" web/src` — confirmed the old result-card framing is absent and the report-shape fields render in the demo.
- `rg -n "function SourceIds|omittedSourceCount|sourceCount=|\+\{omittedSourceCount\}" web/src/components/deflection-demo/DeflectionDemo.tsx` — confirmed the evidence preview's `+N more` indicator is derived from `sourceCount`, addressing the review P2 for local samples where `sourceIds` is a preview list.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed; `/systems/support-ticket-deflection`, `/demo`, and the API route compiled successfully.
- Browser check of `/systems/support-ticket-deflection` with the `export attribution reports` demo chip on desktop and 390px mobile — rendered `Report finding`, `FAQ draft`, `Customer wording`, `Documentation gap`, and `Source evidence`; the 8-source sample now shows three visible source ids plus `+5 more`; no framework overlay, no browser errors, and no horizontal overflow.
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~90 |
| Demo contract and sample fields | ~45 |
| Route adapter contract mapping | ~10 |
| Demo result renderer | ~170 |
| Landing demo description | ~4 |
| Total | ~320 |

Under the 400-LOC soft cap.
