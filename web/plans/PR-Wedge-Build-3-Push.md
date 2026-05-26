# Plan: Build slice 3 — wedge Push (final CTA) + the last cost-ranking straggler

Third slice of the wedge landing-copy build (hero #78, mechanism #80). Places
the locked **Push** copy + button into the final CTA, and rewords the last
cost-ranking string on the page — which **completes** the cost-ranking removal
started in the hero (#78) and the Picture (#80).

## Why this slice exists

- The final CTA still carries pre-build copy and the old shared button
  ("Upload your CSV — free Deflection Snapshot"); the locked Push is "Upload
  3–6 months of closed tickets. Your free Deflection Snapshot comes back within
  24 hours — no integration required." with the button "Upload your export — free".
- `reportContents` still has a deliverable titled **"Cost-Cutter Notes"** (L58)
  — the last cost-ranking phrase on the page (the hero and Picture were cleared
  in #78/#80). Its own description already talks about repeat **volume**, not
  cost, so only the title is off.

## Scope (this PR)

Slice phase: Product polish

1. **Push copy** (`page.tsx` `finalCta`): title tightened to drop the
   duplicated upload instruction (the body now carries it); `body` → the locked
   Push sentence + a no-auto-publish reassurance.
2. **Push button** (`page.tsx` `sharedCta`): label "Upload your CSV — free
   Deflection Snapshot" → **"Upload your export — free"**. `sharedCta` feeds
   only `finalCta` + `footerCta` (the hero took its own CTA in #78), so this
   sets the two bottom-of-page buttons to the locked Push button.
3. **Last cost-ranking straggler** (`page.tsx` `reportContents`): deliverable
   title "Cost-Cutter Notes" → **"Priority Notes"** (matches the "Priority
   notes" already used in the full-report tier); description unchanged.

### Files touched

- `web/plans/PR-Wedge-Build-3-Push.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/page.tsx` — finalCta title/body, sharedCta label, reportContents "Cost-Cutter Notes" title

## Mechanism

- `finalCta.title` → "See which repeat questions should stop hitting your
  inbox." (the old title repeated "send us your last 3–6 months", which the
  body now states); `finalCta.body` → [locked Push sentence, "Your team reviews
  and publishes every answer — nothing goes live without you."].
- `sharedCta.label` flips to the locked Push button; both bottom CTAs follow.
- `reportContents` title swap only; the icon + description (volume-based, not
  cost) stay.

## Intentional

- **Relabeling `sharedCta` is the Push button, not the hero** — the hero got an
  inline CTA in #78, so `sharedCta` now scopes to finalCta + footerCta only.
- **finalCta.title rewritten (one line)** to remove the title↔body "3–6 months"
  duplication; on-voice, no claim change.
- **Only the title of "Cost-Cutter Notes" changes** — the description already
  reads on volume, so no rewrite needed.

## Deferred

- **Wedge→calculator link (Proof "Layer 3")** and the **risk-reversal block**
  both need a page element the `DiagnosticReportLandingPage` template has **no
  slot for** — regrouped into a dedicated later slice that adds the slot(s)
  once, rather than forcing either into an existing field. (Proof Layers 1 & 2
  — `comparison` language-mismatch and `sample` demo — are already on the page,
  on-voice, unchanged.)
- Pricing badge + who-it's-for (ICP L773 "10-50" → 15–75) + FAQ (+3 / step-by-step
  mirror) → **B4**.
- `/partner` route → later slice.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size).
- `npm run lint` / `tsc --noEmit` clean.
- **No stale value remains (AGENTS.md §1a) — milestone:** `grep -niE "cost
  cutter|cost-cutter|cost the most|automated cost" page.tsx` returns **nothing**
  — cost-ranking is fully removed from the wedge after this slice.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `page.tsx` finalCta title/body | ~6 |
| `page.tsx` sharedCta label | ~2 |
| `page.tsx` reportContents title | ~2 |
| this plan doc | ~92 |
| **Total** | ~102 |

Well under the 400-LOC soft cap.
