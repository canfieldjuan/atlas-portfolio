# Uploaded Deflection Search Go-Live

## Why this slice exists

PR #341 added the portfolio uploaded-report search workbench, but kept it dark
behind `DEFLECTION_UPLOADED_SEARCH_ENABLED=true` because ATLAS did not yet have
the matching request-scoped search endpoint. ATLAS PR #1747 shipped
`POST /content-ops/deflection-reports/{request_id}/search`, and ATLAS PR #1748
hardened the backend admission gate to the exact portfolio renderable item shape.

The next small slice is the portfolio go-live switch: show and allow uploaded
report search when the server already has the ATLAS base URL and service token,
without requiring a separate positive feature flag. Operators still need a kill
switch if the endpoint regresses.

## Scope (this PR)

Slice phase: Functional validation

1. Replace the positive-only uploaded search flag check with a shared server-side
   enablement helper.
2. Enable uploaded report search automatically when `ATLAS_API_BASE_URL` and
   `ATLAS_B2B_SERVICE_TOKEN` are configured, while `DEFLECTION_UPLOADED_SEARCH_ENABLED=false`
   still disables it.
3. Keep `DEFLECTION_UPLOADED_SEARCH_ENABLED=true` as an explicit override for
   preview/local setups that intentionally test the route before credentials are
   fully configured.
4. Extend the uploaded-search smoke test so the route and unlocked report page
   cover configured, disabled, and explicitly enabled states.

### Files touched

- `web/plans/PR-Uploaded-Deflection-Search-Golive.md` — this plan doc.
- `web/src/lib/deflection-uploaded-search-config.ts` — shared server-only enablement helper.
- `web/src/app/api/demo/deflection-search/route.ts` — use the shared helper for the POST proxy.
- `web/src/components/landing/DeflectionReportModelPage.tsx` — use the shared helper for showing the unlocked workbench.
- `web/scripts/test-deflection-uploaded-search.mjs` — go-live enablement coverage.

## Mechanism

Add a tiny server-only helper that reads:

- `DEFLECTION_UPLOADED_SEARCH_ENABLED=false` as an explicit off switch;
- `DEFLECTION_UPLOADED_SEARCH_ENABLED=true` as an explicit on switch;
- otherwise, enables only when both `ATLAS_API_BASE_URL` and
  `ATLAS_B2B_SERVICE_TOKEN` are non-empty.

Both the same-origin POST route and the unlocked report-model page call the same
helper, so the page does not render a dead workbench in production-like
misconfiguration and the route does not accept uploaded search while the visible
surface is disabled.

## Intentional

- No copy or layout changes. This is a go-live/config slice only.
- The public sample demo GET route remains local and unaffected.
- The kill switch is a negative value (`false`) so production can disable the
  workbench quickly without removing ATLAS credentials used by snapshots,
  artifacts, checkout, or other deflection flows.

## Deferred

- Live deployed smoke against a real paid report remains a follow-up once the
  deployed portfolio and ATLAS environments have both rolled out.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-uploaded-search` — passed.
- `npm --prefix web ci` — passed; installed local worktree dependencies after
  the fresh worktree inherited an out-of-root `node_modules` symlink.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Uploaded-Deflection-Search-Golive.md` | ~84 |
| `web/src/lib/deflection-uploaded-search-config.ts` | ~10 |
| `web/src/app/api/demo/deflection-search/route.ts` | ~7 |
| `web/src/components/landing/DeflectionReportModelPage.tsx` | ~7 |
| `web/scripts/test-deflection-uploaded-search.mjs` | ~61 |
| **Total** | **~169** |
