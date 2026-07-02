# PR-Support-Tax-Math-Extraction

## Why this slice exists

Issue #480 turns the two ticket-cost calculators into channel-specific landing
pages for LinkedIn and Reddit traffic. The arc starts by making the calculator
math trustworthy: today the arithmetic lives inline in three client components
(`SupportTaxCalculator`, `ThirtySecondCalculator`, `SupportTaxMiniCalculator`)
and no test in the suite asserts any of it — existing coverage is
source-string guards only. Later slices add editable assumptions, shareable
URL state, and OG-card headline numbers that all derive from this math, so it
must be extracted into a pure module and pinned by unit tests before the
landing-page copy starts quoting it.

The estimate lands slightly over the 400 LOC soft cap (~464); ~150 of that is
this plan doc and ~115 is the new test suite. The product-code diff is ~180
LOC across the module and three mechanical component rewires, and splitting
the extraction from its tests would ship unverified math — the thing this
slice exists to prevent.

## Scope (this PR)

Slice phase: Functional validation

1. Extract the calculator arithmetic into a pure `support-tax-math` lib:
   the quick two-input model (volume x repeat share x cost per ticket) with
   repeat share and touch hours as parameters (defaults 0.4 / 0.2), the
   leaky-bucket model (context leak + attrition tax + self-service
   opportunity), and the shared round-to-step clamp used by every slider
   commit handler.
2. Wire all three calculator components to the lib. Behavior-identical: same
   defaults, same rendered numbers, same copy.
3. Add a vitest suite pinning worked examples at the shipped defaults and the
   edge cases (self-service delta floored at zero, zero attrition, clamp
   rounding at range bounds), and pinning the $11.66 assisted-contact delta
   the leaky bucket consumes from `deflection-pricing`.
4. Enroll the new suite in `web/package.json` and the pre-push audit workflow.
5. Park the two math-model findings from #480 (partial double-count between
   context leak and self-service opportunity; three inconsistent cost bases
   across calculator surfaces) as `HARDENING.md` correctness entries —
   changing a live page's headline number is a product decision, not a
   refactor side effect.

### Files touched

- `web/src/lib/support-tax-math.ts` — new pure math module.
- `web/src/lib/support-tax-math.test.ts` — new arithmetic suite.
- `web/src/components/deflection-demo/SupportTaxCalculator.tsx` — consume the lib.
- `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` — consume the lib.
- `web/src/components/deflection-demo/SupportTaxMiniCalculator.tsx` — consume the lib.
- `web/package.json` — enroll `test:support-tax-math`.
- `.github/workflows/pre_push_audit.yml` — enroll `test:support-tax-math`.
- `HARDENING.md` — park the two math-model findings.
- `web/plans/PR-Support-Tax-Math-Extraction.md` — document the slice.

## Mechanism

`web/src/lib/support-tax-math.ts` exports two pure functions and the shared
slider clamp:

- `computeQuickSupportTax({ monthlyTickets, costPerTicket, repeatShare?,
  touchHoursPerTicket? })` returns `{ monthlyRepeatVolume, monthlyTax,
  annualTax, monthlyHours }`. Repeat share and touch hours default to the
  current hardcoded 0.4 / 0.2 so this slice changes nothing, while the Reddit
  lander slice can pass user-adjusted values with no math change.
- `computeLeakyBucketLeak({ monthlyTickets, agents, salary, repeatPct,
  attritionPct, currentSelfServicePct, targetSelfServicePct })` returns every
  intermediate the component renders plus `totalVisibleLeak`. It imports
  `DEFLECTION_ASSISTED_CONTACT_DELTA_USD` from `@/lib/deflection-pricing`
  (moved out of the component), keeps the 2080 annual work hours divisor
  private, and floors the self-service delta at zero.
- `clampToStep(value, { min, max, step })` replaces the identical
  `clamp(Math.round(n / step) * step, min, max)` expression duplicated in all
  three components' number-input commit handlers.

Constants the components render in copy (`CONTEXT_MINUTES_PER_REPEAT`,
`REPLACEMENT_COST`, `BURNOUT_TURNOVER_SHARE`, `QUICK_REPEAT_SHARE`) are
exported; purely internal constants stay private so the knip zero-baseline
stays clean. Components keep their input range definitions and `usd`/`count`
formatters — those are presentation, not model.

The test suite pins golden values computed by hand from the shipped defaults
(quick: $9,000/mo, $108,000/yr, 120 h/mo; leaky bucket: context leak
~$100,961.54 + attrition $112,700 + self-service opportunity $54,568.80 =
~$268,230.34 total) so any future change to the model or its pricing inputs
fails a test instead of silently changing a live headline number.

## Intentional

- Behavior-identical refactor: no rendered number, default, range, or copy
  string changes. `test:deflection-public-reachability-smoke` (which reads
  these components' source for guarded CTA strings) must still pass.
- The two math-model findings are parked in `HARDENING.md`, not fixed:
  correcting the double-count or unifying cost bases changes the headline
  number on a live conversion page — that is a product decision for a
  follow-up slice, now cheap to make because the formulas are pinned by tests.
- Golden values in the test are hardcoded (not re-derived from the same
  formula) on purpose — re-deriving would make the test tautological.
- `usd` / `count` formatting helpers stay duplicated in the components; they
  are presentation and out of scope for a math slice.
- The assumption-card copy strings that describe the quick-model constants
  stay hardcoded as prose: `40%` / `12 min` / `0.2 support hours` in
  `ThirtySecondCalculator.tsx` (lines 178-179) and
  `SupportTaxMiniCalculator.tsx` (lines 172-173, 229). They are rendered
  descriptions, not math inputs; the Reddit-lander slice replaces the
  quick-calculator assumption cards with editable sliders driven by the
  extracted parameters, which retires most of these strings.
- The `DEFLECTION_ASSISTED_CONTACT_DELTA_USD === 11.66` pin is asserted in the
  suite so a pricing-constant change surfaces as a calculator-math failure,
  not just a pricing-page change.

## Deferred

- Editable assumptions, URL share state, and formula display on the Reddit
  lander — next slice (`PR-Support-Tax-Reddit-Lander`).
- Progressive disclosure and the email micro-conversion on the LinkedIn
  lander — `PR-Leaky-Bucket-LinkedIn-Lander`.
- Per-route OG images and calculator analytics events —
  `PR-Calculator-Channel-Plumbing`.
- Resolving the leaky-bucket double-count and unifying the three cost bases —
  parked; see HARDENING.md entries below.

Parked hardening: SUPPORT-TAX-MATH-1 — leaky-bucket context leak and
self-service opportunity double-count agent time for the deflected share;
SUPPORT-TAX-MATH-2 — three inconsistent repeat-ticket cost bases across
calculator surfaces.

## Verification

- `npm --prefix web run test:support-tax-math` — new suite passes.
- `npm --prefix web run test:deflection-public-reachability-smoke` — guarded
  CTA strings intact after the component edits.
- `npm --prefix web run test:test-enrollment-audit` — new suite enrolled in
  both `package.json` and the workflow.
- `npm --prefix web run test:dead-code-baseline` — no new knip findings from
  the new module's exports.
- `npm --prefix web run lint` — clean.
- `rg -n "2080|46000|REPEAT_SHARE = 0\.4|TOUCH_HOURS = 0\.2|AVERAGE_TOUCH_HOURS|REPEAT_TICKET_PERCENTAGE|BURNOUT_TURNOVER_SHARE = |CONTEXT_MINUTES_PER_REPEAT = |REPLACEMENT_COST = |ANNUAL_WORK_HOURS" web/src/components/deflection-demo/` —
  no stale copies of the extracted constant definitions remain in the
  components. The only remaining matches for the underlying values are the
  five assumption-card prose strings (`40%` / `12 min` / `0.2 support
  hours`) named in Intentional above.
- `bash scripts/local_pr_review.sh` — full local gate (plan audits, drift,
  dead code, snapshot landing smoke, ESLint, Next build, `git diff --check`).

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/src/lib/support-tax-math.ts` | ~95 |
| `web/src/lib/support-tax-math.test.ts` | ~115 |
| `web/src/components/deflection-demo/SupportTaxCalculator.tsx` | ~35 |
| `web/src/components/deflection-demo/ThirtySecondCalculator.tsx` | ~25 |
| `web/src/components/deflection-demo/SupportTaxMiniCalculator.tsx` | ~20 |
| `web/package.json` | ~1 |
| `.github/workflows/pre_push_audit.yml` | ~3 |
| `HARDENING.md` | ~20 |
| `web/plans/PR-Support-Tax-Math-Extraction.md` | ~150 |
| Total | ~464 |
