# Plan: Deflection risk reversal copy

## Why this slice exists

The offer section now states the artifact clearly, so the next section should reduce buyer risk in equally plain language. The current "WHY THIS IS SAFE" copy is directionally right, but the operator supplied a sharper version that leads with control, verifiability, no hidden costs, and a simple workflow.

## Scope (this PR)

Slice phase: Product polish

1. Rewrite the `WHY THIS IS SAFE` list items using the operator-supplied framing.
2. Retitle the "What you are not buying" panel to "What you're not buying" to match the operator-supplied voice.
3. Leave section placement, layout, pricing, FAQ, CTA, intake flow, and surrounding sections unchanged.

### Files touched

- `web/plans/PR-Deflection-Risk-Reversal-Copy.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — risk-reversal copy only.

## Mechanism

Update only `landingPageConfigV2.riskReversal` in the support-ticket-deflection landing config. The existing `CopyBlock`, `SectionList`, and callout panel remain in place; only the list-item copy and panel label change.

## Intentional

The copy continues to say the system does not publish, touch the help center, or talk to customers. That keeps the buyer-safety claim concrete and narrow.

The "not buying" panel body stays as prose rather than a nested list because the existing component already matches the operator-supplied wording and presents it as a short explanatory callout.

No new privacy, security, deletion, or PII-handling claim is introduced.

## Deferred

Pricing, FAQ, CTA, intake, and privacy/storage copy remain out of scope.

The parked `DEFLECTION-INTAKE-PII-1` hardening item was considered because the copy mentions safety, but this slice does not change intake behavior or add new privacy claims.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "Nothing goes live without you|There is no per-resolution pricing|The workflow is short|What you are not buying|You control everything|No hidden costs or surprises|Simple workflow|What you&rsquo;re not buying" web/src web/plans` — confirmed the old risk-reversal section strings are gone from `riskReversal`; one separate comparison-table instance of "Nothing goes live without you" remains intentionally outside this slice.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` on the existing local dev server — desktop and 390px mobile views render the risk-reversal section cleanly; `agent-browser errors` returned no page errors.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~54 |
| Landing config copy | ~8 |
| Total | ~62 |
