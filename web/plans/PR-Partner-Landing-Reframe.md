## Why this slice exists

The public landing copy now frames the offer as a Resolution Audit, while the design-partner page is intentionally still a Deflection Snapshot / Deflection Report funnel. The partner page needs its own copy layer so it does not inherit public-audit framing or overstate the free Snapshot as always returning a self-service answer.

## Scope (this PR)

Slice phase: Product polish

1. Reframe the partner landing hero and final CTA around the free Deflection Snapshot as a buyer-protection gate for the partner-priced full Deflection Report.
2. Tighten partner pricing and FAQ copy so the free Snapshot promises one review-ready answer only when uploaded tickets contain resolution evidence.
3. Add source-level coverage to keep partner-specific naming and answer-evidence qualifiers from regressing.

### Files touched

- `web/plans/PR-Partner-Landing-Reframe.md` — plan for this partner landing copy slice.
- `web/src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx` — partner-only landing copy overrides.
- `web/scripts/test-deflection-partner-access.mjs` — partner access/copy contract assertions.

## Mechanism

The partner client continues to spread the shared landing page config, then overrides only partner-facing copy fields: hero, final CTA, pricing description, pricing tiers, and partner FAQ replacements. Partner access, token validation, price variant routing, and public Resolution Audit surfaces remain untouched.

The partner test keeps its existing token/access assertions and adds source checks for the partner-only labels and truth-boundary phrases. This catches regressions where the partner page falls back to public Resolution Audit framing or returns to unconditional sample-answer claims.

## Intentional

The partner offer remains named Deflection Snapshot / Deflection Report. This avoids renaming a private design-partner funnel while the public page continues using Resolution Audit language.

This slice does not render-test the whole page. The changed surface is config text consumed by an already-tested shared landing component; the focused regression risk is source-level copy drift in the partner client.

## Deferred

Public Resolution Audit copy, generated email/PDF/result artifact copy, PII/security copy, and partner pricing/access mechanics are outside this slice.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-partner-access` — passed.
- `rg -n "one self-service answer|1 sample self-service answer|See whether your repeat tickets justify a full Deflection Report|Use the Snapshot as the gate|DESIGN PARTNER ACCESS" web/src web/scripts web/plans` — confirmed new partner strings live in the partner client and test; old `one self-service answer` / `1 sample self-service answer` remain only in a historical plan note and the new negative partner test assertions.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~50 |
| Partner landing copy | ~44 |
| Partner access/copy test | ~24 |
| Total | ~118 |
