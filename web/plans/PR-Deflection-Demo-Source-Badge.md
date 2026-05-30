# Plan: Deflection demo source badge

## Why this slice exists

The embedded deflection demo result badge is hard-coded as
`Illustrative · sample dataset`. That is truthful while the demo answers from the
local sample dataset, but the same route can proxy Atlas when
`DEFLECTION_SEARCH_ATLAS_BASE_URL` is configured. Once that env is live, the UI
would still label real Atlas-backed rows as illustrative sample data. The parked
`DEFLECTION-BADGE-1` hardening item calls for a response source flag so the badge
matches the actual data source.

## Scope (this PR)

Slice phase: Product polish

1. Add a `source: 'local' | 'atlas'` flag to successful deflection-search
   responses.
2. Return `source: 'local'` from the local illustrative matcher path.
3. Return `source: 'atlas'` from the Atlas adapter path.
4. Thread the response source through the client helper and demo component.
5. Render the result badge from the response source instead of hard-coded sample
   copy.
6. Mark `DEFLECTION-BADGE-1` resolved in `HARDENING.md`.

### Files touched

- `HARDENING.md` — mark the promoted demo badge hardening item resolved.
- `web/plans/PR-Deflection-Demo-Source-Badge.md` — plan for this slice.
- `web/src/lib/deflection-demo.ts` — response source type and client helper return shape.
- `web/src/app/api/demo/deflection-search/route.ts` — source flag on local and Atlas success responses.
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — source-aware result badge rendering.

## Mechanism

`DeflectionSearchResponse` becomes `{ match: DeflectionIssue | null; source:
'local' | 'atlas' }` for successful responses. The route returns `source:
'local'` when `DEFLECTION_SEARCH_ATLAS_BASE_URL` is absent and `source: 'atlas'`
after a valid Atlas payload is adapted. Error responses keep their existing
`match: null, error: ...` shape because the client throws on non-OK responses and
never renders a badge from them.

The `searchDeflection` helper now returns the response envelope instead of just
the match. `DeflectionDemo` keeps the issue state and adds a small source state.
The result header badge maps local to `Illustrative · sample dataset` and Atlas
to `Atlas-backed · approved data`, so the copy stays truthful once the env is
enabled.

## Intentional

- This does not enable Atlas. It only makes the existing Atlas path label itself
  correctly when configured.
- Error responses are not widened to carry a source because the component does
  not render result badges for error states.
- The local dataset remains labeled illustrative; the Atlas path is labeled
  `approved data` because the route comments already require the token account
  to have approved rows in `ticket_faq_search_documents`.

## Deferred

- No broader demo copy/layout changes.
- No Atlas environment configuration.
- No changes to the result cards, source-count display, or report-shape fields.

Parked hardening: DEFLECTION-BADGE-1 — resolved by this slice.

## Verification

- `rg -n "DeflectionSearchSource|source: 'local'|source: 'atlas'|Atlas-backed|Illustrative · sample dataset|DEFLECTION-BADGE-1" web/src HARDENING.md web/plans/PR-Deflection-Demo-Source-Badge.md`
  — confirmed the source type, both route source values, both badge labels, and
  the resolved hardening entry are present.
- `rg -n "const found = await searchDeflection|setResultSource|resultSource" web/src/components/deflection-demo/DeflectionDemo.tsx`
  — confirmed the component stores the response source and renders from it.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed.
- Browser check at `http://127.0.0.1:3003/systems/support-ticket-deflection` —
  page loaded without framework overlay; clicking the `export attribution reports`
  demo chip rendered `Illustrative · sample dataset` and did not render
  `Atlas-backed · approved data`.
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~91 |
| Response source contract | ~21 |
| Demo source state/badge | ~17 |
| Hardening update | ~6 |
| Total | ~133 |
