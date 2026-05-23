# Plan: Support Ticket Deflection demo — backend seam (slice 2c, contract-first)

The demo's search currently resolves in-memory from `DEMO_ISSUES`. This slice
turns the seam into a real same-origin route handler that answers from the local
dataset today and proxies a live Atlas deflection-search endpoint the moment two
env vars are set — so wiring the real backend later is a one-file change with
zero client diff. The Atlas endpoint isn't live yet, so this is contract-first:
it defines and documents the exact wire + upstream contract.

## Why this slice exists

- The operator will host the real searchable dataset in the Atlas repo and wants
  the demo "modular and easy to plug into a backend." Slice 1 left
  `searchDeflection` as the seam; this makes the seam a real network boundary.
- Doing it contract-first (route handler + documented contract + local fallback)
  is not blocked on the Atlas endpoint existing: the demo keeps working on
  illustrative data, and the operator fills in one adapter when the endpoint is
  ready.
- It matches the repo's established pattern: client demos call same-origin
  `/api/demo/*` route handlers (e.g. `DocClassificationDemo` → `/api/demo/classify-doc`),
  and Atlas integration uses **server-only** env (see `audit-intake.ts`'s
  `AUDIT_INTAKE_ATLAS_BASE_URL` / `_AUTH_TOKEN`) — never a public URL/token.

## Scope (this PR)

1. Add a GET route handler `/api/demo/deflection-search?q=…` that returns
   `{ match: DeflectionIssue | null }`: proxies Atlas when configured, else
   answers from the local matcher. Includes a named `mapAtlasMatch` adapter +
   light validation.
2. Refactor `deflection-demo.ts`: extract the current matching logic into a pure,
   server-importable `matchLocal`; rewrite `searchDeflection` to fetch the route
   handler (same signature/return type); add the `DeflectionSearchResponse` type.

### Files touched

- `web/plans/PR-Deflection-Demo-Backend-Seam.md` — this plan doc (new)
- `web/src/lib/deflection-demo.ts` — extract `matchLocal`, fetch-based `searchDeflection`, wire type
- `web/src/app/api/demo/deflection-search/route.ts` — the route handler + Atlas proxy seam (new)

## Mechanism

- **Wire contract:** `GET /api/demo/deflection-search?q=<query>` → `200
  { match: DeflectionIssue | null }`. Empty `q` → `{ match: null }`.
- **Route handler** (`runtime = 'nodejs'`, `dynamic = 'force-dynamic'`): reads `q`;
  if `DEFLECTION_SEARCH_ATLAS_BASE_URL` is set, server-side `fetch`es
  `${base}?q=…` (adding `Authorization: Bearer <DEFLECTION_SEARCH_ATLAS_AUTH_TOKEN>`
  when present, `cache: 'no-store'`), then runs the response through
  `mapAtlasMatch`; on a non-2xx upstream or a malformed payload it returns **502**.
  With no env set it returns `{ match: matchLocal(q) }`. Unexpected errors → 500.
- **`mapAtlasMatch(raw)`** is a named adapter, not a comment: today it expects
  Atlas to return the wire shape and validates the match has `intent` /
  `ticketsPerMonth` / both doc fields; it carries a `TODO(2c-finalize)` to fill in
  Atlas's real shape. That is the *only* edit needed to go live.
- **`searchDeflection`** keeps its `(query) => Promise<DeflectionIssue | null>`
  signature, so the client component is untouched: it now `fetch`es the route and
  unwraps `data.match`, throwing on a non-ok response (the component already
  recovers to its retryable `'error'` phase).

## Intentional

- **Search now does a same-origin network round-trip even with no Atlas env.**
  This is the point, not an accident: it exercises the component's debounce /
  request-id / error-recovery paths in dev exactly as production will, and makes
  the Atlas swap a single-file change in the route handler with **zero
  client-component diff**.
- **Server-only env, route-handler proxy** (not a `NEXT_PUBLIC_` client fetch):
  keeps the Atlas URL + token off the client, avoids CORS, matches `audit-intake.ts`.
- **Contract documented in tracked files** (route-handler doc-comment + this plan),
  not `.env.local.example` — that file is gitignored here, so it can't carry the
  contract into review.
- **`mapAtlasMatch` validates rather than passes through** — a malformed upstream
  payload yields a clean 502, never rendered garbage.

## Deferred

- Fill in `mapAtlasMatch` for Atlas's real response shape + point the env at the
  live endpoint (the operator brings the URL + a sample payload).
- The top-10 issue table (held for the real dataset, per the operator).
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` clean; `npm --prefix web run build` compiles —
  the route registers and the demo page still prerenders.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  3 == 3 + diff-size).
- Browser spot-check (no env set): the demo search + chips still return matches
  (now via the route handler → local matcher); clear/empty returns idle.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `route.ts` handler + `mapAtlasMatch` + proxy | ~78 |
| `deflection-demo.ts` extract + fetch rewrite + type | ~69 |
| this plan doc | ~95 |
| **Total** | ~242 |

Under the 400-LOC soft cap.
