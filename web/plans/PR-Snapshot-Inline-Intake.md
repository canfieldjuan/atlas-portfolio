## Why this slice exists

The Deflection Snapshot page still makes users click through to a separate intake route before they can upload a CSV. That extra step weakens the Snapshot page's conversion path. This slice moves the existing CSV intake experience into the Snapshot hero while preserving the working deflection submit flow and the CSV-security fixes from PR 316.

## Scope (this PR)

Slice phase: Product polish

1. Extract the reusable intake form from `SupportTicketCsvIntakePage` into `SupportTicketCsvIntakeForm` so the dedicated intake route and Snapshot landing page share one upload implementation.
2. Render the form directly in the Snapshot landing hero with the existing `support-ticket-deflection-intake` source offer so successful submissions still trigger the ATLAS deflection submit/fetch path and results redirect.
3. Fold the existing upload trust/privacy messaging into the form area and remove the separate hero trust block from the Snapshot landing page.
4. Update the Snapshot landing smoke markers/tests for the inline intake and the Resolution Report framing.
5. Keep the Snapshot/result data contract unchanged in this slice; blind-spot rows and result-schema changes are deferred.

### Files touched

- `web/plans/PR-Snapshot-Inline-Intake.md` - plan contract for this slice.
- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` - reusable CSV intake form with PR 316 scrub/fail-closed behavior.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` - dedicated route wrapper that reuses the shared form and keeps the add-on panel.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - inline the shared form in the hero and update page copy.
- `web/scripts/test-deflection-csv-privacy-contract.mjs` - update the CSV privacy contract to inspect the extracted form.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` - update required markers for the inline Snapshot form.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - update static source and smoke-fixture expectations.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - update intake source-contract checks to inspect the extracted form.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` - update public intake source checks to inspect the extracted form.

## Mechanism

- `SupportTicketCsvIntakeForm` owns the form state, validation, private Blob upload, best-effort local CSV body scrubbing, generic upload filename, metadata submission, analytics, processing redirect, and error/success states currently embedded in `SupportTicketCsvIntakePage`.
- `SupportTicketCsvIntakePage` becomes a route shell: back link, the shared form, and the existing macro-writeback add-on card.
- `DeflectionSnapshotLandingPage` imports the shared form and passes copy with `sourceOffer: 'support-ticket-deflection-intake'`, `sourcePage: '/systems/support-ticket-deflection/snapshot'`, and the Snapshot CTA label. The existing artifact/proof sections remain below the hero rather than occupying the hero's right column.
- The CSV privacy contract test reads both the dedicated route wrapper and the extracted form so it keeps guarding private upload, fail-closed scrubbing, generic filenames, and scoped public privacy copy after the refactor.
- The ATLAS submit contract test reads both the dedicated route wrapper and the extracted form so it still guards the processing redirect and result URL helper after the refactor.
- The public reachability source test also reads the extracted form so intake headline/trust-copy guards survive the component split.
- The smoke script stops requiring the old `/intake` CTA href in the hero and instead checks for inline form markers, the deflection source offer, and the Resolution Report framing.

## Intentional

- The form still defaults to the existing backend deflection intake source offer. The earlier `hero_intake` sketch is intentionally rejected because `/api/gap-report-intake/record` only starts the ATLAS report path for `support-ticket-deflection-intake`.
- The support platform field remains in the reusable form for this slice. Removing it can be a later friction trim, but keeping it avoids changing submitted metadata semantics while we move the form.
- The Snapshot data contract is not changed here. `top_blind_spots`, result locked-range math, and live parser changes are deferred so this PR does not mix landing-page conversion work with result rendering semantics.
- The diff is expected to exceed the 400 LOC soft cap because extracting a form component moves a large existing client component without changing most of its behavior.

## Deferred

Blind-spot result rows and Snapshot contract evolution remain deferred to a follow-up slice.

Parked hardening: none

## Verification

1. `npm --prefix web run test:deflection-snapshot-landing-smoke` - verify Snapshot landing source/smoke markers for the inline form.
2. `npm --prefix web run test:deflection-csv-privacy` - verify the shared form preserves the CSV privacy/security contract.
3. `npm --prefix web run test:deflection-intake-atlas-submit` - verify the extracted form still owns the result URL helper, processing redirect, and submit-state contract.
4. `npm --prefix web run test:deflection-public-reachability-smoke` - verify the public intake source guards follow the extracted form.
5. `rg -n "sourceOffer: 'hero_intake'|top_blind_spots|unresolved_topic_count|resolved_topic_count" web/src web/scripts web/plans/PR-Snapshot-Inline-Intake.md` - confirm the rejected source offer and deferred schema migration are absent from runtime source; remaining hits are the smoke-test negative assertion and this plan's deferred/verification text.
6. `npm --prefix web run lint` - verify no eslint errors.
7. `npm --prefix web run build` - verify successful Next compilation.
8. `bash scripts/local_pr_review.sh` - run full PR review suite.

## Estimated diff size

| Section | Size |
|---|---|
| Plan doc | ~65 |
| Shared intake form extraction | ~633 |
| Intake page wrapper reduction | ~776 |
| Snapshot landing inline form/copy | ~217 |
| CSV privacy test source update | ~29 |
| ATLAS submit test source update | ~17 |
| Public reachability test source update | ~12 |
| Snapshot smoke/test marker updates | ~57 |
| Total | ~1,806 |
