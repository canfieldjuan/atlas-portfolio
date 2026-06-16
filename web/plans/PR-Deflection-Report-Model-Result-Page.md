# PR-Deflection-Report-Model-Result-Page

## Why this slice exists

Atlas epic #1588 has moved the paid deflection report into a persisted
`deflection.v1` model and the ATLAS repo now exposes that model through a paid
`/report-model` route. The portfolio hosted result page still fetches the full
paid artifact, validates `markdown`, and renders the buyer page from the
monolithic artifact shape.

Root cause: the web result-page consumer has not been migrated to the new model
contract. As long as it depends on `/artifact` and `artifact.markdown`, the
hosted page remains coupled to the old complete-report blob and cannot evolve
per-surface from structured sections.

This exceeds the 400 LOC soft cap because the first hosted consumer needs the
contract types, paid model fetcher, route handoff, model-backed renderer,
legacy fallback, and CI-enrolled contract test in one vertical slice. Splitting
the renderer or parser into a separate PR would leave the paid result page
unable to prove the new `/report-model` path end to end.

## Scope (this PR)

Slice phase: Vertical slice

1. Add local TypeScript types and a path helper for the ATLAS
   `GET /deflection-reports/{request_id}/report-model` contract.
2. Add a server-side portfolio fetch/parse path for the paid report model.
3. Make the paid results route prefer the structured model page when the model
   route returns a supported `deflection.v1` payload.
4. Keep legacy `/artifact` fallback for older paid reports whose model route
   returns 404, and keep locked/error behavior falling through to the existing
   snapshot/unlock state.
5. Add a structured model renderer for the hosted result page that renders the
   current customer-facing surfaces from section `data`, not Markdown.
6. Add a focused Node test for route preference, parser fail-closed behavior,
   evidence exclusion, legacy fallback, and CI enrollment.

### Files touched

- `web/src/lib/deflection-report-contract.ts`
- `web/src/lib/atlas-deflection-client.ts`
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx`
- `web/src/components/landing/DeflectionReportModelPage.tsx`
- `web/scripts/test-deflection-report-model-result-page.mjs`
- `web/scripts/test-deflection-intake-atlas-submit.mjs`
- `web/package.json`
- `.github/workflows/pre_push_audit.yml`
- `web/plans/PR-Deflection-Report-Model-Result-Page.md`

## Mechanism

Extend the local contract module with `DeflectionStructuredReport`,
`DeflectionReportSection`, and `deflectionReportModelPath(...)`, mirroring the
ATLAS frontend contract. `atlas-deflection-client.ts` gets
`fetchDeflectionReportModel(...)`, using the same service-account config,
request-id guard, timeout discipline, and paid-state result shape as
`fetchDeflectionArtifact(...)`.

The results route changes from:

1. fetch `/artifact`;
2. render `DeflectionReportArtifactPage`;
3. otherwise fetch snapshot.

to:

1. fetch `/report-model`;
2. render `DeflectionReportModelPage` on a supported model;
3. fetch `/artifact` only for legacy 404/no-model fallback;
4. otherwise fetch snapshot as today.

The new renderer sorts sections by priority, renders only `web` sections, skips
unknown/export-only sections, and renders the known section data for
`support_tax`, `source_file`, `seo_targets`, `ranked_questions`,
`outcome_diagnostics`, and `question_details`. It uses counts and pointers to
the complete evidence export, not `evidence_quotes` or raw source IDs, so the
hosted result page remains a concise dashboard rather than a complete archive.

## Intentional

- No ATLAS backend changes. #1603 already shipped the paid model route.
- No removal of `DeflectionReportArtifactPage`. It remains the compatibility
  renderer for historical paid artifacts without a supported model.
- No client-side fetch. The results route remains a Server Component path that
  keeps service credentials server-side.
- No PDF/email changes. #1605 moved the PDF consumer; this slice is only the
  hosted web surface.
- No broad visual redesign beyond replacing Markdown-backed content with
  structured model-backed content; the goal is consumer migration, not a new
  art direction.

## Deferred

- Later #1588 slice: richer web layout polish once real customer feedback shows
  which sections deserve more/less prominence.
- Later #1588 slice: direct download affordances for PDF/evidence export if the
  existing paid artifact links are not sufficient from this page state.
- Later #1588 slice: optional clickable PDF navigation remains PDF-specific and
  outside the hosted page.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-report-model-result-page` -- passed.
- `npm --prefix web run test:deflection-intake-atlas-submit` -- passed.
- `npm --prefix web run lint` -- passed.
- `node web/scripts/audit-test-enrollment.mjs` -- passed; all 29 `test:*`
  scripts are enrolled in `.github/workflows/pre_push_audit.yml`.
- `npm --prefix web run build` -- passed.
- Pending before push: `bash scripts/local_pr_review.sh`.

## Estimated diff size

| File | LOC |
|---|---:|
| `.github/workflows/pre_push_audit.yml` | ~3 |
| `web/package.json` | ~1 |
| `web/plans/PR-Deflection-Report-Model-Result-Page.md` | ~127 |
| `web/scripts/test-deflection-intake-atlas-submit.mjs` | ~6 |
| `web/scripts/test-deflection-report-model-result-page.mjs` | ~224 |
| `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` | ~19 |
| `web/src/components/landing/DeflectionReportModelPage.tsx` | ~287 |
| `web/src/lib/atlas-deflection-client.ts` | ~111 |
| `web/src/lib/deflection-report-contract.ts` | ~21 |
| Total | ~799 |
