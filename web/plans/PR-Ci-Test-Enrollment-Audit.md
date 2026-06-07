## Why this slice exists

Issue #258 identifies a recurring CI gap: `web/package.json` can define a
`test:*` guard without any matching `pre_push_audit.yml` step. That happened in
#254 and was visible again before #257 merged. Several other `main` `test:*`
scripts were also un-enrolled.

This slice makes enrollment self-checking and fixes the current `main` test
inventory. Enrolling `test:google-ads-api` surfaced a stale assertion from the
v22 `pageSize` removal; this slice updates that assertion because the enrolled
test would otherwise turn CI red. After #257 merged, this branch was refreshed
on current `main`, so the audit now also validates the inherited row-renderer
guard.

## Scope (this PR)

Slice phase: Workflow/process

1. Add a Node audit that reads `web/package.json`, collects every `test:*`,
   scans `.github/workflows/pre_push_audit.yml` for
   `npm --prefix web run <script>`, and fails with missing script names.
2. Add a self-test proving enrolled fixtures pass, missing `test:*` fails,
   commented workflow lines do not count, and `smoke:*` remains out of scope.
3. Add `test:test-enrollment-audit` to `web/package.json`.
4. Wire the audit, its self-test, and every current `main` `test:*` script into
   `.github/workflows/pre_push_audit.yml`.
5. Update the existing Google Ads API pagination test to assert the current v22
   contract: the deprecated `pageSize` option is accepted but not sent.

### Files touched

- `.github/workflows/pre_push_audit.yml` - add audit/self-test steps and enroll
  current missing `test:*` scripts.
- `web/package.json` - add the audit self-test npm script.
- `web/plans/PR-Ci-Test-Enrollment-Audit.md` - plan for this slice.
- `web/scripts/audit-test-enrollment.mjs` - CI enrollment audit.
- `web/scripts/test-google-ads-api.mjs` - align the newly enrolled stale test
  with the current v22 request-body contract.
- `web/scripts/test-test-enrollment-audit.mjs` - fixture tests for the audit.

## Mechanism

The audit treats `web/package.json` as the source of truth, scans non-comment
workflow lines for `npm --prefix web run <script>` commands, and exits non-zero
with a sorted list of missing `test:*` scripts. The workflow runs the audit
itself, so a future un-enrolled `test:*` fails CI.

## Intentional

- Scope is `test:*` only. Operator-run `smoke:*` commands stay manual.
- No exemption file is added because no current `main` `test:*` is
  intentionally manual.
- The workflow parser is deliberately command-focused instead of a general YAML
  parser; the enforced contract is `npm --prefix web run <script>`.
- The #257 row-renderer guard is inherited from current `main`; this slice does
  not change that test.

## Deferred

- If future manual commands are named `test:*`, add an audited exemption file
  with one-line reasons.

Parked hardening: none

## Verification

- `node web/scripts/audit-test-enrollment.mjs` - PASS; reported all 21
  `test:*` scripts enrolled.
- `npm --prefix web run test:test-enrollment-audit` - PASS; demonstrates
  enrolled fixtures pass, missing `test:*` fails, commented workflow commands
  do not enroll, and `smoke:*` scripts are out of scope.
- `npm --prefix web run test:ads-helpers` - PASS.
- `npm --prefix web run test:google-ads-api` - PASS after aligning the stale
  v22 `pageSize` assertion with the current helper contract.
- `npm --prefix web run test:google-ads-artifacts` - PASS.
- `npm --prefix web run test:local-env` - PASS.
- `npm --prefix web run test:deflection-row-renderer-share` - PASS.
- `bash scripts/local_pr_review.sh` - PASS.

## Estimated diff size

| Area | Estimate |
| --- | ---: |
| Plan doc | ~85 LOC |
| Audit script | ~155 LOC |
| Audit self-test | ~130 LOC |
| Existing stale test alignment | ~5 LOC |
| Workflow/package wiring | ~20 LOC |
| Total | ~395 LOC |
