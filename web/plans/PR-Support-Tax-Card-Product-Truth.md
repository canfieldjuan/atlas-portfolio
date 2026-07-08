# PR-Support-Tax-Card-Product-Truth

## Why this slice exists

The Reddit lander `/systems/support-ticket-deflection/support-tax` ends on a
"Why is this happening?" card that frames the product as an SEO / help-center
wording fixer ("your help center speaks your product's language… the FAQ
doesn't use the words customers reach for") and drives a "Start Your Forensic
Audit" CTA. That framing is stale: the Resolution Audit is a ranked,
source-backed action queue across cost exposure, resolution evidence, drafted
answers, unresolved gaps, and owner-routed root-cause fixes — not a keyword
tool. The operator asked to remove the CTA and rewrite the card text to the
product's real core purpose per the current product-truth brief.

## Scope (this PR)

Slice phase: Product polish

1. Remove the `Start Your Forensic Audit` CTA (`<Link>` to intake and its
   `trackCalculatorCtaClicked` onClick) from the `/support-tax` calculator,
   dropping the imports that orphans.
2. Rewrite the card heading and body from the SEO/help-center-wording framing
   to the Resolution Audit's core purpose, using only the product-truth
   language boundaries. Keep the accurate deterministic-parsing disclaimer.

### Files touched

- `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` — remove CTA + orphaned imports, rewrite the card copy.
- `HARDENING.md` — park the SEO framing that remains on the other calculator surfaces.
- `web/plans/PR-Support-Tax-Card-Product-Truth.md` — document the slice.

## Mechanism

`ThirtySecondCalculator` is the only component mounted on `/support-tax`. The
CTA `<Link>` and its `trackCalculatorCtaClicked({ calculator: 'thirty_second',
cta: 'intake' })` handler are deleted; `Link`, `ArrowRight`, and
`trackCalculatorCtaClicked` are removed from the imports (they had no other use
in the file). `trackCalculatorEngaged` (slider engagement) and `ChevronDown`
(assumptions expander) stay.

The card heading becomes "Resolved is not the same as fixed." and the body is
replaced with copy grounded in the product-truth brief: repeat tickets cost
across agent time, tooling/AI-session spend, overages, and frustration, but a
closed/"resolved" ticket doesn't prove the root cause was fixed; the Resolution
Audit turns the export into a ranked, source-backed action queue with estimated
cost exposure, review-ready answers where evidence exists, no-proven-answer
gaps, and repeats routed to product/billing/policy/onboarding for review. The
existing deterministic-parsing disclaimer is accurate ("No LLM or Generative
models", deterministic clustering) and is kept.

## Intentional

- The CTA is removed with no replacement: this is the Reddit lander, and the
  operator wants no hard-sell escape hatch here. The page now ends on the cost
  breakdown and the reframed explanation.
- Copy uses only the brief's allowed language (estimated cost exposure,
  review-ready, no proven answer, resolved != fixed, source-backed action
  queue, route for review) and none of the "Avoid" phrases (no guaranteed
  savings, no fixed deflection percentage, no owner-blame certainty) or
  "Deflection Snapshot"-era strings.
- `trackCalculatorCtaClicked` stays exported and is still used by the
  leaky-bucket calculator and its analytics unit test, so its removal here is
  local — no dead-code (knip) or analytics-test change.
- The reachability smoke asserts `Start Your Forensic Audit` against the
  combined source of all three calculators; the leaky-bucket and mini
  calculators still carry it, so removing it from this one is guard-safe.

## Deferred

- The same SEO "Why is this happening?" framing on `SupportTaxMiniCalculator`
  (landing-page teaser) and the leaky-bucket "What to do with this number"
  card were considered and left as-is: those surfaces intentionally keep their
  CTAs and are outside the requested Reddit-page scope. Parked as
  `SUPPORT-TAX-SEO-FRAMING-1`.

Parked hardening: SUPPORT-TAX-SEO-FRAMING-1

## Verification

- `npm --prefix web run test:deflection-public-reachability-smoke` — combined
  `Start Your Forensic Audit` assertion still passes; no banned wording added.
- `npm --prefix web run test:support-tax-share-state` — URL state untouched.
- `npm --prefix web run test:support-tax-math` — math untouched.
- `npm --prefix web run test:deflection-ga-path-redaction` — analytics
  wrappers untouched (`trackCalculatorCtaClicked` still present/tested).
- `npm --prefix web run lint` — clean; the removed button leaves no unused
  imports.
- `npm --prefix web run check:dead-code` — knip baseline unchanged.
- `rg -n "Start Your Forensic Audit|<Link|ArrowRight|trackCalculatorCtaClicked" web/src/components/deflection-demo/ThirtySecondCalculator.tsx` —
  no matches; all four are gone from this file.
- `bash scripts/local_pr_review.sh` — full local gate including the Next build.
- Manual: `/support-tax` renders the reframed card with no CTA button.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` | ~20 |
| `HARDENING.md` | ~10 |
| `web/plans/PR-Support-Tax-Card-Product-Truth.md` | ~95 |
| Total | ~125 |
