## Why this slice exists

#414 is moving the test suite away from temp `ts.transpileModule` harnesses now
that Vitest resolves the repo's `@/` alias. The admin named-account auth test
still compiles `admin-intake-auth.ts` into a temporary CommonJS file before
requiring it.

This slice migrates that coverage to Vitest so the test imports the real
`@/lib/admin-intake-auth` module directly.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the admin named-account temp transpile harness with a Vitest test.
2. Preserve coverage for configuration fail-closed behavior, credential
   verification, cookie signing, tamper rejection, signing-secret rotation,
   admin removal, and token rotation.
3. Preserve the existing source-level wiring checks for the login route, admin
   page, CSV route, access-log actor kind, and removal of the legacy shared
   actor string.
4. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the admin named-account test through Vitest.
- `web/plans/PR-Real-Adapter-Admin-Named-Accounts-Test.md` — plan for this slice.
- `web/scripts/test-admin-intake-named-accounts.mjs` — remove the temp transpile
  harness.
- `web/src/lib/admin-intake-auth.test.ts` — add real-import auth coverage.

## Mechanism

The new test imports `adminIntakeConfigured`, `adminIntakeCookieValue`,
`verifyAdminIntakeCookie`, and `verifyAdminIntakeCredentials` from the production
`@/lib/admin-intake-auth` module. The test manipulates
`ADMIN_INTAKE_USERS` and `ADMIN_SESSION_SIGNING_SECRET` directly because the real
helper reads env at call time.

The source-level checks are carried forward for wiring that belongs outside the
helper itself: the login route must verify named credentials and sign the
session, the admin page must expose the named admin input and env copy, the CSV
route must log the named actor, and runtime admin surfaces must not retain the
legacy shared-token actor.

## Intentional

- This slice does not render the Next admin page or invoke the login/CSV routes.
  It preserves the existing source-level wiring checks while the helper itself
  moves to real imports. A full route integration harness would be a separate,
  broader slice.
- No external service is mocked because this helper has no external service
  boundary.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:admin-intake-named-accounts # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-admin-intake-named-accounts\\.mjs|atlas-admin-intake-named-accounts" web/package.json web/scripts web/src/lib/admin-intake-auth.test.ts; then exit 1; else echo "No admin named-account temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~1 |
| `web/plans/PR-Real-Adapter-Admin-Named-Accounts-Test.md` | ~83 |
| `web/scripts/test-admin-intake-named-accounts.mjs` | ~167 |
| `web/src/lib/admin-intake-auth.test.ts` | ~159 |
| Total | ~411 |

This is slightly over the 400-LOC soft cap because the old temp-transpile harness
is deleted and replaced with real-import Vitest coverage in the same slice.
