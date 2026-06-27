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

## 2026-06-03

### NPM-AUDIT-WEB-1 — web dependency audit findings
- File/location: `web/package-lock.json` / `web` dependency tree.
- Description: `npm --prefix web ci` reports 3 dependency audit findings (2
  moderate, 1 high). This slice does not change dependencies.
- Why it matters: dependency vulnerabilities can become deploy-time security
  exposure, but resolving them may require package upgrades outside this
  teaser-copy slice.
- Effort: M
- Category: security
- Found during: PR-Deflection-Teaser-Rank-Copy.
- Resolved high-severity portion: PR-Web-Dependency-Audit-Burndown updates
  `next`, `eslint-config-next`, and compatible transitive packages so
  `npm --prefix web audit --audit-level=high` passes. Full audit still reports
  two moderate `next` -> vendored `postcss` findings; npm's only suggested fix
  is a breaking downgrade to `next@9.3.3`, so keep those parked until Next ships
  a compatible patched dependency.

## 2026-06-01

### DEFLECTION-CALC-INPUT-RESYNC-1 — RESOLVED — sibling calculators can show out-of-range typed values after clamp
- File/location: `web/src/components/deflection-demo/SupportTaxCalculator.tsx` and `web/src/components/deflection-demo/ThirtySecondCalculator.tsx`.
- Description: The sibling calculator number-input commit patterns clamp out-of-range typed values into state but do not always write the clamped value back to the DOM input. If the clamped value equals current state, React can skip re-render and leave the visible typed value out of sync with slider/output state.
- Why it matters: a user can type an out-of-range value, blur, and see an input value that does not match the computed calculator output.
- Effort: S
- Category: polish
- Found during: PR-Deflection-Mini-Calculator review (#180).
- Resolved: PR-Deflection-Calculator-Input-Resync writes the clamped value back
  to the visible number input in both sibling calculator components after
  calling `onChange`.

## 2026-05-28

### DEFLECTION-INTAKE-PII-1 — RESOLVED — raw CSV (with PII) uploaded to a PUBLIC Vercel Blob before any redaction
- File/location: `web/src/components/landing/SupportTicketCsvIntakePage.tsx:100-116` (the `upload(...)` call with `access: 'public'`), esp. `:115`.
- Description: The browser uploads the raw CSV directly to Vercel Blob with `access: 'public'` before any server step runs, and there is no PII-redaction code anywhere in the intake path (`web/src/lib/`, `web/src/app/api/gap-report-intake/`). If a customer cannot strip PII before upload, their raw file (names / emails / phone numbers) lands at a publicly-reachable Blob URL for the 30-day retention window — gated only by URL obscurity (timestamp + company slug), not auth. The prior copy claimed "we drop PII in our intake step"; PR #116 removed that false claim (now recommends self-stripping) but does not change the storage.
- Why it matters: confirmed live customer-PII-in-public-storage. PR #116 stopped the copy from *lying* about it, but the exposure itself remains — security + data-truthfulness.
- Effort: M
- Category: security
- Found during: PR-Offer-Spec (#116) — Codex P1. Also tracked as issue #117.
- Fix: upload raw CSVs to a PRIVATE / token-gated Blob store (not `access: 'public'`), and/or redact PII before the Blob upload (client-side or a pre-store server step); then the privacy copy can be made strong again. Given it is confirmed-live customer PII, prioritize over routine parking and consider interim mitigation.
- Resolved: PR-Private-Deflection-CSV-Uploads changes the client upload to
  `access: 'private'`, stops emailing the blob URL as a public download link, and
  adds an authenticated `/admin/intake/gap-report/[requestId]/csv` route that
  streams the private blob with the server-side Blob token.

## 2026-05-25

### DEFLECTION-INTAKE-RATELIMIT-1 — RESOLVED (Vercel WAF) — direct-to-blob intake endpoints are unauthenticated + unthrottled
- File/location: `web/src/app/api/gap-report-intake/upload/route.ts` + `web/src/app/api/gap-report-intake/record/route.ts`.
- Description: The direct-to-blob flow exposes two open POST endpoints — `/upload` (mints a short-lived Vercel Blob client token) and `/record` (persists + emails). Both validate metadata and cap content-type/size (50 MB), and `/record` confirms blob ownership via `head()`, but neither is rate-limited. An attacker could mint many tokens or spam record submissions. Acceptable at first-5-design-partner volume; add a rate limit (IP/token bucket or Vercel WAF) before broader launch.
- Why it matters: open lead-form endpoints; bounded today by size/content-type/ownership checks but no abuse throttle.
- Effort: M
- Category: security
- Found during: PR-Intake-Direct-Blob.
- Resolved: Operator added a **Vercel Firewall (WAF) rate-limit rule** 2026-05-27 — per-IP, Request Path starts-with `/api/gap-report-intake/` AND method POST → Rate Limit 10 req / 60s → Deny (429). Edge-enforced, covers both `/upload` + `/record`. **Handled at the edge by design — there is NO app-level limiter in code** (repo has no rate-limit infra, and the WAF rule needs no backing store). If the WAF rule is ever removed, this re-opens; the code fallback would be `@upstash/ratelimit` (Vercel KV / Upstash) in both routes.

### DEFLECTION-BADGE-1 — RESOLVED — result badge is a static "Illustrative · sample dataset"
- File/location: `web/src/components/deflection-demo/DeflectionDemo.tsx` (the `phase === 'result'` header badge).
- Description: The result-block badge is hard-coded "Illustrative · sample dataset" — correct while the demo answers from the local dataset, but once `DEFLECTION_SEARCH_ATLAS_BASE_URL` is set and the route returns real Atlas rows it mislabels real data. Fix needs a `source: 'local' | 'atlas'` flag on the search response so the component labels accordingly.
- Why it matters: avoids labeling real customer data "illustrative" (or vice-versa) once the env is live. Cosmetic until then.
- Effort: S
- Category: polish
- Found during: PR-Deflection-Atlas-Wiring (3c).
- Resolved: PR-Deflection-Demo-Source-Badge adds `source: 'local' | 'atlas'` to
  successful demo-search responses and renders the result badge from that source.

## 2026-05-23

### DEFLECTION-GOLIVE-1 — RESOLVED (3c) — Atlas deflection-search proxy go-live gate
- File/location: `web/src/app/api/demo/deflection-search/route.ts` (`mapAtlasMatch` + the `GET` handler).
- Description: Close **all four** before any Atlas env (`DEFLECTION_SEARCH_ATLAS_BASE_URL`) is configured: (1) full `mapAtlasMatch` shape validation — every field the UI renders incl. `riskSignals[]`, the string fields, and `improved.actions` as an array — reject malformed → `502`; (2) outer `catch` → a generic message (it currently returns raw `error.message`, which can leak the upstream hostname on a Node `fetch` network failure; the token stays header-only); (3) length-cap `q` (currently only trimmed → forwarded to Atlas unbounded); (4) an `AbortController` timeout on the upstream fetch (a hung Atlas hangs the request; the client has no timeout either).
- Why it matters: the proxy path is inert today (no env), but the moment Atlas is wired a shallow/incomplete upstream object can crash the demo's `doc.actions.map` render with no error boundary, instead of the intended `502`. Migrated here from `PATTERNS.md`.
- Effort: M
- Category: security / correctness
- Found during: PR-Deflection-Demo-Backend-Seam (#66). Blocked upstream: the Atlas `faq-deflection-search` route did not exist yet, and Atlas owns + must lock the response contract before this gate closes (build `mapAtlasMatch` only against a real sample payload, never a guessed shape).
- Resolved: PR-Deflection-Atlas-Wiring (3c) closed all four once Atlas locked the contract — full `mapAtlasMatch` field validation, generic outer-catch with server-side logging (no upstream-host leak), 256-char `q` cap, and an 8s `AbortController` timeout. Remaining to go live = config only: set `DEFLECTION_SEARCH_ATLAS_BASE_URL` + `DEFLECTION_SEARCH_ATLAS_AUTH_TOKEN` to a deployed host + a B2B-growth JWT whose account has approved rows.
