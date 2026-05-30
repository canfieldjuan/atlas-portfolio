# Plan: Google Ads keyword ideas + search-volume lookup

Adds a read-only Keyword Planner lookup to the existing Google Ads kit — seed
keywords (or a URL) → keyword ideas with avg monthly searches + competition.
Reuses the kit's existing OAuth/auth plumbing; the kit previously only did
campaign `:mutate` + `:search`, with no keyword/volume capability.

## Why this slice exists

- Operator does hand-researched low-volume/high-intent keyword work
  [[deflection-keyword-strategy]]; this automates the volume side. The Google Ads
  API `KeywordPlanIdeaService.generateKeywordIdeas` returns exactly that, and the
  kit's auth (refresh token, developer token, customer id) is already wired + live.

## Scope (this PR)

Slice phase: Vertical slice

1. **`scripts/google-ads-api.mjs`** — `generateKeywordIdeas(accessToken, apiVersion,
   customerId, requestBody, options)`: POST `customers/{id}:generateKeywordIdeas`,
   same fail-closed pagination contract as `googleAdsSearch` (refuse silent
   truncation, page-cap, repeat-token guard).
2. **`scripts/google-ads-artifact-contracts.mjs`** — add `KEYWORD_IDEAS: 1` to the
   versions map (the type + contract-test coverage auto-derive from it).
3. **`scripts/generate-google-ads-keyword-ideas.mjs`** (new CLI) — mirrors the
   read-only `report-google-ads-performance` pattern: `--keywords`/`--url` seed,
   `--geo`/`--language`/`--network`/`--limit`, dry-run, env validation, refresh
   token, the call, map to `{keyword, avgMonthlySearches, competition,
   competitionIndex, low/highTopOfPageBidUsd}` ranked by volume, text + JSON
   artifact output. Read-only (refuses `--execute`).
4. **`package.json`** — `ads:google:keywords` npm script.
5. **`scripts/test-google-ads-artifact-contracts.mjs`** — dry-run spawn-test
   (asserts the request-body shape + artifact version) + a no-seed fail-closed test.

### Files touched

- `web/plans/PR-Google-Ads-Keyword-Ideas.md` — this plan doc (new)
- `web/scripts/google-ads-api.mjs` — `generateKeywordIdeas`
- `web/scripts/google-ads-artifact-contracts.mjs` — `KEYWORD_IDEAS` version
- `web/scripts/generate-google-ads-keyword-ideas.mjs` — the CLI (new)
- `web/package.json` — `ads:google:keywords` script
- `web/scripts/test-google-ads-artifact-contracts.mjs` — dry-run + no-seed tests

## Mechanism

- Defaults US (geoTargetConstants/2840) + English (languageConstants/1000);
  overridable. Seeds via `keywordSeed`, `urlSeed`, or `keywordAndUrlSeed`.
- Read-only: only `refreshAccessToken` + `generateKeywordIdeas`. No mutations.

## Intentional

- Mirrors the kit's established read-only-report shape exactly (args, dry-run,
  fail-closed, artifact wrapper) rather than inventing a new pattern.
- Volume is averaged/bucketed by Keyword Planner — fine for the low-volume
  long-tail terms the operator targets; documented in the usage text.

## Deferred

- **Pre-existing (NOT this slice):** `scripts/test-google-ads-api.mjs`
  `testMultiPageAggregation` asserts `call.body.pageSize === 2`, but `googleAdsSearch`
  intentionally stopped sending `pageSize` in the v22 change — so that test fails on
  `origin/main` too (confirmed by reverting my change). It isn't CI-gated (no
  workflow runs these tests), which is why it lingered. Out of scope here (no
  rides-along); worth a separate fix.

Parked hardening: none.

## Verification

- `npm run lint` = 0; `npm run test:google-ads-artifacts` passes (incl. the new
  dry-run + no-seed tests); dry-run prints the built request without API calls.
- **Live (real credentials):** the CLI authenticated, built the request, and called
  `generateKeywordIdeas` against the live account — the call path works end-to-end.
  It returned **403 PERMISSION_DENIED** ("the caller does not have permission"),
  which the script surfaces cleanly (fail-closed, sanitized). **This is an
  account/access config issue, not a code defect** — the account's developer-token
  tier or customer-id targeting needs Keyword Planner API access (campaign
  `:search`/`:mutate` work on the same creds, so auth is valid; the Keyword Planner
  service specifically is denied). The success path (200 + real volumes) is
  therefore not yet verified — pending the operator enabling Keyword Planner API
  access on the account.
- `bash scripts/pre_push_audit.sh origin/main` + python files-touched audit green
  (files-touched 6 == 6).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| generateKeywordIdeas (api) | ~45 |
| KEYWORD_IDEAS version | ~1 |
| the CLI script | ~270 |
| npm script | ~1 |
| contract-test dry-run/no-seed | ~26 |
| this plan doc | ~85 |
| **Total** | ~428 |

Slightly over the 400-LOC soft cap, dominated by the CLI script + plan doc; the
runtime change is contained.
