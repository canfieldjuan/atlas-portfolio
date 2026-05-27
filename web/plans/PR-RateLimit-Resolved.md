# Plan: Mark DEFLECTION-INTAKE-RATELIMIT-1 resolved (Vercel WAF)

Records that the open `/upload` + `/record` intake endpoints are now rate-limited
via a Vercel Firewall rule the operator configured — the last #88 follow-up.
Docs only.

## Why this slice exists

- `HARDENING.md` `DEFLECTION-INTAKE-RATELIMIT-1` flagged the two open intake
  endpoints as unthrottled. The repo has no rate-limit infra and the entry deemed
  it acceptable at design-partner volume with "IP/token bucket **or Vercel WAF**"
  as the fix. Operator chose the WAF route and added the rule. Recording it in the
  tracker — and that it's **edge-handled, not code** — so a future session doesn't
  re-implement a code limiter or mis-read the endpoints as still unprotected.

## Scope (this PR)

Slice phase: Production hardening

1. **`HARDENING.md`** — append ` — RESOLVED (Vercel WAF)` to the entry title and a
   `- Resolved:` line with the rule spec (per-IP, `/api/gap-report-intake/` + POST
   → 10 req/60s → Deny 429), noting there is no app-level limiter by design and
   the code fallback (`@upstash/ratelimit`) if the WAF rule is ever removed.

### Files touched

- `web/plans/PR-RateLimit-Resolved.md` — this plan doc (new)
- `HARDENING.md` — mark `DEFLECTION-INTAKE-RATELIMIT-1` resolved (follows the
  `DEFLECTION-GOLIVE-1` resolved-entry convention)

## Mechanism

- Documentation only — no code/product change. The rate limit is enforced at the
  Vercel edge (Firewall rule), outside the repo. This entry is the in-repo record
  of that out-of-repo control.

## Intentional

- **Edge, not code** — chosen because the repo has no rate-limit backing store and
  a WAF rule covers both endpoints per-IP with zero new dependencies/stores.
- **Re-open trigger documented** — if the WAF rule is removed, the entry says to
  fall back to a `@upstash/ratelimit` code limiter, so the control isn't silently lost.

## Deferred

- Operator: delete the orphaned **private** Blob store (safe — verified nothing in
  code depends on the default `BLOB_READ_WRITE_TOKEN`; all blob ops use the public
  store's token via `gapReportBlobToken()`).

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  2 == 2 + diff-size). Markdown only — no lint/build impact.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `HARDENING.md` resolved entry | ~4 |
| this plan doc | ~55 |
| **Total** | ~59 |

Well under the 400-LOC soft cap.
