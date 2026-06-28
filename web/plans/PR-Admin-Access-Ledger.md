## Why this slice exists

Issue #313 still has one open admin-hardening gap after the login lockout slice: authenticated admin access to customer PII and raw CSVs is not recorded. The current admin queue can view audit-intake PII and download support-ticket CSVs, but there is no durable who/what/when trail.

## Scope (this PR)

Slice phase: Production hardening

1. Add a Neon-backed append-only admin access ledger table.
2. Add a shared helper that records authorized admin page views and CSV downloads with actor, action, target, request id, IP, user agent, timestamp, and metadata.
3. Wire the admin intake page and CSV download route to record ledger events before exposing PII/raw CSV content.
4. Add a focused test for the helper contract and route source guard.

### Files touched

- `.github/workflows/pre_push_audit.yml` — enrolls the new admin access ledger test in CI.
- `web/package.json` — adds the local test script.
- `web/plans/PR-Admin-Access-Ledger.md` — slice plan.
- `web/scripts/test-admin-access-ledger.mjs` — verifies ledger helper behavior and admin route wiring.
- `web/sql/004_portfolio_admin_access_events.sql` — creates the append-only ledger table and immutability trigger.
- `web/src/app/admin/intake/gap-report/[requestId]/csv/route.ts` — records CSV download access before streaming the private blob.
- `web/src/app/admin/intake/page.tsx` — records authorized admin queue views before listing PII.
- `web/src/lib/admin-access-log.ts` — adds the shared admin access ledger helper.

## Mechanism

`recordAdminAccessEvent` resolves an admin-ledger database URL, derives a conservative actor id (`shared-admin-token` until named accounts exist), extracts trusted-ish request context from headers, bounds metadata, and inserts one row into `portfolio_admin_access_events`.

The SQL migration creates an append-only table with mutation triggers that raise on `UPDATE`, `DELETE`, or `TRUNCATE`, and revokes those mutation privileges from `PUBLIC`. Application code only inserts; no read UI is introduced in this slice.

The admin intake page records an `admin_intake_view` event before it queries and renders audit/CSV submissions. The CSV download route validates the private Blob first, then records a `gap_report_csv_download` event immediately before streaming, so the ledger records actual raw CSV access rather than missing-blob attempts.

## Intentional

This does not introduce named admin accounts. The actor is explicitly recorded as `shared-admin-token` so the ledger starts capturing access now while keeping the identity migration separate.

The ledger is not shown in the admin UI yet. This slice creates durable capture first; a later operator-view slice can decide how much of the ledger to expose.

## Deferred

Named admin accounts remain open under #313. Once accounts exist, the helper can take the named actor from the session instead of `shared-admin-token`.

Parked hardening: none

## Verification

Focused checks:

```bash
npm --prefix web run test:admin-access-ledger # PASS
npm --prefix web run lint # PASS
node web/scripts/audit-test-enrollment.mjs # PASS
```

Full local gate:

```bash
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan + CI/script enrollment | ~75 |
| SQL + helper | ~189 |
| Admin route/page wiring | ~55 |
| Test | ~169 |
| Total | ~488 |

This is above the 400-LOC soft cap because the ledger needs the SQL table, the runtime helper, route wiring, and an enrolled sandbox test in the same slice to be reviewable.
