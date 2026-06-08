# Plan: Deflection public smoke Next payload

## Why this slice exists

The go-live public reachability smoke false-failed against production on June 8,
2026. A direct hosted fetch showed the Support Ticket Deflection landing page
rendered successfully, but the smoke still reported a rendered 404 because its
landing CTA marker was stale and its error-marker scan read dormant Next.js
router payload text as if it were visible page content.

This slice keeps the go-live check useful: the hosted smoke should track the
current public landing copy and fail for real rendered errors without confusing
framework bootstrap payloads for customer-visible failures.

## Scope (this PR)

Ownership lane: deflection/go-live
Slice phase: Production hardening

1. Update the public reachability smoke landing CTA marker to the current
   long-form landing CTA.
2. Limit rendered-error marker checks to rendered HTML text by ignoring
   non-visible script/style/template blocks.
3. Extend the focused smoke tests for dormant Next not-found payloads, stale
   marker classification, and visible not-found failure detection.

### Files touched

- `web/plans/PR-Deflection-Public-Smoke-Next-Payload.md` - this plan doc.
- `web/scripts/smoke-deflection-public-reachability.mjs` - hosted smoke
  marker and rendered-error detection.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` - focused smoke
  fixtures.

### Review Contract

Acceptance criteria:
- The landing marker expects `Get the free Snapshot first`, matching the current
  deployed long-form Support Ticket Deflection page.
- Dormant `This page could not be found` strings inside script/template/style
  payloads do not turn a missing-marker failure into a false rendered-404
  failure.
- A visible page body containing `This page could not be found` still fails as a
  rendered error marker.
- The smoke remains public GET-only and does not submit a CSV or trigger a paid
  action.

Affected surfaces:
- Hosted Support Ticket Deflection public reachability smoke.
- The smoke's synthetic fixture tests.

Risk areas:
- Over-stripping could hide a real rendered error.
- Stale landing-copy markers could make the go-live lane fail despite a healthy
  page.

Triggered reviewer rules:
- R1 Requirements match.
- R2 Test evidence.
- R7 UI/copy truthfulness.
- R11 Scope control.

## Mechanism

The smoke keeps the same two public GET checks:

```bash
npm --prefix web run smoke:deflection-public-reachability -- --base-url https://juancanfield.com --json
```

The landing marker changes from the retired upload CTA to the live `Get the free
Snapshot first` CTA. When required render markers are missing, the error-marker
scan runs against a copy of the HTML with non-rendered `<script>`, `<style>`,
`<template>`, and `<noscript>` blocks removed. A true visible 404 body still
contains the marker and fails closed as a rendered error.

## Intentional

- The smoke still checks the intake href separately because the long-form page
  links both to the Snapshot and to CSV intake.
- This does not change page copy or routing. It only updates the go-live
  verifier to match the deployed page.
- This does not broaden to the snapshot or hosted-results smokes; the production
  failure was isolated to the public reachability smoke.
- The partner landing keeps `Upload your tickets, get a free Deflection
  Snapshot`; that route is not the public root landing this smoke verifies.

## Deferred

- Broader smoke parsing with a DOM implementation remains out of scope until
  the repository already has a DOM test dependency.
- Browser click-through remains covered by the browser-upload validation lane,
  not this public GET smoke.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-public-reachability-smoke` - passed.
- `npm --prefix web run smoke:deflection-public-reachability -- --base-url https://juancanfield.com --json --output /tmp/deflection-public-reachability-go-live.json` -
  passed; production returned `ok: true` with landing, intake, and intake-href
  markers present.
- `npm --prefix web run check:dead-code` - passed; Knip baseline still matches
  16 known findings.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run build` - passed; compiled successfully, TypeScript
  finished, generated `44/44` static pages, and copied the deterministic routes
  manifest.
- `rg -n "Upload your tickets, get a free Deflection Snapshot|Get the free Snapshot first|This page could not be found" web/scripts web/src` -
  passed; the root landing smoke now matches `Get the free Snapshot first`, and
  the retired upload CTA remains only on the separate partner landing.
- `git diff --check` - passed.
- `bash scripts/local_pr_review.sh` - passed; plan shape, files touched,
  diff-size, drift advisory, dead-code baseline, ESLint, Next build, and
  whitespace checks passed.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | +125 |
| Smoke script | +10 / -2 |
| Focused tests | +25 / -1 |
| Total | ~163 changed |
