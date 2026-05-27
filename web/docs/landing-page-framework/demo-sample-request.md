# Demo sample request — a B2B-SaaS sample for the landing-page demo

**For the generator/backend session** that owns the FAQ report engine + the
sample data. **Companion to** `demo-card-benefit-audit.md` (Part 3, demo swap) +
`page-overhaul-brief.md`. This is the open question gating the last demo card on
the wedge landing page.

---

## Context (why we're asking)

We rebuilt the Support Ticket Deflection landing page's demo cards to render the
**real `TicketFAQItem` shape** — `steps`, `action_items`, `when_to_contact_support`,
`term_mappings`, `failure_risk_signals`, `answer_evidence_status`,
`evidence_quotes`, `output_checks`. But the on-page `DeflectionReportSample` still
runs on the **CFPB consumer-complaint dataset**. That proves the engine scales,
but it's **off-ICP**: a 15–75-person B2B-SaaS support lead sees credit-dispute /
mortgage FAQs, not themselves.

## What we need

A **defensible B2B-SaaS sample report** we can embed as the demo (static — we
display it, we don't re-run live). Ideally a single **`TicketFAQMarkdownResult`
JSON** with:

**3–6 `items[]`**, SaaS-flavored (billing, seats/access, integrations, exports,
cancellation, etc.), with the rich fields **populated**:
- `topic`, `question` + `question_source` (some `customer_wording`)
- `summary`
- `ticket_count`, `opportunity_score`, `failure_risk_signals` (please include
  some `zero_result_search`)
- `answer`, `steps[]`, `action_items[]`, `when_to_contact_support`
- `answer_evidence_status` — a **mix** of `resolution_evidence` and
  `draft_needs_review`
- `evidence_quotes[]`, `source_ids[]`
- `term_mappings[]` (`customer_term` → `documentation_term` + `suggestion` +
  `zero_result_source_count`)

**Report-level**: `generated`, `source_count`, `ticket_source_count`,
`output_checks { uses_user_vocabulary, condensed, has_action_items }`.

## The constraint that blocks us

It has to be **defensible**: we can't show a real customer's tickets, and we
don't want hand-faked data. The on-page copy stays inside the claims discipline
(no guaranteed deflection %, no ranking promise — see `decisions.md` D-028), so
the sample needs to be something we can stand behind publicly.

## Questions

1. Is there an existing **public / sample B2B-SaaS ticket set** the generator can
   run on (the SaaS equivalent of the CFPB corpus)? Or do we synthesize one?
2. If synthetic — can you generate a **labeled-synthetic** SaaS ticket set and
   **run the real generator** on it, so the output is genuine generator output
   (not mocked), and hand us the resulting JSON?
3. **What can we say publicly** about the source? (e.g., "real output from a
   representative synthetic SaaS support set" / any fields to redact before we
   display them.)
4. **Keep or replace the CFPB demo?** One option: keep CFPB as the *"validated at
   scale on a public dataset"* proof, and add the SaaS sample as the *"here's what
   your report looks like"* relatable demo — or replace CFPB entirely. Your call
   on what's most defensible.

## Ideal deliverable

A single sample `TicketFAQMarkdownResult` JSON file (3–6 rich items) we can drop
in as the demo's static data, plus a one-line note on what we may say about its
source.

## Backend handoff received

Current defensible source: a checked-in, labeled-synthetic B2B-SaaS support
ticket corpus from Atlas:

- [`support-ticket-saas-demo-sources.csv`](./support-ticket-saas-demo-sources.csv)
  — 36 synthetic SaaS support rows, labeled `synthetic_b2b_saas_demo`.
- [`support-ticket-saas-demo-faq-result.json`](./support-ticket-saas-demo-faq-result.json)
  — real `TicketFAQMarkdownResult` output generated from those 36 rows through
  the Atlas FAQ generator.

Public source note:

> Real output from the Atlas FAQ generator, generated from a representative
> labeled-synthetic B2B-SaaS support-ticket set. No customer tickets are shown.

What the current JSON provides:

- `generated`: 6 FAQ items.
- `source_count`: 36.
- `ticket_source_count`: 36.
- `output_checks`: `uses_user_vocabulary`, `condensed`, and `has_action_items`
  are all `true`.
- SaaS topics: reporting exports, integrations/webhooks, CSV imports, Slack /
  workflow follow-up, billing, permissions / SSO.
- Rich fields are populated: `steps`, `action_items`,
  `when_to_contact_support`, `failure_risk_signals`, `evidence_quotes`,
  `source_ids`, and `term_mappings`.

Known limitation:

- The current synthetic corpus does not include verified resolution text, so
  every item has `answer_evidence_status: "draft_needs_review"`. That is
  data-truthful. If the demo needs a mix of `resolution_evidence` and
  `draft_needs_review`, the backend needs a follow-up corpus slice that adds
  labeled synthetic resolution evidence and regenerates this artifact.
- The current source CSV is all support-ticket rows, not search-log rows, so
  term mappings have `zero_result_source_count: 0` and no item carries
  `zero_result_search`. If the demo card needs zero-result search proof, add
  labeled synthetic search-log rows in the same follow-up corpus slice.

Recommendation:

- Use the SaaS artifact for the relatable on-domain demo card.
- Keep the CFPB artifact only as a separate scale/public-dataset proof if the
  page has room for that distinction. Do not present CFPB as the primary
  customer-facing sample for B2B SaaS visitors.
