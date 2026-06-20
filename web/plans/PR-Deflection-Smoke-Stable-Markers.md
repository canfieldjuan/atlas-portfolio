## Why this slice exists

Issue #323 tracks review feedback from the Resolution Report copy pass: the
deflection live smoke scripts assert exact marketing-copy strings, so harmless
copy punctuation/casing edits can fail reachability checks even when the pages
are healthy. This slice moves the live smoke contract onto stable structural
markers while leaving deliberate copy assertions in focused source/unit tests.

## Scope (this PR)

Slice phase: Workflow/process

1. Add stable `data-smoke` markers to the public deflection landing page,
   Snapshot landing page, and shared CSV intake form.
2. Update the Snapshot landing and public reachability smoke scripts to assert
   those stable markers instead of exact user-facing copy.
3. Keep the existing copy/source assertions that intentionally guard important
   messaging, including the Resolution Report submit label and privacy wording.
4. Update smoke unit fixtures and failure cases so missing structural markers
   still fail with the same marker keys.

### Files touched

- `web/plans/PR-Deflection-Smoke-Stable-Markers.md` - plan contract for this slice.
- `web/src/components/landing/DeflectionLandingPage.tsx` - public landing structural markers.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` - Snapshot landing structural markers.
- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` - shared intake structural markers.
- `web/scripts/smoke-deflection-snapshot-landing.mjs` - stable marker checks.
- `web/scripts/smoke-deflection-public-reachability.mjs` - stable marker checks.
- `web/scripts/test-deflection-snapshot-landing-smoke.mjs` - updated fixtures/failure coverage.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` - updated fixtures/failure coverage.

## Mechanism

The runtime surfaces get deterministic `data-smoke="<marker-key>"` attributes
on elements that represent the existing smoke contract: landing hero/pricing,
Snapshot hero/intake/value/final CTA, and intake form fields/trust/submit
controls. The smoke scripts switch from `html.includes(copy)` to
a `data-smoke` token matcher that can find marker keys inside grouped marker
attributes. The unit tests keep source-level copy assertions for intentional
text and use fixture HTML with `data-smoke` attributes for reachability
behavior.

## Intentional

- Use `data-smoke` rather than `data-testid` so these attributes are clearly for
  hosted smoke checks, not component testing.
- Do not remove all literal copy assertions. Copy that is itself a product
  contract remains tested in source/unit checks.
- Do not change route paths, form behavior, analytics, or submitted metadata.

## Deferred

- Broader smoke-marker refactors outside the deflection landing/intake surfaces
  remain out of scope.

Parked hardening: none

## Verification

1. `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed;
   verified the
   Snapshot smoke uses stable markers and still catches missing structure.
2. `npm --prefix web run test:deflection-public-reachability-smoke` - passed;
   verified the
   public reachability smoke uses stable markers and still catches missing
   landing/intake structure, including an exact-token boundary regression case.
3. `rg -n "data-smoke|REQUIRED_MARKERS|LANDING_MARKERS|INTAKE_MARKERS|Ticket Resolution Report|Get your ticket resolution report" web/src web/scripts web/plans/PR-Deflection-Smoke-Stable-Markers.md` - passed; confirmed marker keys and intentional copy assertions are scoped to this slice.
4. `npm --prefix web run lint` - passed with no eslint errors.
5. `npm --prefix web run build` - passed; Next compiled successfully.
6. Review fix: replaced punctuation-sensitive word-boundary smoke matching with
   whitespace-token membership in both smoke scripts.
7. `bash scripts/local_pr_review.sh` - passed after the review-fix commit;
   plan audits, drift advisory, dead-code baseline, eslint, Next build, and
   whitespace all passed.

## Estimated diff size

| Section | Size |
|---|---|
| Plan doc | ~88 |
| Runtime smoke markers | ~51 |
| Smoke script marker helpers | ~89 |
| Smoke unit fixtures/failures | ~59 |
| Total | ~287 |
