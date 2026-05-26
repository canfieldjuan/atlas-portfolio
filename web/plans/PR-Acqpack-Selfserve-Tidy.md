# Plan: Reconcile acq-pack message templates to 3–6 months + hero "self-service"

Two small tracked consistency tidies, folded into one slice: the acquisition
pack's outbound *message templates* still say "last 90 days" (the banner flags
them as superseded), and the wedge hero says "self-**serve** answers" where the
rest of the page says "self-**service** answers".

## Why this slice exists

- The acq-pack's Prospect List Rules + banner were reconciled to 15–75 in #77,
  but the **message templates** below still quote "last 90 days" / "first 90-day
  batch" — contradicting D-027's 3–6-month first-ask window. The banner itself
  says they're superseded "until this pack is next revised" — this is that
  revision.
- The hero's "step-by-step self-serve answers" (`landingConfig.tsx:625`) is the
  lone "self-serve" naming the deflection **deliverable**; the deliverables
  section, FAQ, and solution prose all call it "self-service answers".

## Scope (this PR)

Slice phase: Product polish

1. **Acq-pack message templates** (`support-deflection-acquisition-pack.md`):
   the 4 first-ask "last 90 days" (connection note, first DM, cold email,
   qualification reply) → "last 3–6 months"; the 2 paid-batch "first 90-day"
   (snapshot-delivery, paid follow-up) → "first 3–6 month". Update the **banner**
   so it no longer says the templates "still say 90 days / update when next
   revised" (now done).
2. **Hero deliverable term** (`landingConfig.tsx`): "step-by-step self-serve
   answers" → "step-by-step self-service answers" (matches the rest of the page).

### Files touched

- `web/plans/PR-Acqpack-Selfserve-Tidy.md` — this plan doc (new)
- `web/docs/landing-page-framework/support-deflection-acquisition-pack.md` — message templates + banner to 3–6 months
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — hero "self-serve" → "self-service"

## Mechanism

- Pure copy swaps. The acq-pack pitches the public offer, so its "$1,500" stays
  (the partner price lives on `/partner`); only the export-window phrasing
  changes. The hero term change propagates to both the wedge and `/partner`
  (shared `landingConfig`).

## Intentional

- **Only the hero's deliverable "self-serve" changes.** The other six "self-serve"
  uses in the repo are valid different contexts — the verb ("customers
  self-serve"), the business-model adjective ("self-serve subscription / SaaS"),
  and playbook examples — left as-is.
- **Acq-pack "$1,500" kept** — it pitches the public price; the $1,000 partner
  price is gated to `/partner` (D-025).

## Deferred

- #88 follow-ups: remove the old `/api/gap-report-intake` POST after the
  direct-to-blob flow is verified on a deploy; rate-limit the open `/upload` +
  `/record` endpoints (`HARDENING.md` `DEFLECTION-INTAKE-RATELIMIT-1`).

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 3 == 3 + diff-size).
- `npm run lint` / `tsc --noEmit` clean (the `landingConfig.tsx` edit is a string).
- **§1a grep:** `grep -nE "90 day|90-day" support-deflection-acquisition-pack.md`
  returns nothing (all message-template windows reconciled); the wedge hero
  reads "self-service answers" (no "self-serve" deliverable naming remains in
  `landingConfig.tsx`).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `support-deflection-acquisition-pack.md` (banner + 6 templates) | ~16 |
| `landingConfig.tsx` (hero term) | ~2 |
| this plan doc | ~78 |
| **Total** | ~96 |

Well under the 400-LOC soft cap.
