# HARDENING.md

Park non-blocking hardening discoveries here when they are not required for the
current slice to function. Newest entries first.

**Do not** use this file to defer issues that break the slice's real flow, the
`AGENTS.md` contract, CI, security, or data truthfulness — those are fixed inline
or the slice stops (see `AGENTS.md §2e`).

When starting a slice, scan this file for entries touching the same files/area.
Fix only entries required for that slice to function; otherwise leave them parked
and note in the plan's `Deferred` section that they were considered. Promote a
parked entry into a slice's scope when it becomes the reason that slice exists
(typically a `Production hardening` phase). Periodically drain stale entries.

This is distinct from `PATTERNS.md`: that logs **workflow/process friction** (the
PR discipline itself biting); this logs **deferred product/code risk** from a slice.

## Entry Format

```md
## YYYY-MM-DD

### <SHORT-TITLE>
- File/location:
- Description:
- Why it matters:
- Effort: S / M / L
- Category: correctness / polish / tech-debt / security
- Found during:
```

## Parked Items

## 2026-05-25

### DEFLECTION-INTAKE-RATELIMIT-1 — direct-to-blob intake endpoints are unauthenticated + unthrottled
- File/location: `web/src/app/api/gap-report-intake/upload/route.ts` + `web/src/app/api/gap-report-intake/record/route.ts`.
- Description: The direct-to-blob flow exposes two open POST endpoints — `/upload` (mints a short-lived Vercel Blob client token) and `/record` (persists + emails). Both validate metadata and cap content-type/size (50 MB), and `/record` confirms blob ownership via `head()`, but neither is rate-limited. An attacker could mint many tokens or spam record submissions. Acceptable at first-5-design-partner volume; add a rate limit (IP/token bucket or Vercel WAF) before broader launch.
- Why it matters: open lead-form endpoints; bounded today by size/content-type/ownership checks but no abuse throttle.
- Effort: M
- Category: security
- Found during: PR-Intake-Direct-Blob.

### DEFLECTION-BADGE-1 — result badge is a static "Illustrative · sample dataset"
- File/location: `web/src/components/deflection-demo/DeflectionDemo.tsx` (the `phase === 'result'` header badge).
- Description: The result-block badge is hard-coded "Illustrative · sample dataset" — correct while the demo answers from the local dataset, but once `DEFLECTION_SEARCH_ATLAS_BASE_URL` is set and the route returns real Atlas rows it mislabels real data. Fix needs a `source: 'local' | 'atlas'` flag on the search response so the component labels accordingly.
- Why it matters: avoids labeling real customer data "illustrative" (or vice-versa) once the env is live. Cosmetic until then.
- Effort: S
- Category: polish
- Found during: PR-Deflection-Atlas-Wiring (3c).

## 2026-05-23

### DEFLECTION-GOLIVE-1 — RESOLVED (3c) — Atlas deflection-search proxy go-live gate
- File/location: `web/src/app/api/demo/deflection-search/route.ts` (`mapAtlasMatch` + the `GET` handler).
- Description: Close **all four** before any Atlas env (`DEFLECTION_SEARCH_ATLAS_BASE_URL`) is configured: (1) full `mapAtlasMatch` shape validation — every field the UI renders incl. `riskSignals[]`, the string fields, and `improved.actions` as an array — reject malformed → `502`; (2) outer `catch` → a generic message (it currently returns raw `error.message`, which can leak the upstream hostname on a Node `fetch` network failure; the token stays header-only); (3) length-cap `q` (currently only trimmed → forwarded to Atlas unbounded); (4) an `AbortController` timeout on the upstream fetch (a hung Atlas hangs the request; the client has no timeout either).
- Why it matters: the proxy path is inert today (no env), but the moment Atlas is wired a shallow/incomplete upstream object can crash the demo's `doc.actions.map` render with no error boundary, instead of the intended `502`. Migrated here from `PATTERNS.md`.
- Effort: M
- Category: security / correctness
- Found during: PR-Deflection-Demo-Backend-Seam (#66). Blocked upstream: the Atlas `faq-deflection-search` route did not exist yet, and Atlas owns + must lock the response contract before this gate closes (build `mapAtlasMatch` only against a real sample payload, never a guessed shape).
- Resolved: PR-Deflection-Atlas-Wiring (3c) closed all four once Atlas locked the contract — full `mapAtlasMatch` field validation, generic outer-catch with server-side logging (no upstream-host leak), 256-char `q` cap, and an 8s `AbortController` timeout. Remaining to go live = config only: set `DEFLECTION_SEARCH_ATLAS_BASE_URL` + `DEFLECTION_SEARCH_ATLAS_AUTH_TOKEN` to a deployed host + a B2B-growth JWT whose account has approved rows.
