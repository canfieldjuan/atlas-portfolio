## Why this slice exists

#313's remaining local H4 admin-hardening gap is attribution: the admin intake
login is still one shared `ADMIN_INTAKE_TOKEN`, and the access ledger therefore
records `shared-admin-token` instead of the person who viewed customer PII or
downloaded a CSV.

This slice replaces that shared-token contract with env-backed named admin
accounts and carries the verified admin id through the session cookie into the
append-only access ledger. It keeps the no-cost posture from #313: no hosted auth
service, no new database auth table, and no paid infrastructure.

## Scope (this PR)

Slice phase: Production hardening

1. Add an `ADMIN_INTAKE_USERS` contract made of named admin ids and SHA-256 token
   hashes.
2. Require admin id + token at login and issue a signed session cookie carrying
   the named admin actor.
3. Verify the signed cookie on the queue page and CSV route, then pass the named
   actor into `recordAdminAccessEvent`.
4. Update the admin tests and CI enrollment so the named-account contract stays
   covered.

### Files touched

- `.github/workflows/pre_push_audit.yml` — enroll the named-admin test in CI.
- `web/README.md` — document `ADMIN_INTAKE_USERS` and the independent session-signing secret.
- `web/package.json` — add the named-admin test script.
- `web/plans/PR-Admin-Named-Accounts.md` — plan for this slice.
- `web/scripts/test-admin-access-ledger.mjs` — update ledger expectations from shared actor to named actor.
- `web/scripts/test-admin-intake-login-rate-limit.mjs` — update login-route stubs for the new credential/cookie API.
- `web/scripts/test-admin-intake-named-accounts.mjs` — cover named-account parsing, credential verification, signed cookies, and source wiring.
- `web/src/app/admin/intake/gap-report/[requestId]/csv/route.ts` — verify named admin session and log CSV downloads with that actor.
- `web/src/app/admin/intake/login/route.ts` — accept admin id + token and set a signed named-admin cookie.
- `web/src/app/admin/intake/page.tsx` — update login UI/config copy and log queue views with the named admin actor.
- `web/src/lib/admin-access-log.ts` — accept actor id/kind per event instead of a hard-coded shared token.
- `web/src/lib/admin-intake-auth.ts` — implement named admin parsing, token verification, and signed cookie verification.

## Mechanism

`ADMIN_INTAKE_USERS` is parsed as comma/newline-separated `admin_id:sha256_hex`
entries. Admin ids are restricted to short audit-safe identifiers and token
hashes must be 64 hex characters. Login hashes the submitted token with SHA-256
and compares that hash to the configured admin's hash with `timingSafeEqual`.

On success, the login route signs a compact cookie payload containing the admin
id and actor kind. The signature is an HMAC over the payload using an independent
`ADMIN_SESSION_SIGNING_SECRET`; the configured user hashes are included only as
rotation material, so rotating configured admin credentials still invalidates
existing cookies without making the credential hashes sufficient to forge a
cookie. Cookie verification returns the named actor only when the signature is
valid and the actor still exists in the configured user set.

The queue page and CSV route now require that verified session object and pass
its actor fields into `recordAdminAccessEvent`. The ledger helper still bounds
and parameterizes all data, but actor attribution now comes from the verified
session rather than a module-level `shared-admin-token` constant.

## Intentional

- This is env-backed named auth, not a full admin-user database. It gives us
  attribution now without adding another auth datastore in the same slice.
- Tokens are configured as hashes, not plaintext. The operator must generate a
  SHA-256 token hash for each admin and a separate 32+ character session-signing
  secret.
- Existing `ADMIN_INTAKE_TOKEN` sessions are invalidated by this slice. That is
  intentional because the shared-token identity is the gap this slice closes.
- The login lockout remains IP-scoped, not admin-id scoped, so an attacker cannot
  avoid the throttle by rotating submitted ids from the same client.

## Deferred

- Database-backed admin lifecycle, password reset, and per-admin disablement
  remain out of scope until we need more than the small env-backed operator set.
- Login success/failure events in the append-only ledger are still deferred; this
  slice covers attribution for PII queue views and raw CSV downloads.
- Parked hardening: NPM-AUDIT-WEB-1 — web dependency audit findings.

## Verification

```bash
npm --prefix web run test:admin-intake-named-accounts # PASS
npm --prefix web run test:admin-intake-login-rate-limit # PASS
npm --prefix web run test:admin-access-ledger # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
npm --prefix web run lint # PASS
bash scripts/local_pr_review.sh # PASS
rg -n "shared-admin-token|ADMIN_INTAKE_TOKEN" web/src web/scripts web/README.md # PASS (no matches)
```

Expected grep result: no runtime `shared-admin-token`; no runtime
`ADMIN_INTAKE_TOKEN`. Historical plan docs may still mention old slice state and
are intentionally not edited.

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| Plan doc | ~110 |
| README | ~10 |
| Auth/session helper | ~150 |
| Admin routes/pages | ~60 |
| Ledger helper | ~15 |
| Tests + CI enrollment | ~270 |
| Total | ~615 |

This exceeds the 400-LOC soft cap because the slice changes the auth/session
contract and needs tests around both helper behavior and route wiring.
