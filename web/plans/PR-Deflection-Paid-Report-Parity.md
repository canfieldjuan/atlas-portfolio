## Why this slice exists

Issue #213 closes the remaining paid-page parity gap after the ATLAS report
generator started emitting the new Support Tax / Help-Desk SEO / publishable
answer sections. The raw paid artifact now matches the free snapshot story, but
the hosted paid results page still opens with the old clinical wrapper
(`markdown deliverable`, `Report summary`, `Drill-down cards`) and reintroduces
source/vocabulary mechanics ahead of the actual paid report. That mismatch can
make the $1,500 unlock feel like a different product than the snapshot sold.

## Scope (this PR)

Slice phase: Product polish

1. Reframe the paid artifact hero around the complete Support Tax report,
   ranked backlog, Help-Desk SEO targeting list, publishable answers, and
   evidence appendix.
2. Remove the old drill-down card layer from the main paid reading flow so the
   page no longer surfaces source-ticket tags or `faq_result.items` plumbing
   before the authored report.
3. Update the paid-unlock smoke marker contract to prove the paid page renders
   the new parity story rather than the removed clinical wrapper.

### Files touched

- `web/src/components/landing/DeflectionReportArtifactPage.tsx` — paid artifact page framing and main reading flow.
- `web/scripts/smoke-deflection-paid-unlock.mjs` — hosted paid-render markers.
- `web/scripts/test-deflection-paid-unlock-smoke.mjs` — focused paid-unlock smoke fixtures.
- `web/plans/PR-Deflection-Paid-Report-Parity.md` — this plan doc.

## Mechanism

The paid page keeps using the verified ATLAS artifact gate and the artifact
Markdown as the complete paid deliverable. The React wrapper changes from
"markdown plus drill-down cards" to "complete Support Tax report" by:

- Renaming the badge/headline/summary copy to match the snapshot promise.
- Turning the proof badges into value-story metrics: ranked questions,
  publishable answers, needs-review count, repeat-ticket sources, customer
  vocabulary, and action items.
- Replacing the old sticky `Report summary` box with a concise contents panel
  that names the sections the buyer paid for.
- Removing the `ItemCard` drill-down section so source IDs and vocabulary-gap
  mechanics stay inside the report's own evidence appendix instead of becoming
  the first paid-page reading experience.

The smoke scripts update their required markers to the new strings, so a live
paid-render check fails if the old wrapper returns.

## Intentional

- No checkout, webhook, ATLAS artifact fetch, or free snapshot code changes are
  included; this is a paid renderer polish slice over the already-unlocked
  artifact.
- The Markdown renderer remains intentionally simple. Rich section-specific
  rendering can be a later polish slice if the authored report needs custom
  navigation, but this slice removes the contradictory wrapper first.
- Source IDs are not stripped from the paid artifact. They remain acceptable in
  the paid evidence appendix; this PR only removes the redundant source-ID wall
  from the wrapper cards.

## Deferred

- Rich paid-report section navigation, collapsible evidence appendix controls,
  and custom styling per #1279 section are deferred until the core parity copy
  is live.
- Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-paid-unlock-smoke` — passed.
- `rg -n "markdown report is the deliverable|Drill-down cards|Report summary|FULL DEFLECTION REPORT|Your paid report is ready" web/src web/scripts` — passed with no matches.
- `npm --prefix web run lint` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Paid artifact page | ~280 |
| Smoke marker updates | ~20 |
| Plan doc | ~80 |
| Total | ~380 |
