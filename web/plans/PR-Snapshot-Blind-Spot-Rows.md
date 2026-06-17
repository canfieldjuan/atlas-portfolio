## Why this slice exists

PR-Snapshot-Inline-Intake deferred the Snapshot contract evolution for blind-spot
rows so the inline upload move did not also change result semantics. The current
Snapshot result page can say how many no-proven-answer questions exist, but it
cannot render a bounded list when ATLAS starts sending those rows.

## Scope (this PR)

Slice phase: Product polish

1. Extend the free Snapshot contract with an optional `top_blind_spots` array
   that carries only rank, question, and ticket count.
2. Parse `top_blind_spots` from ATLAS only when present, rejecting malformed rows
   while continuing to accept current snapshots that do not send the field.
3. Render blind-spot rows on the free results page when the field exists, using
   shared row styling and explicit no-proven-answer framing.
4. Update focused guards for parser privacy, optional backward compatibility, and
   shared row usage.

### Files touched

- `web/plans/PR-Snapshot-Blind-Spot-Rows.md` - plan contract for this slice.
- `web/src/lib/deflection-snapshot.ts` - optional blind-spot Snapshot type and demo fixture rows.
- `web/src/lib/atlas-deflection-client.ts` - optional parser and privacy allowlist for blind-spot rows.
- `web/src/components/landing/DeflectionSnapshotRows.tsx` - shared blind-spot row renderer.
- `web/src/components/landing/DeflectionResultsPage.tsx` - result-page blind-spot section.
- `web/scripts/test-deflection-intake-atlas-submit.mjs` - parser/privacy regression coverage.
- `web/scripts/test-deflection-row-renderer-share.mjs` - shared renderer/result hook-up guard.

## Mechanism

`DeflectionSnapshotBlindSpot` is a free-tier row with `rank`, `question`, and
`ticket_count`. `DeflectionSnapshot.top_blind_spots` is optional so current
ATLAS snapshots continue to parse unchanged. When the upstream field is present,
`atlas-deflection-client.ts` requires it to be an array of valid blind-spot rows
and copies only the three allowlisted fields into the browser snapshot.

`DeflectionBlindSpotRows` lives beside the existing shared top/locked row
renderers. `DeflectionResultsPage` renders a no-proven-answer section only when
`snapshot.top_blind_spots` has rows; the summary count and full-report lock copy
remain the fallback for snapshots without row detail.

## Intentional

- The field is optional because the local Atlas checkout does not currently
  expose `top_blind_spots`; this PR prepares the portfolio surface without
  making current live snapshots fail closed.
- Blind-spot rows do not include answers, evidence quotes, source IDs, Markdown,
  or customer wording. They are framed as "no proven answer yet," not as
  publishable recommendations.
- The landing page is not changed in this slice. It already has representative
  demo proof; this follow-up focuses on the real result surface and parser.

## Deferred

Live ATLAS generation of `top_blind_spots` remains a backend/product follow-up;
this PR only accepts and renders the field when it appears.

Parked hardening: none

## Verification

1. `npm --prefix web run test:deflection-intake-atlas-submit` - passed; verified
   optional `top_blind_spots` parsing, malformed-field rejection, and privacy
   allowlisting.
2. `npm --prefix web run test:deflection-row-renderer-share` - passed; verified
   the shared blind-spot renderer and result-page hook-up.
3. `rg -n "top_blind_spots|DeflectionBlindSpotRows|private blind evidence|blind markdown" web/src web/scripts web/plans/PR-Snapshot-Blind-Spot-Rows.md` - passed; hits are limited to the intended parser, renderer, tests, fixture, and plan markers.
4. `npm --prefix web run lint` - passed with no eslint errors.
5. `npm --prefix web run build` - passed; Next compiled and prerendered the app.
6. `bash scripts/local_pr_review.sh` - passed; plan audits, drift advisory,
   dead-code baseline, ESLint, Next build, and `git diff --check` all passed.

## Estimated diff size

| Section | Size |
|---|---|
| Plan doc | ~83 |
| Snapshot contract + demo fixture | ~24 |
| ATLAS parser | ~31 |
| Shared blind-spot rows | ~58 |
| Results page section | ~24 |
| Parser/renderer guards | ~93 |
| Total | ~313 |
