# Plan: Remove the legacy 4 MB POST intake route

Now that the direct-to-blob intake is verified working end-to-end in production
(#88 → #103), retire the old `POST /api/gap-report-intake` fallback. It was kept
one cycle as a safety net; the client no longer calls it, and as an open,
unthrottled endpoint that writes blobs + sends emails it's pure attack surface.

## Why this slice exists

- The client (`SupportTicketCsvIntakePage.tsx`) uploads via `/upload` → `/record`
  (the 50 MB direct-to-blob path), not the old `route.ts` POST. Verified: nothing
  fetches `/api/gap-report-intake` (only `/upload` + `/record`), no test or
  `next.config` redirect references it, nothing imports the route module. It's a
  dead, 4 MB-capped, open POST that still `put()`s blobs (on the wrong default
  store now) and sends emails — an unused abuse vector worth closing.

## Scope (this PR)

Slice phase: Production hardening

1. **Delete** `web/src/app/api/gap-report-intake/route.ts` (the legacy POST handler).
   The `/upload` + `/record` subroutes are untouched; `/api/gap-report-intake`
   itself now 404s, which is correct (nothing uses it).

### Files touched

- `web/plans/PR-Remove-Legacy-Intake-POST.md` — this plan doc (new)
- `web/src/app/api/gap-report-intake/route.ts` — deleted (legacy POST)

## Mechanism

- Pure removal. The shared lib exports the route used (`recordGapReportSubmission`
  still used by `/record`; `isSupportPlatform` still used by
  `parseGapReportMetadata`), so nothing is orphaned. `put` from `@vercel/blob` was
  only used here and is now unused (no remaining `put()` call) — the SDK stays a
  dep for `del`/`list`/`head`/`handleUpload`.

## Intentional

- **Safe to delete now, not before** — kept one cycle as a fallback until the new
  flow was verified green on the deploy (now done, #103 + e2e).
- **No client/redirect change** — the client already targets `/upload` + `/record`;
  removing the index route doesn't affect them or the #87 page redirect.

## Deferred

- **Rate-limit `/upload` + `/record`** (HARDENING `DEFLECTION-INTAKE-RATELIMIT-1`)
  — separate slice; needs an approach decision (Vercel WAF vs a KV/Upstash limiter)
  since the repo has no rate-limit infra. Acceptable at current volume per the
  HARDENING note.
- Operator: delete the orphaned private Blob store when possible.

Parked hardening: none.

## Verification

- `tsc --noEmit` / `npm run lint` clean (no dangling refs to the removed route);
  `npm run build` succeeds and no longer lists `ƒ /api/gap-report-intake` (only
  `/upload` + `/record`).
- `pre_push_audit` green (plan shape + files-touched 2 == 2 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| delete `route.ts` (legacy POST) | ~160 (deletion) |
| this plan doc | ~60 |
| **Total** | ~220 |

Mostly a deletion; well within scope.
