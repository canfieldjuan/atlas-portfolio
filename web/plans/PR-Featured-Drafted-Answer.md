# Plan: Move the drafted answer to its own full-shape section after the hero

Follow-up to the hero rebuild (#93). The drafted answer was a cramped teaser
inside the hero artifact, missing real fields (notably `when_to_contact_support`).
Pull it out, expose the **full `TicketFAQItem` answer shape**, and give it **its
own featured section right after the hero + CTA** — which is also how it stacks
on mobile, where most traffic is. Operator-approved layout + priority indicator.

## Why this slice exists

- The hero artifact's "answer" was prose + a subset of fields; the operator wants
  the complete drafted-answer shape shown (summary, steps, action items,
  when-to-contact-support, evidence) in a dedicated space, not squeezed into the
  hero card.

## Scope (this PR)

Slice phase: Product polish

1. **New `featuredAnswer` slot** (`DiagnosticReportLandingPage.tsx`): optional
   `{ id, label, title, description, artifact }` (same shape as `comparison` /
   `sample`), **rendered as a featured `section-band` right after the hero**
   (order: hero → drafted answer → problem → …). The hero→first-section `mt-32`
   spacer moves from `problem` onto this new section.
2. **New `DeflectionDraftedAnswer` artifact** (`landingConfig.tsx`): the full
   answer shape — header (`topic` · `ticket_count` + a **PRIORITY** badge from
   `opportunity_score`, an `in customers' words` badge = `question_source`, a
   `DRAFT · needs review` badge = `answer_evidence_status`), the `question`, then
   **SUMMARY** (`summary`), **STEPS** (`steps[]`), **ACTION ITEMS**
   (`action_items[]`), **WHEN TO CONTACT SUPPORT** (`when_to_contact_support`),
   and an evidence footer (`resolution_source_count`/`source_ids` + no-auto-publish
   + `evidence_quotes[]`).
3. **Strip the drafted-answer block from `DeflectionReportHeroArtifact`** — the
   hero artifact becomes a tighter teaser (chips + the repeat-questions list).
4. **Populate `featuredAnswer`** in `landingPageConfig`.

### Files touched

- `web/plans/PR-Featured-Drafted-Answer.md` — this plan doc (new)
- `web/src/components/landing/DiagnosticReportLandingPage.tsx` — `featuredAnswer` slot + render + relocate the `mt-32` spacer
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — `DeflectionDraftedAnswer` artifact, strip the hero block, add the `featuredAnswer` config

## Mechanism

- The new section mirrors the `comparison`/`sample` artifact-section pattern;
  the rich card lives in `landingConfig` as a component (like
  `DeflectionReportSample`). Shared config → the section also renders on
  `/partner`.
- **PRIORITY** badge maps `opportunity_score` to a tier ("High") — a derived
  priority, **not** $ or %; `failure_risk_signals` ("zero-result search") shown as
  the reason. Numbers are illustrative B2B-SaaS preview data; structure/labels
  match what ships.

## Intentional

- **Full shape, exposed** — every answer-relevant field is shown (the point of
  the move); `when_to_contact_support` is included (the field the hero omitted).
- **PRIORITY = `opportunity_score` as a tier, not a number/$** — stays inside the
  audit's labeling rule.
- **"DRAFT · needs review" + "you approve & publish"** — keeps no-auto-publish.
- **Findability stays a mechanism** (zero-result search), not a ranking promise.

## Deferred

- Card 2: comparison → real `term_mappings` (the approved next slice).
- CFPB `DeflectionReportSample` rebuild — gated on the demo-swap decision.
- Headline + benefit-ladder rewrite.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape +
  files-touched 3 == 3 + diff-size).
- `npm run lint` / `tsc --noEmit` clean; `npm run build` succeeds; the new
  section renders after the hero on the wedge **and** `/partner`.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `DiagnosticReportLandingPage.tsx` (slot + render + spacer) | ~25 |
| `landingConfig.tsx` `DeflectionDraftedAnswer` (new) | ~70 |
| `landingConfig.tsx` strip hero block + add config | ~20 |
| this plan doc | ~85 |
| **Total** | ~200 |

Well under the 400-LOC soft cap.
