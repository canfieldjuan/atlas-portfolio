## Why this slice exists

Issue #198 tracks verified removal of legacy paths after the production
deflection funnel settles. The current long page renders
`landingPageConfigV2`; the partner page also composes from
`landingPageConfigV2`. The older exported `landingPageConfig` in
`landingConfig.tsx` is no longer imported by any production route, but it still
keeps a large retired hero/sample/demo artifact in the active source tree.

This slice trims that verified-dead v1 artifact while preserving the shared
pricing and FAQ exports that `landingConfig-v2.tsx` and the partner page still
use. The diff exceeds the 400 LOC soft cap because the dead artifact is one
contiguous legacy config block; splitting it would leave intentionally-dead
half-artifacts behind and make the verification less clear.

## Scope (this PR)

Slice phase: Production hardening
Ownership lane: ai-content-ops/faq-support-ticket-deflection

1. Remove the unused `landingPageConfig` export from the legacy
   `landingConfig.tsx` module.
2. Remove only the v1-only JSX/data helpers that fed that retired export.
3. Keep `GAP_REPORT_INTAKE_HREF`, `pricingTiers`, and `pricingFaqs` intact
   because those are still the shared canonical values for v2 and partner.
4. Verify there are no remaining `landingPageConfig` references outside the
   plan history, and that the active long page still builds through v2.

### Files touched

- `web/plans/PR-Deflection-Legacy-V1-Config-Trim.md`
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx`

## Mechanism

`landingConfig.tsx` becomes a small shared-data module for the still-used intake
href, pricing tiers, and FAQ list. The deleted code is the old page artifact:
v1 structured data, hero/sample JSX, term-map/sample data, shared CTA, and the
retired `landingPageConfig` object.

The active routes remain unchanged:

```tsx
// /systems/support-ticket-deflection
<DeflectionLandingPage config={landingPageConfigV2} bare />

// /systems/support-ticket-deflection/partner
{ ...landingPageConfigV2, pricing: { ...landingPageConfigV2.pricing, tiers } }
```

## Intentional

- No changes to `landingConfig-v2.tsx`; PR #222 is already touching that surface.
- No changes to pricing or FAQ copy. This slice only removes the retired v1
  artifact around the shared values.
- The file remains `landingConfig.tsx` rather than being renamed to `.ts` to
  avoid import churn in this cleanup slice.

## Deferred

- #198 still tracks unrelated cleanup candidates: legacy Stripe fallback,
  legacy Blob token fallback, calculator redundancy, and the gated
  `portfolio-ui/` investigation.
- Whether to retire the old long page entirely, A/B test the short Snapshot
  page, or make the Snapshot page canonical remains out of scope and is
  currently represented by #197/#222.

Parked hardening: none.

## Verification

- `! rg -n "\blandingPageConfig\b" web/src -S` — passed; no active source imports or references the retired export.
- `rg -n "GAP_REPORT_INTAKE_HREF|pricingTiers|pricingFaqs" web/src/app/systems/support-ticket-deflection -S` — passed; remaining references are the shared exports plus expected v2/partner imports.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed.
- `bash scripts/local_pr_review.sh` — pending.

## Estimated diff size

| File | Estimated LOC |
| --- | ---: |
| `web/plans/PR-Deflection-Legacy-V1-Config-Trim.md` | +73 |
| `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` | -671 |
| Total | ~744 changed |
