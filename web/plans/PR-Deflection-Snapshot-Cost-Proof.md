# PR-Deflection-Snapshot-Cost-Proof

## Why this slice exists

Issue #197 says the shorter snapshot landing page should lead with the
before-ticket to drafted-answer proof, then use the calculator/cost math as
support. The current page now leads with that proof, but the next section jumps
straight into the artifact shape. It does not answer the buyer question that
comment raised: after I believe the answer quality, how big is the repeat-ticket
cost compared with the paid report?

This slice adds a compact cost-proof band immediately after the first-screen
answer proof. It keeps the page selling one thing, the free Deflection Snapshot,
while making the paid-report comparison factual and bounded.

## Scope (this PR)

Slice phase: Product polish

1. Derive simple support-tax stats from the existing demo snapshot summary.
2. Add a landing-page band after the hero proof that shows uploaded-window
   cost, annualized pace, and the $1,500 full-report anchor.
3. Keep the math framed as an estimate, not a guarantee or a new product
   contract.
4. Preserve the existing route, CTA destination, snapshot artifact, checkout
   boundary, and shared snapshot fixture.

### Files touched

- `web/plans/PR-Deflection-Snapshot-Cost-Proof.md`
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`

## Mechanism

`DeflectionSnapshotLandingPage` already receives
`DEMO_DEFLECTION_SNAPSHOT`. A new helper reads only the summary fields already
used by the page:

```ts
const ASSISTED_CONTACT_BENCHMARK = 13.5;
const FULL_REPORT_PRICE = 1500;
```

It multiplies `summary.repeat_ticket_count` by the assisted-contact benchmark
for the uploaded-window estimate, then normalizes that estimate by
`summary.source_window_days` for an annual pace. The rendered section sits
after `HeroProofPanel`, so the proof order remains answer quality first and
cost math second.

## Intentional

- No new snapshot fields, API calls, checkout logic, or shared fixture edits.
  The cost proof is presentation-only and derives from existing demo data.
- The copy says "estimate" and "pace" because the math is a framing aid, not a
  revenue guarantee.
- The section does not replace the existing artifact view; it bridges the first
  proof into the value comparison that issue #197 asked to move after the
  sample answer.

## Deferred

- A fully interactive calculator remains out of scope for this slice. The issue
  comment asked for calculator/cost support after the answer sample; this slice
  adds the static cost-proof anchor first.
- Live per-upload cost proof remains a future ATLAS/portfolio integration slice
  once the hosted snapshot endpoint is wired into this page.
- Parked hardening: none.

## Verification

Ran before push:

- `npm --prefix web run lint` - passed
- `npm --prefix web run build` - passed; `/systems/support-ticket-deflection/snapshot` remains static
- `rg -n "ASSISTED_CONTACT_BENCHMARK|FULL_REPORT_PRICE|After the answer proof|Uploaded-window cost|Annualized pace|Full report unlock|The free Snapshot earns" web/src/components/landing/DeflectionSnapshotLandingPage.tsx web/plans/PR-Deflection-Snapshot-Cost-Proof.md -S` - constants and cost-proof labels present
- Dev-server browser check at `http://127.0.0.1:3100/systems/support-ticket-deflection/snapshot` with `agent-browser` at 1440x1200 and 390x844 - passed; page had content, no Next.js error overlay, no horizontal overflow, and rendered the cost-proof heading plus `$13.50`, `$2,295`, `$27,923`, and `$1,500`
- `bash scripts/local_pr_review.sh` - passed

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~75 |
| Cost-proof helpers | ~20 |
| Landing-page section | ~90 |
| **Total** | **~185** |
