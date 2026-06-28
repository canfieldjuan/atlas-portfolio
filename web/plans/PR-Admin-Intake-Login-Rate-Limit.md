## Why this slice exists

Issue #313 flags that the private admin intake login uses a shared token with no brute-force protection. The full admin hardening item also includes per-user accounts and an immutable access ledger, but this slice closes the smallest unblocked risk first: repeated guesses against `/admin/intake/login`.

This slice lands over the 400-LOC soft cap because the behavior needs both a new helper and a route-level regression test that proves locked-out requests do not parse the submitted token. Review also surfaced two lockout-integrity edges — concurrent attempts and full-store pressure — that are part of the same security control, so they are fixed here rather than split into a follow-up that would briefly ship weaker protection.

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

The new `admin-intake-rate-limit` helper derives the client identifier from trusted edge/proxy headers: first `x-real-ip`, then `cf-connecting-ip`, then `unknown`. It deliberately does not key off the leftmost `x-forwarded-for` value because that position can be attacker-controlled and would let a caller rotate the bucket. Each allowed login attempt reserves one bucket before the route awaits form parsing, so concurrent bad guesses cannot all pass the check before any count is recorded. Invalid tokens leave that reservation in place for 15 minutes; successful verification clears the bucket before setting the admin cookie. Once the bucket has five attempts, later requests from that identifier are redirected back to `/admin/intake?error=rate_limited` with a `Retry-After` header and the form body is not parsed.

The storage is deliberately in-memory and per-process because issue #313 explicitly rules out paid KV/Redis for this baseline slice. The store is capped at 1000 active buckets; if all buckets are active, new identifiers are rejected until the nearest bucket expires instead of evicting an active lockout.

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
# Re-run after review fix: PASS — forged leftmost x-forwarded-for rotation does not bypass a stable x-real-ip bucket.
# Re-run after P2 fixes: PASS — attempts are reserved before form parsing and full-store pressure preserves active lockouts.

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
# Re-run after review fix: PASS — same bundle passed with trusted-header identity and spoofed-XFF test coverage.
```

Recurring value grep:

```bash
rg "Invalid admin token|rate_limited|admin-intake-login" web/src web/scripts web/package.json .github/workflows/pre_push_audit.yml
# PASS — remaining hits are the existing invalid-token copy, the new rate-limited state, and the enrolled test/script references.
```

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| CI/package/test harness | ~270 |
| App/helper changes | ~115 |
| Plan | ~85 |
| Total | ~510 |
