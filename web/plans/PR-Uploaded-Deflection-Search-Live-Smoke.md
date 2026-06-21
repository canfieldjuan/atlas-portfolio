# Uploaded Deflection Search Live Smoke

## Why this slice exists

PR #342 enabled uploaded report search outside production, and kept production
explicit-on until the deployed upload-to-search path is proven. The repo already
has submit, paid unlock, and hosted render smokes; it does not have the final
operator command that posts to the portfolio uploaded-search route and verifies
the response comes from ATLAS with a renderable FAQ item.

## Scope (this PR)

Slice phase: Functional validation

1. Add a manual uploaded-search smoke CLI for deployed portfolio URLs.
2. Validate request id, query, base URL, HTTP 200, `source: "atlas"`, and the
   renderable item fields the report UI depends on.
3. Keep smoke output low-sensitivity: shape/count metadata only, no matched
   question, answer, evidence quotes, or source labels.
4. Add the package script and cover the helper in the existing uploaded-search
   test script.

### Files touched

- `web/plans/PR-Uploaded-Deflection-Search-Live-Smoke.md` — this plan doc.
- `web/package.json` — manual smoke script entry.
- `web/scripts/smoke-deflection-uploaded-search.mjs` — deployed uploaded-search smoke.
- `web/scripts/test-deflection-uploaded-search.mjs` — focused smoke helper coverage.

## Mechanism

The smoke accepts `--request-id`, `--query`, and optional `--base-url`
(`https://juancanfield.com` by default), then POSTs `{ requestId, q }` to
`/api/demo/deflection-search`. It fails closed unless the route returns HTTP
200, `source: "atlas"`, and a positive renderable `match` item with the fields
the report search UI maps directly: topic/question/answer strings, numeric
ticket/opportunity fields, string arrays for steps/action/source metadata, and
term-mapping rows.

The JSON artifact records route URL, request id, query length, and shape/count
metadata for the item. It does not print or persist matched content.

## Intentional

- This does not submit a CSV or unlock payment. It composes after the existing
  live submit and paid unlock smokes.
- This does not flip production `DEFLECTION_UPLOADED_SEARCH_ENABLED`; operators
  still choose when the production explicit-on flag is safe.
- This hits the portfolio route instead of ATLAS directly because the target is
  the customer-visible wiring, including feature gating and paid-access checks.

## Deferred

- End-to-end submit + unlock + uploaded search orchestration remains manual
  because live Checkout completion can require operator/browser action.

Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-uploaded-search` — passed.
- `node web/scripts/smoke-deflection-uploaded-search.mjs --help` — passed;
  confirmed the operator command renders the expected usage and safety text.
- `npm --prefix web ci` — passed; installed dependencies inside this fresh
  worktree before the full local review gate.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Uploaded-Deflection-Search-Live-Smoke.md` | ~79 |
| `web/package.json` | ~1 |
| `web/scripts/smoke-deflection-uploaded-search.mjs` | ~241 |
| `web/scripts/test-deflection-uploaded-search.mjs` | ~131 |
| **Total** | **~452** |

This is over the 400-LOC soft cap because the slice adds both the operator smoke
and its fail-closed helper coverage; splitting would leave the smoke untested.
