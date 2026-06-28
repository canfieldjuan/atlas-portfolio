## Why this slice exists

Issue #313 flags that the private admin intake login uses a shared token with no brute-force protection. The full admin hardening item also includes per-user accounts and an immutable access ledger, but this slice closes the smallest unblocked risk first: repeated guesses against `/admin/intake/login`.

This slice lands slightly over the 400-LOC soft cap because the behavior needs both a new helper and a route-level regression test that proves locked-out requests do not parse the submitted token. Splitting the test into a follow-up would leave the security behavior less reviewable.

## Scope (this PR)

Slice phase: Production hardening

1. Add a no-cost, per-process failed-login tracker for the admin intake login, matching the existing `globalThis` Map rate-limit posture already accepted for this repo.
2. Block further login attempts from the same client IP after five failed token submissions for 15 minutes.
3. Clear the failed-attempt bucket after a successful login.
4. Surface a clear locked-out login message on the existing admin intake page.
5. Enroll a focused regression test in CI so the route behavior stays covered.

### Files touched

- `.github/workflows/pre_push_audit.yml` — enroll the new admin intake login rate-limit test.
- `web/package.json` — add the test script.
- `web/plans/PR-Admin-Intake-Login-Rate-Limit.md` — plan for this slice.
- `web/scripts/test-admin-intake-login-rate-limit.mjs` — cover helper and route lockout behavior.
- `web/src/app/admin/intake/login/route.ts` — enforce lockout before token verification and clear failures on success.
- `web/src/app/admin/intake/page.tsx` — show the rate-limited login message.
- `web/src/lib/admin-intake-rate-limit.ts` — store failed admin login attempts by client IP.

## Mechanism

The new `admin-intake-rate-limit` helper derives the same client identifier pattern as the existing public deflection limiter: first `x-forwarded-for` IP, then `x-real-ip`, then `cf-connecting-ip`, then `unknown`. Each failed admin-token submission increments one bucket for 15 minutes. Once the bucket has five failures, later requests from that identifier are redirected back to `/admin/intake?error=rate_limited` with a `Retry-After` header and the form body is not parsed.

Successful verification calls `clearAdminIntakeLoginFailures` before setting the existing admin cookie, so legitimate recovery does not leave the client stuck behind old failures. The storage is deliberately in-memory and per-process because issue #313 explicitly rules out paid KV/Redis for this baseline slice.

## Intentional

- This does not replace the shared `ADMIN_INTAKE_TOKEN` with named admin accounts. That remains a larger follow-up because it needs an identity model and migration path.
- This does not add the immutable customer-PII access ledger. The route lockout is useful on its own and keeps this PR under the slice budget.
- The limiter is best-effort across serverless instances. That is the accepted no-cost posture for this repo; a distributed limiter would require paid or separately operated infrastructure.

## Deferred

- Per-user admin accounts and an append-only access ledger remain open under issue #313.
- A distributed lockout store is deferred until the project chooses paid infrastructure or a self-hosted equivalent.

Parked hardening: none

## Verification

Local checks:

```bash
npm --prefix web run test:admin-intake-login-rate-limit
# PASS — Admin intake login rate-limit tests passed.

node web/scripts/audit-test-enrollment.mjs
# PASS — All 35 test:* scripts are enrolled in .github/workflows/pre_push_audit.yml.

npm --prefix web run test:test-enrollment-audit
# PASS — Test enrollment audit tests passed.

npm --prefix web run lint
# PASS

git diff --check
# PASS
```

Full local review before opening the PR:

```bash
bash scripts/local_pr_review.sh
# PASS — plan audits, drift advisory, dead-code baseline, landing smoke, lint, Next build, and whitespace all passed.
```

Recurring value grep:

```bash
rg "Invalid admin token|rate_limited|admin-intake-login" web/src web/scripts web/package.json .github/workflows/pre_push_audit.yml
# PASS — remaining hits are the existing invalid-token copy, the new rate-limited state, and the enrolled test/script references.
```

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| CI/package/test harness | ~215 |
| App/helper changes | ~100 |
| Plan | ~85 |
| Total | ~430 |
