# Plan: Wire the results page to the live ATLAS snapshot (Slice A1)

Swaps the results page's preview fixture for the **live** deflection snapshot from
the deployed ATLAS API. First half of the gated slice (the submit wiring + the
Stripe/`/artifact` unlock are separate follow-ups). Verified end-to-end against a
real `request_id` on the deployed API.

## Why this slice exists

- The free-state results page (#149) rendered a fixture. ATLAS's snapshot endpoint
  + the service account are now live (smoke green: submit 200 / snapshot 200 /
  artifact 403), so the page can show the buyer their **real** ranked questions.

## Scope (this PR)

Slice phase: Functional validation

1. **`lib/atlas-deflection-client.ts`** (new) — server-only ATLAS client.
   `fetchDeflectionSnapshot(requestId)` reads `ATLAS_API_BASE_URL` + `ATLAS_B2B_JWT`
   from env, fetches `GET /api/v1/content-ops/deflection-reports/{id}/snapshot`,
   and returns a discriminated result. Go-live-gate discipline: bounded request id
   (`^[A-Za-z0-9._-]{1,128}$`), 10s `AbortController` timeout, **full upstream-shape
   validation** (reject malformed → `error`), generic errors (never leak host/token).
   `404 → not_found`, missing env → `not_configured`.
2. **`lib/deflection-snapshot.ts`** — fix `deflectionSnapshotPath` to include the
   real `/api/v1` prefix (it was `/content-ops/...`; the deployed path is
   `/api/v1/content-ops/...` — this was the cause of the first 502 in verification).
3. **`results/[requestId]/page.tsx`** — `getSnapshot` now calls the client:
   `ok → render`, `not_configured → fixture` (local/preview without secrets),
   `not_found → notFound()`, `error → throw` (error page).

### Files touched

- `web/plans/PR-Deflection-Snapshot-Live-Fetch.md` — this plan doc (new)
- `web/src/lib/atlas-deflection-client.ts` — server-only ATLAS snapshot client (new)
- `web/src/lib/deflection-snapshot.ts` — `deflectionSnapshotPath` `/api/v1` prefix fix
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` — live `getSnapshot`

## Mechanism

- Server-only by usage: the client is imported only by the server route, and
  `ATLAS_B2B_JWT` is a non-`NEXT_PUBLIC_` var, so the token is never in a browser
  bundle even if mis-imported. (No `server-only` pkg dep added — not installed here.)
- The presentation component (`DeflectionResultsPage`) is unchanged — it renders a
  `DeflectionSnapshot` identically whether the data is live or the fixture.

## Intentional

- **Fixture fallback on `not_configured`** keeps preview deploys (no secrets)
  rendering for review; live everywhere the env is set.
- **Did NOT touch** the artifact/full-report render (a parallel slice) or the intake
  submit wiring (Slice A2) — kept tightly scoped to the snapshot fetch to minimize
  collision with the concurrent artifact-render work.
- Token is a login JWT (expires) — fine for now; production refresh-from-credentials
  is a later pass.

## Deferred

- **Slice A2:** wire the intake upload → ATLAS `/submit` (signed blob URL) → route
  to `/results/{request_id}`.
- **Slice B:** Stripe Checkout Session on the unlock CTA + `/artifact` probe-with-
  retry on return + the unlocked full-report render.

Parked hardening: none.

## Verification

- `tsc --noEmit` = 0; `npm run lint` = 0; `npm run build` green (route compiles `ƒ`).
- **Live end-to-end (dev server against the deployed ATLAS):** `GET /results/content-ops-50f865…`
  → **HTTP 200**, renders the real snapshot (hook "We found **3** repeat questions",
  the real "export attribution … board meeting" question) — **not** the fixture.
  The first attempt surfaced the `/api/v1` path bug as a 502, which the client
  correctly turned into a 500 error page; after the path fix → 200 + live data.
- `bash scripts/pre_push_audit.sh origin/main` green (plan + files-touched 3 == 3).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| atlas-deflection-client.ts (new) | ~95 |
| deflection-snapshot.ts path fix | ~2 |
| results route getSnapshot | ~12 |
| this plan doc | ~80 |
| **Total** | ~189 |

Under the 400-LOC soft cap.
