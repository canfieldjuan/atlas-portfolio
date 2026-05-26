# Plan: Sweep the first-ask export window to "3–6 months" across the deflection surface

Cleanup slice. #78 swept the wedge `page.tsx` first-ask window "90 days" → "3–6
months" (D-027), but a **repo-wide** grep (the §1a check, run properly this time)
found the old value still in **9 other deflection surfaces** — including **live
SEO metadata** the page-only sweep never reached. This reconciles them.

## Why this slice exists

- D-027 locks the first-ask export window at **3–6 months**; #78 fixed only the
  wedge `page.tsx` body. The same "90 days" first-ask phrasing survives in the
  wedge's own metadata, the intake/playbook/demo pages, the deflection-demo
  components, and the systems index — so the live product (and its search
  snippets) contradict the canon.
- This is the "value changed in one place, stale elsewhere" class the #79 guard
  targets; the lesson (#82 NIT, #85 MAJOR) is that the grep must be **repo-wide**.

## Scope (this PR)

Slice phase: Product polish

Swap every **first-ask** "90 days" / "90-day" → **"3–6 months"** / "3–6-month"
across the deflection surface (9 files). Leave untouched: the quarterly-refresh
"every 90 days" (D-027 carve-out), and the non-window "90 days" in
`deflection-demo.ts` (sample answer content), `deflection-playbook.ts` (data
retention), and `gap-report-intake/route.ts` (upload-size comment).

### Files touched

- `web/plans/PR-Deflection-Window-Sweep.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/layout.tsx` — wedge SEO metadata description
- `web/src/app/systems/support-ticket-deflection/intake/layout.tsx` — intake SEO metadata description
- `web/src/app/systems/support-ticket-deflection/playbook/page.tsx` — playbook CTA copy
- `web/src/app/systems/support-ticket-deflection/demo/page.tsx` — demo CTA copy
- `web/src/components/deflection-demo/HowItWorks.tsx` — step copy
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — no-match message
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` — intake page copy
- `web/src/app/systems/page.tsx` — systems index deflection card
- `web/src/app/systems/ai-content-ops/page.tsx` — hub offer-summary copy

## Mechanism

- Each edit is a one-line value swap: "last 90 days" → "last 3–6 months", "90-day
  ticket export" → "3–6-month ticket export", "from the last 90 days" → "from the
  last 3–6 months". No surrounding copy changes.

## Intentional

- **`ai-content-ops/intake/layout.tsx` deliberately excluded.** Its "90 days"
  sits inside retired-FAQ-Report naming ("free **FAQ Snapshot** … one sample
  **FAQ entry**") and its live status is unclear (legacy intake under the hub).
  Sweeping only its window would leave a half-stale surface; it needs a separate
  rebrand/retire decision, tracked in Deferred — not a drive-by here.
- **`ai-content-ops/page.tsx` included** — the hub offer-summary is clean
  deflection copy (no FAQ naming), just a stale window, so it sweeps cleanly.
- **Non-window "90 days" left as-is** — quarterly-refresh cadence (D-027), the
  demo answer's "reactivate within 90 days", the playbook's data-retention line,
  and the route's upload-size comment are not the first-ask window.

## Deferred

- **`ai-content-ops/intake/layout.tsx`** — window + the retired "FAQ Snapshot" /
  "FAQ entry" naming: needs a rebrand-or-retire decision for that legacy surface.
- **Upload-size limit vs the larger ask (functional, flagged).** The intake route
  (`gap-report-intake/route.ts`) caps CSV at **4 MB** (Vercel's ~4.5 MB body
  limit); its comment notes ~90 days fits comfortably, 180+ "may not," with an
  "email us" fallback for oversized files. Now that the ask is **3–6 months**,
  more exports will hit that fallback — worth deciding whether the upload path
  needs a larger mechanism (e.g. direct-to-blob). Handled (the fallback exists),
  not broken; out of scope for this copy sweep.
- Minor: acq-pack outbound message templates "90 days"; hero "self-serve" vs
  "self-service" (1-word).

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 10 == 10 + diff-size).
- `npm run lint` / `tsc --noEmit` clean (string-only edits; no structural change).
- **Repo-wide grep (§1a):** `grep -rnE "90 days|90-day" web/src` returns only the
  intentional leaves — the quarterly-refresh "every 90 days" (`landingConfig.tsx`
  L130/L132), the deferred `ai-content-ops/intake/layout.tsx`, and the non-window
  `deflection-demo.ts` / `deflection-playbook.ts` / `gap-report-intake/route.ts`
  lines. No first-ask "90 days" remains on the swept surface.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| 9 source files (1-line window swap each) | ~18 |
| this plan doc | ~92 |
| **Total** | ~110 |

Well under the 400-LOC soft cap.
