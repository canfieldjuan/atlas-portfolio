## Why this slice exists

#414 is moving tests off temp `ts.transpileModule` harnesses and fake local
adapters. The admin intake login rate-limit test still compiles
`admin-intake-rate-limit.ts` and the login route into temp CommonJS files while
writing fake local auth, rate-limit, and `next/server` modules beside them.

This slice migrates that coverage to Vitest so the test imports the real
`@/lib/admin-intake-rate-limit` helper and real admin login route.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the admin login rate-limit temp transpile harness with a Vitest test.
2. Preserve coverage for helper thresholds, per-IP isolation, Cloudflare IP
   fallback, store capacity fail-closed behavior, clear-on-success behavior,
   route lockout, invalid-token recording, and successful-cookie behavior.
3. Repoint the existing package script to the new Vitest test.

### Files touched

- `web/package.json` — run the admin login rate-limit test through Vitest.
- `web/plans/PR-Real-Adapter-Admin-Login-Rate-Limit-Test.md` — plan for this
  slice.
- `web/scripts/test-admin-intake-login-rate-limit.mjs` — remove the temp
  transpile and fake local-module harness.
- `web/src/lib/admin-intake-rate-limit.test.ts` — add real-import helper and
  route coverage.

## Mechanism

The new test imports `ADMIN_INTAKE_LOGIN_RATE_LIMIT`,
`checkAdminIntakeLoginRateLimit`, `clearAdminIntakeLoginFailures`, and
`recordAdminIntakeLoginFailure` from the production
`@/lib/admin-intake-rate-limit` module. It imports the production login route's
`POST` handler from `@/app/admin/intake/login/route`.

The route tests configure real named-admin auth environment variables and use
the real `next/server` package. Test request objects provide only the fields the
route consumes: `headers`, `url`, and `formData`.

## Intentional

- No local product dependency is mocked. The rate-limit helper, admin auth
  helper, login route, and Next response implementation resolve through the
  normal repo path.
- The old source-order assertion for recording an attempt before parsing the
  form is replaced with behavior: a throwing `formData()` still consumes one
  failure bucket entry.

## Deferred

The remaining #414 fake-adapter and temp-transpile harness migrations stay
queued.

The #415 enforcement audit remains deferred until enough migrations have landed
to define the no-fake-adapter rule mechanically.

Parked hardening: none

## Verification

```bash
npm --prefix web run test:admin-intake-login-rate-limit # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
if rg -n "test-admin-intake-login-rate-limit\\.mjs|atlas-admin-intake-login-rate-limit" web/package.json web/scripts web/src/lib/admin-intake-rate-limit.test.ts; then exit 1; else echo "No admin login rate-limit temp harness references remain."; fi # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| `web/package.json` | ~2 |
| `web/plans/PR-Real-Adapter-Admin-Login-Rate-Limit-Test.md` | ~83 |
| `web/scripts/test-admin-intake-login-rate-limit.mjs` | ~266 |
| `web/src/lib/admin-intake-rate-limit.test.ts` | ~258 |
| Total | ~609 |

This is over the 400-LOC soft cap because the old temp transpile harness is
deleted and replaced with parity helper and route coverage in one slice.
