# Plan: Reconcile the reference calculator with Gartner costs

## Why this slice exists

PR #144 reconciled the live `SupportTaxCalculator` to the landing page's Gartner
benchmark: `$13.50` assisted contact cost versus `$1.84` self-service cost, a
`$11.66` spread. Review noted that the non-build reference artifact
`SEO-Ticket-Deflection-Template-Docs/leaky-bucket-calculator.html` still carried
the older `$22 / $0` marginal model. It is not user-facing, but it should not
remain a maintained reference that contradicts the live surface.

## Scope (this PR)

Slice phase: Product polish

1. Update the standalone reference calculator's default customer-support cost
   assumptions to Gartner `$13.50 / $1.84`.
2. Update the related customer-support tooltip copy so the defaults are
   explained as the Gartner benchmark.
3. Update the built-in customer-support verification fixture and expected
   reclaimable budget to match the reconciled constants.
4. Leave the internal-knowledge preset's separate `humanTicketCost: 35` /
   `selfServeTicketCost: 0` assumptions unchanged because that mode models
   interrupted internal experts, not customer-service contact costs.

### Files touched

- `web/plans/PR-Reference-Calculator-Gartner-Costs.md` — this plan doc.
- `SEO-Ticket-Deflection-Template-Docs/leaky-bucket-calculator.html` — default cost assumptions, tooltip copy, and verification fixture.

## Mechanism

The reference calculator has one math engine. Its `DEFAULT_ASSUMPTIONS` feed the
public SaaS/ecommerce modes, while `PRESET_ASSUMPTIONS.internal` overrides the
cost model for internal interruptions. This slice changes only the default
customer-support cost constants and the default-mode verification fixture. The
expected reclaimable budget is recalculated from the same formula:

`monthlyTickets * repetitiveRate * 12 * (targetSelfService - currentSelfService) * (13.50 - 1.84)`.

## Intentional

- The reference file remains a standalone artifact, not a build input.
- The internal preset keeps its own economics because the labels explicitly
  describe human-answered internal questions and near-zero doc self-service.
- The live React calculator is not touched; PR #144 already reconciled it.

## Deferred

- Any broader rewrite of the standalone HTML calculator or its source-note
  language.
- Removing or deprecating the standalone reference artifact.
- Parked hardening: none

## Verification

- `rg -n "humanTicketCost: 22|selfServeTicketCost: 0|Default <code>\$22|~<code>\$0|reclaimableBudget: 544320\.00|humanTicketCost: 13\.5|selfServeTicketCost: 1\.84|reclaimableBudget: 302227\.20" SEO-Ticket-Deflection-Template-Docs/leaky-bucket-calculator.html` — confirmed the customer-support default and verification fixture use Gartner `$13.50 / $1.84`; remaining `selfServeTicketCost: 0` entries are only the intentionally unchanged internal-knowledge preset/test.
- `node -e "const monthlyTickets=10000,repetitiveRatePct=60,currentSelfServicePct=14,targetAIDeflectionPct=50,humanTicketCost=13.5,selfServeTicketCost=1.84; const monthlyRepeatTickets=monthlyTickets*(repetitiveRatePct/100); const reclaimableBudget=monthlyRepeatTickets*12*((targetAIDeflectionPct-currentSelfServicePct)/100)*(humanTicketCost-selfServeTicketCost); console.log(reclaimableBudget.toFixed(2));"` — printed `302227.20`, matching the updated fixture.
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~65 |
| Reference calculator constants/tooltips/test fixture | ~12 |
| Total | ~77 |

Well under the 400-LOC soft cap.
