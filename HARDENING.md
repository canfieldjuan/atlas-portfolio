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

## 2026-05-23

### DEFLECTION-GOLIVE-1 — Atlas deflection-search proxy go-live gate
- File/location: `web/src/app/api/demo/deflection-search/route.ts` (`mapAtlasMatch` + the `GET` handler).
- Description: Close **all four** before any Atlas env (`DEFLECTION_SEARCH_ATLAS_BASE_URL`) is configured: (1) full `mapAtlasMatch` shape validation — every field the UI renders incl. `riskSignals[]`, the string fields, and `improved.actions` as an array — reject malformed → `502`; (2) outer `catch` → a generic message (it currently returns raw `error.message`, which can leak the upstream hostname on a Node `fetch` network failure; the token stays header-only); (3) length-cap `q` (currently only trimmed → forwarded to Atlas unbounded); (4) an `AbortController` timeout on the upstream fetch (a hung Atlas hangs the request; the client has no timeout either).
- Why it matters: the proxy path is inert today (no env), but the moment Atlas is wired a shallow/incomplete upstream object can crash the demo's `doc.actions.map` render with no error boundary, instead of the intended `502`. Migrated here from `PATTERNS.md`.
- Effort: M
- Category: security / correctness
- Found during: PR-Deflection-Demo-Backend-Seam (#66). Blocked upstream: the Atlas `faq-deflection-search` route does not exist yet, and Atlas owns + must lock the response contract before this gate closes (build `mapAtlasMatch` only against a real sample payload, never a guessed shape).
