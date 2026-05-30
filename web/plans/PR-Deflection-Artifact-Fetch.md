# Plan: Wire the results page to the live ATLAS artifact (paid-gated full report)

Replaces the route's `getArtifact` stub (returned `null`) with a live fetch of the
paid-gated full report from ATLAS, mirroring the verified snapshot-fetch pattern.
The render component (`DeflectionReportArtifactPage`) already landed; this wires
the data. Independent of the (pending) multipart submit slice.

## Why this slice exists

- The route already renders the artifact when present (artifact-first → else
  snapshot), but `getArtifact` was a stub. `GET /artifact` is deployed (403 unpaid),
  so we can wire + verify the locked→snapshot fall-through now.

## Scope (this PR)

Slice phase: Functional validation

1. **`lib/deflection-report-contract.ts`** — fix `deflectionArtifactPath` to include
   the real `/api/v1` prefix (it was `/content-ops/...` — the same omission the
   snapshot path had; would 502).
2. **`lib/atlas-deflection-client.ts`** — add `fetchDeflectionArtifact(requestId)`
   (server-only, reuses `atlasConfig`/`REQUEST_ID_RE`/timeout). Discriminated
   result: `200 → ok{artifact}` · `403 → locked` · `404 → not_found` ·
   missing env → `not_configured` · network/parse → `error`. **Validates the
   upstream shape** — top-level `markdown`/`summary`/`faq_result` plus a per-item
   check of every `TicketFAQItem` field the render reads (`topic/question/answer/
   steps/action_items/term_mappings/...`), since the render maps over those and a
   malformed item would crash it. Bounded id, 10s timeout, generic errors.
3. **`results/[requestId]/page.tsx`** — `getArtifact` calls the client and returns
   `result.ok ? artifact : null`. So `200 → render full report`; `403/404/error/
   not_configured → null → snapshot + unlock CTA` (the correct unpaid state).

### Files touched

- `web/plans/PR-Deflection-Artifact-Fetch.md` — this plan doc (new)
- `web/src/lib/deflection-report-contract.ts` — `deflectionArtifactPath` `/api/v1` fix
- `web/src/lib/atlas-deflection-client.ts` — `fetchDeflectionArtifact` + shape validation
- `web/src/app/systems/support-ticket-deflection/results/[requestId]/page.tsx` — live `getArtifact`

## Mechanism

- Same server-only client as the snapshot fetch; the JWT stays out of any browser
  bundle (non-`NEXT_PUBLIC_`). The artifact/full-report render component is
  unchanged — this only supplies its data.
- `403 (locked)` is the expected unpaid state and is NOT an error — it cleanly
  falls through to the snapshot, which carries the $1,500 unlock CTA.

## Intentional

- **`error`/`not_configured` also fall through to the snapshot** (graceful) rather
  than erroring the page — a transient artifact failure shouldn't blank the page;
  the user still gets their free snapshot, and the error is logged server-side. (A
  paid user hitting a transient artifact error sees the snapshot+CTA; a reload
  re-fetches.) The dedicated `locked` reason is kept distinct for Slice B's
  post-checkout probe.
- **Per-item shape validation** matches what the render reads — heavier than the
  snapshot but necessary because the render maps over item arrays.

## Deferred

- **Slice B:** Stripe Checkout on the unlock CTA + the post-return `/artifact`
  probe-with-retry (which will use the `locked` vs `ok` distinction directly).
- **A2 submit wiring** — waits on ATLAS's pending multipart `/submit` slice.

Parked hardening: none.

## Verification

- `tsc --noEmit` = 0; `npm run lint` = 0; `npm run build` green (route compiles `ƒ`).
- **Live (deployed ATLAS):** `GET /artifact` for the real unpaid request_id
  (`content-ops-50f865…`) → **403 "Deflection report is locked"**; the results page
  then renders the **snapshot** ("We found 3 repeat questions", the export-attribution
  question), confirming the locked→fall-through path end-to-end. No 502 (path fix).
- **PENDING before merge:** the `200 → full-report render` path against a *real*
  paid artifact — asked the dev to flip the test request_id to paid (operator
  `/paid`); will confirm `parseArtifact` matches the real 200 shape + the report
  renders, and adjust validation if the live shape differs.
- `bash scripts/pre_push_audit.sh origin/main` + `python3 scripts/audit_plan_doc_files_touched.py`
  green (files-touched 4 == 4).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| atlas-deflection-client.ts (artifact fetch + validation) | ~110 |
| deflection-report-contract.ts path fix | ~2 |
| results route getArtifact | ~8 |
| this plan doc | ~85 |
| **Total** | ~205 |

Under the 400-LOC soft cap.
