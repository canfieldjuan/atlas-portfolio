# Plan: Deflection CSV Privacy Contract

Issue #117 is still open even though the active intake path no longer uploads
raw support-ticket CSVs to a public Blob URL. The fix is easy to regress because
it spans client upload options, notification copy, admin download, and cleanup
behavior. This slice locks those privacy invariants in the portfolio CI lane.

## Why this slice exists

- The original #117 blocker was public storage of raw CSVs that may contain PII.
- PR-Private-Deflection-CSV-Uploads moved the active upload to private Blob
  storage, added authenticated admin download, stopped emailing a public
  download URL, and left redaction out of scope with honest self-strip copy.
- The repo has no focused CI check that prevents a future edit from restoring
  `access: 'public'` or a public email download link.

## Scope (this PR)

Slice phase: Production hardening

1. Add a focused Node contract test for the deflection CSV privacy invariants.
2. Enroll that test in `package.json`.
3. Run it in the existing pre-push CI workflow.

### Files touched

- `web/plans/PR-Deflection-CSV-Privacy-Contract.md` - this plan doc (new)
- `web/scripts/test-deflection-csv-privacy-contract.mjs` - focused privacy
  contract test (new)
- `web/package.json` - adds the focused test script
- `.github/workflows/pre_push_audit.yml` - runs the focused test in CI

## Mechanism

The test reads the active intake source files and asserts the contract directly:

- Client upload uses `access: 'private'` and has no active `access: 'public'`.
- The record route only accepts `https://.../gap-report-csvs/` upload
  references and verifies ownership with `head(...)`.
- Notification copy says `Private blob reference`, not a public `Download:` URL.
- Admin CSV route fetches with `access: 'private'`, the server Blob token, and
  `Cache-Control: no-store`.
- Cleanup deletes tracked/orphaned `gap-report-csvs/` blobs with the intake
  Blob token.
- Public copy keeps the truthful self-strip guidance rather than claiming
  automatic PII redaction.

## Intentional

- This is a contract test, not a redaction implementation. The active product
  posture remains: private storage, 30-day deletion, no model training, and
  self-strip guidance for PII.
- The test uses file-level assertions because the guarded contract spans client
  Blob SDK usage, route handler behavior, email copy, and cleanup wiring.
- This does not close #117 in code; it prepares a defensible issue close-out by
  locking the shipped mitigation in CI.

## Deferred

- Automated PII redaction before storage remains out of scope. It would require
  a separate schema-aware product decision and should not be guessed from raw
  support exports.
- Shorter retention than 30 days remains a product/operator decision.

Parked hardening: none.

## Verification

- `npm run test:deflection-csv-privacy`
- `npm run lint`
- `npm run build`
- `bash scripts/local_pr_review.sh --allow-dirty`

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| privacy contract test + script entry | ~90 |
| CI test enrollment | ~3 |
| this plan doc | ~80 |
| **Total** | ~173 |

Actual diff: 4 files, +150 / -0.
