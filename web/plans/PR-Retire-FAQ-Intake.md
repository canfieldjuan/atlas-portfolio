# Plan: Retire the orphaned ai-content-ops/intake (redirect to the deflection intake)

The FAQ Report is retired (rebranded to Support Ticket Deflection). Its intake at
`/systems/ai-content-ops/intake` is an **orphaned, FAQ-branded duplicate** of the
deflection intake — same `SupportTicketCsvIntakePage` component, same
`gap-report-intake` API, just "FAQ Snapshot" naming — and **nothing links to it**.
Retire it via a permanent redirect to the canonical deflection intake.

## Why this slice exists

- `ai-content-ops/intake/page.tsx` renders the shared intake component with
  retired-FAQ props (`snapshotName: 'FAQ Snapshot'`, `backLabel: 'Back to FAQ
  Report'`, `'one sample FAQ entry'`). The FAQ Report no longer exists as an
  offer; this surface is stale and unreferenced (a repo grep finds no inbound
  link — only its own metadata + the `no-chrome-routes` entry).
- Rebranding it would produce two byte-identical intakes (same component + API)
  at two URLs — maintenance debt. Retiring + redirecting consolidates to one
  canonical intake and preserves any old links/bookmarks (operator decision).

## Scope (this PR)

Slice phase: Product polish

1. **Permanent redirect** (`next.config.ts`): add `async redirects()` mapping
   `/systems/ai-content-ops/intake` → `/systems/support-ticket-deflection/intake`
   with `permanent: true` (308; redirects are checked before the filesystem).
2. **Delete the orphaned route** (`ai-content-ops/intake/page.tsx` + `layout.tsx`)
   — the redirect supersedes them; removing them avoids a dead FAQ-branded surface.
3. **Drop the stale `no-chrome-routes` entry** (`src/lib/no-chrome-routes.ts`):
   remove `'/systems/ai-content-ops/intake'` (the hub `'/systems/ai-content-ops'`
   stays).

### Files touched

- `web/plans/PR-Retire-FAQ-Intake.md` — this plan doc (new)
- `web/next.config.ts` — add the permanent redirect
- `web/src/lib/no-chrome-routes.ts` — remove the retired intake route
- `web/src/app/systems/ai-content-ops/intake/page.tsx` — deleted (orphaned FAQ intake)
- `web/src/app/systems/ai-content-ops/intake/layout.tsx` — deleted (its metadata)

## Mechanism

- `redirects()` returns `[{ source, destination, permanent: true }]`; Next checks
  redirects before the filesystem, so the old path 308s to the deflection intake
  even before the files are gone — deleting them just removes the dead source.
- `no-chrome-routes` is per-route opt-in for hiding nav chrome; the deleted route
  no longer needs its entry (the destination already has its own).

## Intentional

- **Redirect, not rebrand.** Rebranding clones the existing deflection intake;
  the redirect consolidates to one intake and keeps old links alive (308 = cached
  permanent). Operator chose retire-via-redirect.
- **Deletes 2 tracked files** — authorized by the operator's "retire via redirect"
  choice; they're orphaned (no inbound links) and superseded by the redirect.
- **The hub (`/systems/ai-content-ops`) and its `no-chrome` entry stay** — only
  the intake child is retired. Its own stale window/"FAQ Snapshot" naming is moot
  once the route is gone.

## Deferred

- Acq-pack outbound message templates "90 days" → 3–6mo; hero "self-serve" vs
  "self-service" (1-word); the 4 MB intake upload cap vs the 3–6-month ask.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 5 == 5 + diff-size).
- `npm run lint` / `tsc --noEmit` clean.
- **`npm run build` succeeds** and **no longer lists** `/systems/ai-content-ops/intake`
  as a route (it's a redirect now); the build registers the redirect.
- Manual: a request to `/systems/ai-content-ops/intake` 308s to
  `/systems/support-ticket-deflection/intake`.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `next.config.ts` (redirects) | ~12 |
| `no-chrome-routes.ts` (drop entry) | ~1 |
| delete `intake/page.tsx` + `layout.tsx` | ~40 |
| this plan doc | ~92 |
| **Total** | ~145 |

Well under the 400-LOC soft cap.
