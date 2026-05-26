# Plan: Build slice 4 — wedge who-it's-for (ICP → 15–75) + pricing badge

Fourth slice of the wedge landing-copy build (hero #78, mechanism #80, Push
#81). Closes the **last live contradiction with the canon**: the audience
section still says "10-50 person company" while `decisions.md` D-001 locked
**15–75 sweet / 10–200 outer** in #77. Also fixes the snapshot tier badge.

## Why this slice exists

- **The #77-tracked item.** D-001 was revised to 15–75 sweet / 10–200 outer in
  #77; the canonical docs were updated, but the **live** `page.tsx:773`
  audience description still reads "10-50 person company." It's been carried in
  Deferred across #77/#78/#80/#81 — this slice clears it, so the live page
  finally matches the canon.
- The free-snapshot tier badge says **"FIRST 5 DESIGN PARTNERS"** — the
  design-partner framing belongs to the `/partner` page (the partner-priced
  offer), not the public free snapshot. The public badge should just say the
  offer is free / no card.

## Scope (this PR)

Slice phase: Product polish

1. **who-it's-for description** (`page.tsx` `audience.description`, L773):
   "10-50 person company…" → the **15–75-person B2B SaaS** sweet spot + the
   fit-signals (can export 3–6 months of tickets; already runs a help center).
2. **who-it's-for exclusions** (`page.tsx` `audience.constraint`): align the
   "NOT A FIT FOR" copy to the locked exclusions — enterprise (below $1,500
   procurement), pure high-volume B2C, pre-product with no tickets, or wanting
   a done-for-you help center.
3. **pricing badge** (`page.tsx` `pricingTiers` snapshot tier, L89):
   "FIRST 5 DESIGN PARTNERS" → **"FREE · NO CARD"**.

### Files touched

- `web/plans/PR-Wedge-Build-4-Audience.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/page.tsx` — audience.description + audience.constraint + snapshot tier badge

## Mechanism

- `audience.description` names the **15–75 sweet spot** with the why (repeats
  show across months; every ticket still costs real agent time) and the
  fit-signals (export 3–6 months; has a help center). Per D-001 the landing
  leans on the **sweet spot + signals**, not a hard wall.
- `audience.constraint` swaps the generic "low volume / can't export / want
  outsourcing" line for the locked exclusions (enterprise / B2C / pre-product /
  done-for-you).
- Snapshot tier `badge` string swap only; price/includes/note unchanged (the
  tier already carries "No card required, no contract").

## Intentional

- **Sweet spot, not a wall.** The landing uses 15–75 + signals; the broad
  10–200 outer band and the title/qualifier/exclusion *list* filters live in
  the acquisition pack (outbound list-building), per D-001 — not in page copy.
- **Personas (`useCases`) and the section title left as-is** — they carry no
  employee count and are on-voice; rewriting them would be scope creep.
- **Design-partner framing intentionally removed from the public badge** — it's
  the `/partner` page's offer; the public snapshot is simply free / no card.

## Deferred

- **FAQ (+3 + step-by-step mirror)** → **B5** (operator chose to split it;
  it's additive new copy and feeds the FAQ JSON-LD).
- **Wedge→calculator link + risk-reversal block** → the template-slot slice
  (no slot exists for either).
- **`/partner` route** → later slice.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 2 == 2 + diff-size).
- `npm run lint` / `tsc --noEmit` clean.
- **No stale value remains (AGENTS.md §1a) — closes the #77 item:** `grep -niE
  "10-50|10–50|person company|employees" page.tsx` returns **nothing**; the
  live page no longer contradicts D-001.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `page.tsx` audience.description | ~3 |
| `page.tsx` audience.constraint | ~3 |
| `page.tsx` snapshot badge | ~2 |
| this plan doc | ~88 |
| **Total** | ~96 |

Well under the 400-LOC soft cap.
