# Plan: Revise the canonical ICP to 15–75 sweet / 10–200 outer + fold the targeting criteria into the acquisition pack

The operator revised the ICP size after working the outbound targeting criteria:
**15–75 employees (sweet spot), 10–200 outer prospecting band** — superseding the
10-50 we locked in #76 and the acquisition pack's stale "10-100". This updates the
two committed docs that still carry the old numbers.

## Why this slice exists

- D-001 was locked at 10-50 in #76; the operator has since revised it to 15–75
  sweet / 10–200 outer (drops the very small, adds lower-mid-market; $1,500
  self-serve still fits). Leaving 10-50 in the canonical doc would mislead copy.
- The acquisition pack still says "10-100 employees" in its Prospect List Rules
  (and a banner pointing at the now-superseded 10-50). It also now has a richer
  list-building criteria set (titles, qualifiers, exclusions) the operator wrote —
  the pack is its natural home.

## Scope (this PR)

Slice phase: Workflow/process

1. `decisions.md` D-001: ICP size → **15–75 sweet / 10–200 outer** (was 10-50);
   note the landing leans on the sweet spot + fit-signals, the broad band + filters
   are outbound-list criteria.
2. `support-deflection-acquisition-pack.md`: update the banner (10-50 → 15–75) and
   replace the Prospect List Rules with the operator's targeting criteria (company
   filters incl. 15–75/10–200 + Zendesk + help-center; title filters; exclusions).

### Files touched

- `web/plans/PR-ICP-15-75.md` — this plan doc (new)
- `web/docs/landing-page-framework/decisions.md` — D-001 size → 15–75 sweet / 10–200 outer
- `web/docs/landing-page-framework/support-deflection-acquisition-pack.md` — banner + Prospect List Rules to the new targeting criteria

## Mechanism

- D-001's ICP bullet changes the headcount and points the landing at the sweet spot
  + fit-signals (not a hard wall), with the broad band + filters scoped to outbound.
- The acquisition pack's Prospect List Rules are replaced with the operator's
  criteria: company filters (B2B SaaS; 15–75 sweet / 10–200; uses Zendesk-type
  exportable desk; has a help center), title filters (Head/VP/Dir of Support, CX,
  CS-if-owns-support, Founder/CEO under ~30), and exclusions (enterprise/Fortune-500
  $1,500-too-small, pure high-volume B2C, pre-product no-tickets).
- The banner is updated so it confirms the rules are now current, and **still flags**
  the pack's outbound *message templates* (which say "last 90 days") as superseded
  by `SEO-Ticket-Deflection-Template-Docs/outbound-sequence.md` (3–6 months) — that
  reconciliation is left for when the pack's messages are next revised.

## Intentional

- **Revises the #76-locked 10-50** — deliberate operator change, not drift; recorded
  as the latest cut so copy and outbound both read 15–75 sweet / 10–200 outer.
- **Landing vs list split:** the landing "who it's for" uses the sweet spot +
  signals; the hard band + filters live here (the list doc), not in page copy.
- **Pack message templates left for later** — fixing the 4 "last 90 days" lines in
  the outbound templates is out of scope; they're superseded by the newer
  `outbound-sequence.md`, flagged in the banner.

## Deferred

- Reconcile the acquisition pack's outbound *message* copy (still 90-days) with
  `outbound-sequence.md` when the pack is next revised.
- The remaining landing copy sections (FAQ + risk-reversal) — in the copy thread.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  3 == 3 + diff-size). No lint/build impact (Markdown under `web/docs/`).
- `decisions.md` D-001 reads 15–75 sweet / 10–200 outer; the acquisition pack's
  Prospect List Rules carry the new criteria and no longer say "10-100".

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `decisions.md` (D-001 ICP bullet) | ~4 |
| `support-deflection-acquisition-pack.md` (banner + prospect rules) | ~30 |
| this plan doc | ~95 |
| **Total** | ~129 |

Well under the 400-LOC soft cap.
