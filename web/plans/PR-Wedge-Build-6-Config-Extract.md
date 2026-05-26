# Plan: Build slice 6 — extract the wedge landing config into a shared module

Enabling refactor for the `/partner` page (B7, per D-025). The partner page must
be **identical to the wedge except pricing**; duplicating the ~630-line config
would drift (the "value changed in one place, stale elsewhere" class we just
hardened against in #79). This slice extracts the shared config into one module
both pages import. **No product behavior change — the wedge renders identically.**

## Why this slice exists

- D-025 puts a partner-priced ($1,000) twin of the wedge at
  `/systems/support-ticket-deflection/partner`. It differs from the public page
  **only** in pricing — every other section is the same copy.
- To build it DRY (operator chose "extract shared config"), the wedge's
  `landingPageConfig` (+ its component/data dependencies) must live in a module
  both `page.tsx` and `partner/page.tsx` import. This slice does only the
  extraction; **B7** adds the thin partner page.

## Scope (this PR)

Slice phase: Vertical slice

1. **New `landingConfig.tsx`** (`page.tsx`'s current contents minus the default
   export): all the consts, the artifact components, and the config object —
   with `landingPageConfig` and `pricingTiers` **exported**. Keeps `'use client'`.
2. **Gut `page.tsx`** to a thin wrapper that imports `landingPageConfig` and
   renders `<DiagnosticReportLandingPage config={landingPageConfig} />`.
3. **Imports fixed**: `landingConfig.tsx` imports the two **types** only (not the
   `DiagnosticReportLandingPage` component); `page.tsx` imports the component +
   the config.

### Files touched

- `web/plans/PR-Wedge-Build-6-Config-Extract.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — extracted shared config (new)
- `web/src/app/systems/support-ticket-deflection/page.tsx` — gutted to a thin wrapper importing the shared config

## Mechanism

- The move is byte-for-byte: `landingConfig.tsx` is `page.tsx`'s lines 1–830
  (directive + imports + consts + components + `landingPageConfig`), with
  `export` added to `landingPageConfig` and `pricingTiers`, and the unused
  `DiagnosticReportLandingPage` component dropped from its import (types kept).
- `page.tsx` becomes `'use client'` + two imports + the default export rendering
  the imported config — so the client boundary and the rendered output are
  unchanged.
- `pricingTiers` is exported so **B7** can map the full-report tier to $1,000
  without re-declaring the array.

## Intentional

- **Large diff, but a pure move** — ~630 lines relocate from `page.tsx` to
  `landingConfig.tsx` with no logic change. This is over the 400-LOC soft cap and
  **indivisible** (a config extraction can't be subdivided); justified by D-025 +
  the DRY requirement. `next build` + identical render are the proof it's a no-op.
- **Both files stay `'use client'`** — matches the original (the whole page was a
  client component), so no RSC-boundary behavior change.
- **No copy changes** — every string is identical; this is structure only.

## Deferred

- **B7:** the `/partner` page (imports this config, overrides pricing to $1,000 +
  first-5 design-partner framing, `noindex`).
- Minor: acq-pack "90 days" message templates; hero "self-serve" vs "self-service".

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 3 == 3 + diff-size).
- `npm run lint` / `tsc --noEmit` clean.
- **`npm run build` succeeds** — the real check for a client-module extraction
  (RSC boundaries only surface at build).
- **Render unchanged:** `landingPageConfig` is byte-identical to before (moved +
  exported), so the wedge page output does not change. `git diff` shows the
  page.tsx content moved into landingConfig.tsx, not edited.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `landingConfig.tsx` (new — moved config) | ~829 |
| `page.tsx` (gutted; ~828 removed, ~8 added) | ~830 |
| this plan doc | ~90 |
| **Total** | ~1749 |

**Over the 400-LOC soft cap — justified:** this is a pure move (no logic change)
to enable the DRY `/partner` page (D-025). A config extraction is indivisible;
the alternative (duplicating the config) institutionalizes drift.
