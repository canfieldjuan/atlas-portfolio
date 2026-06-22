## Why this slice exists

Issue #289 flags that the paid report shows opportunity scores as bare numbers, so a buyer cannot tell whether a score is a dollar amount, percentage, confidence value, or ranking signal. The report should define the score before or at the point where the number appears.

## Scope (this PR)

Slice phase: Product polish

1. Add a concise, claims-safe opportunity-score definition to the legacy paid artifact primer.
2. Add the same definition to the current structured report model's ranked-question section.
3. Extend the existing paid-report source tests so the score remains framed as a relative ranking signal, not a savings or percentage claim.

### Files touched

- `web/plans/PR-Opportunity-Score-Explanation.md` — plan for this score-explanation slice.
- `web/src/components/landing/DeflectionReportArtifactPage.tsx` — legacy paid artifact opportunity-score explanation.
- `web/src/components/landing/DeflectionReportModelPage.tsx` — structured report ranked-question opportunity-score explanation.
- `web/scripts/test-deflection-paid-unlock-smoke.mjs` — source assertion for the legacy paid artifact explanation.
- `web/scripts/test-deflection-report-model-result-page.mjs` — source assertion for the structured report explanation.

## Mechanism

The UI copy defines opportunity score as a relative ranking signal: repeat volume weighted by failure-risk signals. It explicitly says the score is not a dollar figure or percentage. The copy is placed next to the legacy primer metric and above the structured ranked-questions table where the `opportunity_score` column appears.

The existing paid-report source tests now assert the phrase `relative ranking signal` appears in both renderers. The legacy test also guards that the old page states `not a dollar figure or percentage`; the model-page test guards the same phrase in the current renderer.

## Intentional

This does not change score computation, field names, ranking order, or ATLAS output. It is explanatory copy only.

The copy stays short and deliberately avoids guaranteed savings, resolution lift, or ranking outcome claims.

## Deferred

If ATLAS-generated Markdown needs a score legend inside the raw export itself, that belongs in an ATLAS follow-up because the score originates in the generator.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-paid-unlock-smoke` — passed.
- `npm --prefix web run test:deflection-report-model-result-page` — passed.
- `rg -n "Top opportunity score|Ranked question opportunities|Opportunity is a relative ranking signal|Relative ranking signal|not a dollar figure or percentage|opportunity score" web/src/components/landing web/scripts web/plans` — confirmed the active paid renderers now pair opportunity-score labels with the relative-ranking explanation; older matches are historical plan notes or smoke markers.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~51 |
| Paid artifact copy | ~4 |
| Report model copy | ~4 |
| Tests | ~10 |
| Total | ~69 |
