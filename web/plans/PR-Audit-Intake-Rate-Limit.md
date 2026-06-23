## Why this slice exists

Issue #313 flags `/api/audit` as an unauthenticated POST that can trigger email, webhook, CRM, and persistence side effects without an application-level limiter. The repo already has a no-cost in-memory limiter for public deflection endpoints; this slice applies that existing guard to the audit intake route.

## Scope (this PR)

Slice phase: Production hardening

1. Add an IP-scoped limiter to `/api/audit` before request validation side effects.
2. Add a work-email-scoped limiter after email validation and before `recordAuditIntake`.
3. Extend the existing rate-limit test suite to prove exhausted IP and email buckets return `429` before persistence/delivery runs.

### Files touched

- `web/plans/PR-Audit-Intake-Rate-Limit.md` — plan for this hardening slice.
- `web/src/app/api/audit/route.ts` — audit intake rate limits.
- `web/scripts/test-deflection-rate-limit.mjs` — regression coverage for the audit route limiter.

## Mechanism

The route imports `consumeDeflectionRateLimit` and `consumeDeflectionIdentifierRateLimit` from the existing limiter module. It uses a fixed IP bucket for the route (`audit-intake`) and a normalized work-email bucket for valid submissions. When either bucket is exhausted, the route returns `429` with `Retry-After` and generic client copy. The email bucket check runs after the email is syntactically valid and before `recordAuditIntake`, so throttled submissions do not send email/webhook/CRM events or persist records.

## Intentional

This uses the existing per-process limiter because #313 explicitly says to avoid paid dependencies and reuse the current pattern. That also widens the existing shared-store exhaustion surface to `/api/audit`: a spoofed-IP flood can fill the capped in-memory store until entries expire. A distributed or edge limiter remains stronger, but is outside this no-cost slice.

This does not change audit form validation, delivery behavior, payload schema, or user-facing page copy.

## Deferred

Other #313 items remain open: security CI, admin identity/ledger hardening, end-to-end deletion, runtime amount allowlist, security.txt/SECURITY.md, structured logging, and purge endpoint work.

Parked hardening: none

## Verification

- `npm --prefix web run test:deflection-rate-limit` — passed.
- `rg -n "audit-intake-ip|audit-intake-email|Too many audit requests|recordAuditIntake|consumeDeflectionRateLimit|consumeDeflectionIdentifierRateLimit" web/src/app/api/audit/route.ts web/scripts/test-deflection-rate-limit.mjs web/plans/PR-Audit-Intake-Rate-Limit.md` — confirmed the audit route imports the existing limiter, declares IP/email scopes, returns the generic 429 copy, and checks the email bucket before `recordAuditIntake`.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~51 |
| Audit route | ~43 |
| Rate-limit test | ~138 |
| Total | ~232 |
