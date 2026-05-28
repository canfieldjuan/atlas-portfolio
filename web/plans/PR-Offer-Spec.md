# Plan: Reconcile the deflection offer/deliverable — fix the 3-5-vs-each-gap contradiction

The live copy contradicted itself: the narrative promised "a drafted FAQ for
**each gap**," but the pricing tier + FAQ capped it at "**3-5** self-service
answers" while clustering "25-50" questions. Operator-decided redesign (see memory
`deflection-offer-spec`): make the deliverable congruent and generous. The pipeline
is **100% deterministic — no AI** (operator-confirmed); answers are assembled from
the team's own resolved replies, so drafting more of them costs almost nothing.

## Why this slice exists

- A reader who reads closely hits the bait-and-switch (each-gap up top, 3-5 at the
  price). And clustering 50 but drafting 5 under-delivers for $1,500.
- **100% deterministic / no AI** is the differentiator (grounded in the team's own
  resolved replies — the Klarna lesson the proof section already makes), and the
  reason the offer can promise a draft per solvable gap.

## Scope (this PR)

Slice phase: Product polish

`landingConfig.tsx` (the shared `pricingTiers` + `pricingFaqs`):
1. **Snapshot tier** → single anchor "**top 5**" (was "5-10"), ranked by frequency.
2. **Full Report tier** `includes` → "**every** recurring question, ranked by how
   often asked (typically 50+)" (was "25-50"); wording-clusters bullet now names
   the payoff — "the long-tail keywords needed to rank" (an SEO observation, not a
   ranking promise — consistent with the claims doctrine); "a drafted answer for
   **every gap your tickets already solve** — 100% deterministic, no AI" (was
   "3-5 answers"); new **"no proven answer yet" list**; "priority + source IDs."
3. **FAQ** (snapshot + full-report answers) → matched to the above; the privacy
   FAQ's "before model processing" → "before any processing … 100% deterministic,
   no AI" (it implied a model the pipeline does not use).

`landingConfig-v2.tsx` (narrative alignment):
4. **mechanism** ranked-fix-list line → drafts for "every gap your tickets already
   answer" + "a flagged list of the ones they do not."
5. **offer "what you get"** → drafted-answer bullet now "every gap your tickets
   already solve … 100% deterministic, no AI"; added the "no proven answer yet" bullet.

`SupportTicketCsvIntakePage.tsx` (Codex P2 — claims consistency):
6. CSV-hint "before any model sees it" → "before anything processes it. The
   analysis is 100% deterministic — no AI." The old wording implied a model the
   pipeline does not use, contradicting the (true) "no AI" report claim.

### Files touched

- `web/plans/PR-Offer-Spec.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — snapshot + full-report tiers, both FAQ answers, privacy FAQ
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — mechanism line + offer deliverable bullets
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` — CSV-hint privacy line

## Mechanism

- Copy-only. `pricingTiers`/`pricingFaqs` are shared and re-imported by
  `landingConfig-v2`; the partner page maps `pricingTiers` (overriding only the
  full-report **price** to $1,000), so the new **deliverable** copy correctly
  propagates to the partner twin too — desired (same deliverable, cheaper price).
- No component change.

## Intentional

- **"All gaps with a real solution," not "all gaps we can find"** — drafting an
  answer for a question the team never solved would mean inventing it, which a
  deterministic pipeline does not do. The unsolved frequent questions become the
  "no proven answer yet" list — the highest-value "where to invest next" signal,
  not a gap in the offer.
- **Dropped the hard count for frequency framing** ("every question, ranked by how
  often asked") — never under-delivers on a low-volume client, and it's consistent
  with the deflection fact-claim doctrine [[claims-doctrine-fact-not-guarantee]].
  Kept a soft "typically 50+" magnitude anchor.
- **"100% deterministic / no AI" is the true claim, kept bold (Codex P2).** Codex
  flagged that "no AI" contradicted the intake's "before any model sees it."
  Operator confirmed the pipeline is fully deterministic with no model anywhere —
  so the fix is to keep the true, stronger claim and correct the two lines that
  *implied* a model (intake hint + privacy FAQ). The accurate, reinforcing lines
  stay: "No model training / no fine-tuning," "Not a model guess," and "no AI
  talking to your customers" (no chatbot).

## Deferred

- Pricing *structure* (recurring engine, per-seat) — separate, undecided
  [[deflection-pricing-direction]].

Parked hardening: none.

## Verification

- `tsc --noEmit` / `npm run lint` clean; `npm run build` green.
- No "3-5" / "25-50" / "5-10" range left in the deflection surface; narrative and
  tiers agree on draft-per-solvable-gap + the "no answer yet" list.
- Claims consistency: no copy implies a model processes tickets (intake hint +
  privacy FAQ fixed); the report's "100% deterministic, no AI" no longer
  contradicts the intake flow.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  4 == 4 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| landingConfig.tsx tiers + FAQs | ~14 |
| landingConfig-v2 mechanism + offer bullets | ~6 |
| intake CSV-hint line | ~3 |
| this plan doc | ~90 |
| **Total** | ~113 |

Well under the 400-LOC soft cap.
