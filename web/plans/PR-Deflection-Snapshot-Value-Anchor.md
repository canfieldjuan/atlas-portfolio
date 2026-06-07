## Why this slice exists

Issue #261 flags a conversion-framing problem after the landing preview was aligned with the real Snapshot/results shape: the visible repeat-ticket cost estimates can anchor too low next to the $1,500 full-report ask. The fix must strengthen the value anchor without fabricating ticket counts, report values, or savings claims.

This slice keeps the Gartner assisted-contact benchmark intact and raises the
representative landing-page ticket volume instead. The Snapshot preview now
frames the cost as a larger-company support workload decision instead of a tiny
ticket-by-ticket number.

## Scope (this PR)

Slice phase: Product polish

1. Scale the representative demo Snapshot from 170 to 1,700 repeat-ticket hits,
   with top-question, locked-question, weighted-frequency, and teaser source
   counts scaled consistently.
2. Keep the landing page and real results page on the existing Gartner `$13.50`
   assisted-contact benchmark default.
3. Add a concise value-anchor note next to the projection math so the $1,500
   full-report ask is supported by annual / 3-year workload framing, not just
   the uploaded-window total.
4. Tighten landing-page copy that implies small static estimates where the
   shared calculator now drives the value frame.
5. Add focused guards for the higher-volume fixture, benchmark default, and
   landing smoke marker so this conversion frame cannot silently disappear.

### Files touched

- `web/src/lib/deflection-snapshot.ts` - scale the representative SaaS demo
  Snapshot volume while preserving its shape.
- `web/src/components/landing/DeflectionSupportTaxProjection.tsx` - add the
  value-anchor prop and render the framed note.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - keep the
  benchmark default and pass the volume-based full-report value anchor.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` - require the new value-anchor marker on the public landing page.
- `web/scripts/test-deflection-cost-projection-share.mjs` - guard the benchmark
  default, higher-volume fixture, and shared value-anchor prop.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - update smoke fixtures for the new marker.
- `web/plans/PR-Deflection-Snapshot-Value-Anchor.md` - plan for this slice.

## Mechanism

The shared projection keeps using measured `repeatTicketCount`, optional source-window normalization, and the user-selected assisted-contact cost:

```tsx
batchCost = repeatTicketCount * assistedContactCost
annualRunRate = sourceWindow ? (batchCost / sourceWindowDays) * 365 : batchCost * 12
threeYearRunRate = annualRunRate * 3
```

Both the results page and marketing landing page start from the existing
Gartner benchmark. The marketing example gets the stronger value anchor from a
larger representative queue: `1,700 * $13.50 = $22,950` for the uploaded
30-day window, then `$279,225` annualized and `$837,675` over three years.

## Intentional

- This PR does not change Stripe pricing, checkout copy, paid unlock behavior, snapshot parsing, or any ATLAS data contract.
- The assisted-contact benchmark remains `$13.50`; the larger numbers come from
  higher representative ticket volume. No run-rate formulas or savings claims
  are invented.
- The larger fixture is still a representative synthetic example, not customer
  data. It is deliberately sized for larger SaaS support teams.
- No faithful full-report artifact demo is added here; #260 already recorded that as a separate future option.

## Deferred

- If operator wants the actual `$1,500` price shown on the public landing page, do that as a separate offer-copy slice so it does not reopen the paid-report-first framing #247 reduced.
- A future paid-report-preview slice can still add a representative `FAQDeflectionReportArtifact` demo if desired.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-cost-projection-share` - PASS; the
  shared projection guard covers the value-anchor hook, the benchmark default,
  the conditional slider-adjusted cost-basis phrase, and the 1,700-repeat
  representative fixture.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - PASS; the
  fixture requires the new `$1,500 full report` value-anchor marker.
- `npm --prefix web run lint -- src/components/landing/DeflectionSupportTaxProjection.tsx src/components/landing/DeflectionSnapshotLandingPage.tsx src/lib/deflection-snapshot.ts scripts/smoke-deflection-snapshot-landing.mjs scripts/test-deflection-cost-projection-share.mjs scripts/test-deflection-snapshot-landing-smoke.mjs` - PASS.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://localhost:3120` - PASS against the local dev server; fetched `/systems/support-ticket-deflection/snapshot` and found the required render markers.
- `agent-browser --args "--no-sandbox" open http://localhost:3120/systems/support-ticket-deflection/snapshot && agent-browser wait --load networkidle && agent-browser eval 'JSON.stringify({hasBenchmarkPhrase: document.body.innerText.includes("At the Gartner benchmark"), hasSelectedPhrase: document.body.innerText.includes("At your selected"), hasAnchor: document.body.innerText.includes("$1,500 full report"), hasAnnual: document.body.innerText.includes("$279,225")})'` - PASS; returned `{"hasBenchmarkPhrase":true,"hasSelectedPhrase":false,"hasAnchor":true,"hasAnnual":true}` at first paint.
- `agent-browser open http://localhost:3120/systems/support-ticket-deflection/snapshot && agent-browser wait --load networkidle && agent-browser snapshot -i` - PASS; rendered the page and showed the Support Tax projection starting at `$13.50` with `$22,950` assisted-contact work.
- `agent-browser get text body` - PASS; extracted the landing text showing `1,700 repeat-ticket hits`, `$13.50 assisted-contact value`, `$22,950` uploaded-window cost, `$279,225` 12-month run-rate, `$837,675` 3-year run-rate, and the `$1,500 full report` value-anchor sentence.
- `agent-browser set viewport 390 844 && agent-browser open http://localhost:3120/systems/support-ticket-deflection/snapshot && agent-browser wait --load networkidle && agent-browser eval 'JSON.stringify({hasAnchor: document.body.innerText.includes("$1,500 full report"), hasBenchmark: document.body.innerText.includes("$13.50"), hasVolume: document.body.innerText.includes("1,700"), hasAnnual: document.body.innerText.includes("$279,225"), hasThreeYear: document.body.innerText.includes("$837,675"), scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth, title: document.title})'` - PASS; returned `{"hasAnchor":true,"hasBenchmark":true,"hasVolume":true,"hasAnnual":true,"hasThreeYear":true,"scrollWidth":375,"innerWidth":390,"title":"Free Deflection Snapshot: Find Repeat Support Tickets to Deflect First"}`.
- `agent-browser errors --clear` - PASS; no page errors were reported.
- `npm --prefix web run build` - PASS; Next build completed, including TypeScript and static page generation.
- `bash scripts/local_pr_review.sh` - PASS; plan audits, drift advisory,
  ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | ~85 LOC |
| Demo fixture volume | ~35 LOC |
| Shared projection value-anchor | ~15 LOC |
| Landing value-anchor copy | ~20 LOC |
| Smoke/test guards | ~25 LOC |
| Total | ~170 LOC |
