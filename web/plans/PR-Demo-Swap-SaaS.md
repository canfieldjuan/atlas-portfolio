# Plan: Swap the on-page demo from CFPB to the real B2B-SaaS sample

Operator's call: **replace** the CFPB consumer-complaint demo with the on-domain
B2B-SaaS sample the generator dev delivered (`support-ticket-saas-demo-faq-result.json`).
Rebuild `DeflectionReportSample` to render the real SaaS output — honest about the
current sample's limits (draft answers, no zero-result), leaning on the strong
real fields. Operator-approved demo layout.

## Why this slice exists

- The CFPB demo is off-ICP: a B2B-SaaS support lead sees credit-dispute / mortgage
  FAQs, not their product. The dev delivered a real generator run on 36
  labeled-synthetic SaaS rows → 6 FAQ items, which is relatable + defensible
  ("real output, no customer tickets shown"). Operator chose replace over
  keep-as-scale-proof.

## Scope (this PR)

Slice phase: Product polish

`landingConfig.tsx`:
1. **Replace the CFPB data consts** (`sampleRankedQuestions`, `sampleFaqExamples`,
   `demoScaleStats`) with SaaS consts derived from the real JSON: `saasDemoStats`
   (36 tickets / 6 FAQs / output_checks ✓), `saasDemoQuestions` (the 6 ranked
   items: topic + customer-wording question + `ticket_count` + real
   `failure_risk_signals`), `saasDemoFaq` (item 1 expanded: `term_mappings`,
   `when_to_contact_support`, `evidence_quotes`, cited count).
2. **Rewrite `DeflectionReportSample`** to render the SaaS demo: header ("· B2B
   SaaS sample"), the source note, the stat chips, the ranked list, and **one
   expanded FAQ** showing the strong fields (term map, when-to-contact, real
   cited quotes) + a "draft · needs your review" tag. Keeps "Try it live" → /demo.
3. **Update the `sample` config** title/description to the SaaS source note.

### Files touched

- `web/plans/PR-Demo-Swap-SaaS.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — demo data consts + `DeflectionReportSample` + `sample` config
- `web/docs/landing-page-framework/support-ticket-saas-demo-faq-result.json` — the demo's source-of-truth (real generator output, new)
- `web/docs/landing-page-framework/support-ticket-saas-demo-sources.csv` — the 36 labeled-synthetic source rows (new)
- `web/docs/landing-page-framework/demo-sample-request.md` — adds the dev's "Backend handoff received" response (sample limits)

## Mechanism

- Display data is curated from the real `TicketFAQMarkdownResult` JSON (the
  source-of-truth artifact in `docs/`). The demo shows a faithful excerpt: the 6
  ranked questions + one expanded FAQ. It deliberately **does not** parade the
  generic `steps`/`action_items` (which are `draft_needs_review` scaffolds on this
  no-resolution-text corpus); it leans on the strong real fields (term map,
  evidence quotes, when-to-contact) with an honest draft tag.

## Intentional

- **Honest about current state** — "draft · needs your review", "no customer
  tickets shown", drafts-not-finished; the placeholder `example.com/support` URL
  is dropped from the when-to-contact line (the real customer's URL goes there).
- **Real topics kept** (incl. the generator's "Other support issues") rather than
  relabeled — it's a real-output demo.
- **Trades scale-proof for relatability** — the SaaS set is 36 rows, so the demo
  no longer carries the CFPB "1.28M validated" scale claim (operator chose
  replace). Findability stays the term-map mechanism, not a zero-result/ranking
  claim (D-028; the zero-result hook stays only on the aspirational cards per the
  operator's "page leads product" call).

## Deferred

- The CFPB validation `.md` files under `public/` are now unlinked (orphaned) —
  a later cleanup, not deleted here.
- A `resolution_evidence` mix + `zero_result_search` proof need a follow-up corpus
  slice from the generator dev (per `demo-sample-request.md`).

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size).
- `npm run lint` / `tsc --noEmit` clean (no dangling `sampleRankedQuestions`/
  `sampleFaqExamples`/`demoScaleStats`/`totalSources` refs); `npm run build`
  succeeds; the SaaS demo renders on the wedge + `/partner`.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| data consts (CFPB → SaaS) | ~110 |
| `DeflectionReportSample` rewrite | ~195 |
| `sample` config | ~6 |
| this plan doc | ~95 |
| `support-ticket-saas-demo-faq-result.json` (source-of-truth artifact) | ~435 |
| `support-ticket-saas-demo-sources.csv` (36 source rows) | ~37 |
| `demo-sample-request.md` (handoff response) | ~48 |
| **Total** | ~925 |

Over the 400-LOC soft cap, but the **reviewable code surface is ~310 LOC**
(`landingConfig.tsx`); the remaining ~610 are the demo's source-of-truth data
artifacts (JSON + CSV) and a docs note. Bundled deliberately: the SaaS demo and
the real generator output it renders are one unit, and checking the JSON in is
what makes "real output from the generator" verifiable by a reviewer (the plan
calls it the source-of-truth in `docs/`). Splitting the code from its data would
leave the page referencing a file that isn't in the repo.
