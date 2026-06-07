## Why this slice exists

Issue #275 asks for a copy pass on the Deflection Snapshot landing page so
headlines and support text sound like buyer-facing support-leader language
instead of internal product wording. The same pass also removes visible ATLAS
engine branding from buyer-facing Snapshot copy and keeps monitored Snapshot
landing smoke markers aligned with the rewritten value anchor.

## Scope (this PR)

Slice phase: Product polish

1. Rewrite the targeted Snapshot landing section headline, section subtext,
   proof card body, proof heading, final CTA headline, and final CTA subtext
   from issue #275.
2. Rewrite the landing-only value anchor to frame the full report as a one-time
   cost against recurring repeat-question spend.
3. Update the shared Support Tax projection heading and ATLAS-branded support
   copy so the landing and real results page no longer surface ATLAS as the
   buyer-facing product name.
4. Keep claims bounded: no savings guarantees, no SEO ranking/traffic promises,
   and no monitored CTA or CSV-upload marker drift.
5. Update the Snapshot landing smoke marker and fixture for the new value-anchor
   sentence.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Copy-Pass.md` - plan for this copy slice.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - targeted
  Snapshot landing copy updates.
- `web/src/components/landing/DeflectionSupportTaxProjection.tsx` - shared
  Support Tax projection wording and ATLAS-branding sweep.
- `web/src/components/landing/DeflectionResultsPage.tsx` - results-page SEO
  claim wording sweep.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` - monitored value-anchor
  marker update.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - mocked smoke
  fixture update for the same marker.

## Mechanism

The landing copy changes are direct string replacements in the existing
Snapshot landing component. The value anchor keeps the existing conditional
cost-basis lead-in and pricing constants, but rewrites the sentences after the
computed annual and three-year totals.

The shared Support Tax projection template switches from "size up to" wording
to "add up to about" cost wording, and replaces ATLAS references with Snapshot
language. The results page keeps its existing no-keyword-volume/no-ranking/no-
traffic boundary, but changes the subject from ATLAS to "We" to match the rest
of the customer-facing page voice.

The smoke script keeps the same marker shape and only replaces the old
`$1,500 full report is meant to be judged against that recurring backlog`
substring with the price-independent `one-time cost against that recurring
bill` substring. The mocked fixture uses the same substring so the source-level
test and live smoke remain aligned.

## Intentional

- This is copy-only. No layout, pricing, support-tax math, checkout, API, or
  Snapshot artifact behavior changes are included.
- The shared Support Tax copy intentionally affects both the landing sample and
  real results page because issue #275 calls out the shared component impact as
  an improvement on both surfaces.
- The final CTA keeps `The only ask on this page is the CSV upload` and
  `Get my free Deflection Snapshot` unchanged as monitored smoke substrings.
- The value anchor keeps "about" and the projection disclaimer still states the
  estimate is not a savings guarantee.

## Deferred

- Broader landing-page messaging, design, and SEO strategy are not included.
- No new buyer-facing claim about actual savings, deflection lift, keyword
  volume, ranking, or traffic is added.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-snapshot-landing-smoke` - PASS;
  printed `Deflection Snapshot landing smoke tests passed.`
- `npm --prefix web run lint -- src/components/landing/DeflectionSnapshotLandingPage.tsx src/components/landing/DeflectionSupportTaxProjection.tsx src/components/landing/DeflectionResultsPage.tsx scripts/smoke-deflection-snapshot-landing.mjs scripts/test-deflection-snapshot-landing-smoke.mjs`
  - PASS; no ESLint diagnostics.
- `rg -n "The Snapshot is the artifact|The panel below shows the offer shape|This representative Snapshot's repeat tickets|size up to .*assisted-contact work|ATLAS counted|source window ATLAS returned|ATLAS finds|ATLAS does not claim keyword volume|this larger representative queue projects|full report is meant to be judged|Built for a narrow support decision|The Snapshot ranks the repeat questions and phrases|Start with the free Snapshot" web/src web/scripts`
  - PASS; no stale issue #275 strings remain in source or smoke scripts.
- `rg -n "\bATLAS\b" web/src` - PASS; remaining hits are comments or unrelated
  ATLAS product pages, not buyer-facing Deflection Snapshot copy.
- `rg -n "one-time cost against that recurring bill|The only ask on this page is the CSV upload|Get my free Deflection Snapshot|Every month, the same repeat questions bill you again|We make no claims about keyword volume" web/src web/scripts`
  - PASS; confirmed the new value-anchor marker, preserved monitored CTA/CSV
  substrings, final CTA headline, and results SEO claim boundary.
- `bash scripts/local_pr_review.sh` - PASS; plan shape/files/diff-size, drift
  advisory, ESLint, Next build, and `git diff --check` passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | +103 |
| Snapshot landing copy | +18 / -17 |
| Support Tax and results copy | +4 / -4 |
| Smoke marker fixtures | +2 / -2 |
| Total | ~150 changed |
