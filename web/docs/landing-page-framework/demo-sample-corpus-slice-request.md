# Corpus-slice request — add resolution evidence + search-log rows to the B2B-SaaS demo sample

**For the generator/backend session** that owns the FAQ report engine + the
sample corpus. **Follow-up to** [`demo-sample-request.md`](./demo-sample-request.md)
(the first B2B-SaaS sample you delivered). This asks for a **v2** of that sample
so the landing-page demo can drop its two current honesty caveats.

---

## Context — what we have, and the two gaps

You delivered `support-ticket-saas-demo-faq-result.json`: a real Atlas FAQ-generator
run on 36 labeled-synthetic B2B-SaaS support rows → a 6-item
`TicketFAQMarkdownResult`. It's **live on the demo now** — both the on-page
sample card and the interactive `/demo`. Two *data-truthful* limits keep the demo
from showing the product's strongest fields:

1. **Every item is `answer_evidence_status: "draft_needs_review"`.** The corpus
   has no resolution text, so `steps` / `action_items` are the generic
   *"Review the cited ticket evidence and confirm the policy-approved answer
   before publishing…"* scaffold. We can't show a **grounded** answer, so the
   demo's answers are currently hand-authored illustrative FAQs (label-gated).
2. **No `zero_result_search`.** The source is support-ticket rows, not search-log
   rows, so every `term_mappings[].zero_result_source_count` is `0` and no item
   carries `failure_risk_signals: ["zero_result_search"]`. The findability /
   "customers searched X and got nothing" proof — a core benefit on the page —
   has no real data behind it yet (the page leads here; this would let the
   product catch up).

## What we need — a v2 of the sample with two additions

A regenerated `TicketFAQMarkdownResult` from a corpus that adds the two source
types below. **Keep the same 6 topics + customer-wording questions** — only the
per-item fields should change, so the demo's topic/intent labels (6 in
`landingConfig.tsx`, 6 in `deflection-demo.ts`) don't drift on regen. If a rerun
genuinely improves a label (e.g. v1's `"other support issues"`, which we already
render as "Permissions & access"), **flag the rename in the deliverable note**
rather than letting it land silently. Aim for a total source volume comparable to
v1 (~36 ticket rows + a search-log set).

### A. Labeled-synthetic resolution evidence (→ a real-answer mix)

Add resolved-ticket / help-article / macro text for **some** topics (≈3–4 of the
6) so the generator can ground real answers. We want a **mix, not all-resolved** —
showing both states is itself the selling point (`answer_evidence_status` =
"grounded vs needs-review", the no-slop guarantee):

- Items with `answer_evidence_status: "resolution_evidence"`, **≥2–3 resolution
  sources each** (so `resolution_source_count` is ~2–3, not a lonely 1), and
  `answer` / `steps[]` / `action_items[]` that are **real customer-facing steps**
  (not the scaffold lines).
- Keep ≈2–3 items `draft_needs_review` so the demo can show the contrast honestly.
- **Keep `evidence_quotes[]` as customer-ticket wording.** The card renders them
  under "Cited from N tickets" and they're the "in their words" proof — grounded
  answers must **not** replace them with KB / macro / help-article text (that
  would make the citation copy false and lose the customer-wording proof). If you
  want to cite the resolution source too, add it as a **distinct, labelled field**
  (e.g. `resolution_evidence_quotes[]` + `resolution_source_labels[]`) so the page
  can show "drafted from help article X" separately from the customer quotes.

### B. Labeled-synthetic search-log rows (→ zero-result proof)

Add help-center search-log rows (queries customers typed that returned nothing or
the wrong doc) for some topics, so:

- `term_mappings[].zero_result_source_count > 0` — the customer-term → doc-term
  gaps that **actually produced zero results** (this is the findability lever we
  render as the term map). Size the search-log rows so a gap's
  `zero_result_source_count` lands in the **~3–10 range**, not a toy 1.
- Some items carry `failure_risk_signals` including `"zero_result_search"`.
- The source mix reflects it at **two levels** (mind which is which — in the v1
  artifact the per-type breakdown is **per-item**, not report-level):
  - **Per item:** `items[].source_type_counts` / `items[].weighted_source_volume_by_type`
    gain the `search_log` source type alongside `support_ticket` (e.g.
    `{ "support_ticket": 5, "search_log": 4 }` — v1 items are `{ "support_ticket": N }`).
  - **Report level:** only `source_count` (the all-source-types total) grows to
    include the search-log rows. **`ticket_source_count` must stay ticket-only** —
    it's the count of support-ticket rows, and the on-page "tickets analyzed" stat
    reads from it, so search-log rows must NOT inflate it. (Report-level today is
    just `source_count` + `ticket_source_count`; there is no report-level
    `source_type_counts` — the per-type breakdown lives on each item.)

### Fields the demo renders (so v2 fills them with no round-trip)

Per item: `topic`, `question` + `question_source`, `ticket_count`,
`weighted_frequency`, `failure_risk_signals[]`, `answer_evidence_status`,
`resolution_source_count`, `answer`, `steps[]`, `action_items[]`,
`when_to_contact_support`, `evidence_quotes[]`, `source_ids[]`, `source_labels[]`,
`source_type_counts`, `opportunity_score`, and
`term_mappings[]{ customer_term, documentation_term, suggestion, source_id_count,
zero_result_source_count }`.
Report-level: `generated`, `source_count`, `ticket_source_count`,
`output_checks{ uses_user_vocabulary, condensed, has_action_items }`.

Use the **same citation string format** for every quote field —
`` `<source-id>` - <subject>: "<quote>" `` — so the card can render any of them.
The `<source-id>` **prefix signals the source type**, and the fields stay
separated by source: `evidence_quotes[]` carries **ticket IDs only** (e.g.
`saas-demo-001` — per A above), while resolution / search-log citations go in
their own fields with `kb-saas-demo-001` / `searchlog-saas-demo-001` prefixes. So
the format is shared; `evidence_quotes[]` is never populated with non-ticket sources.

## The constraint (unchanged)

Still must be **defensible / public-safe**: labeled-synthetic (no real customer
tickets *or* searches), real generator output (not hand-faked), same public
source-note pattern — e.g. *"Real output from the Atlas FAQ generator on a
representative labeled-synthetic B2B-SaaS support + search-log set. No customer
data shown."* Stays inside `decisions.md` D-028 (no guaranteed deflection %, no
ranking promise — findability is surfaced as the term-map mechanism, not a
ranking claim).

## Questions

1. Does the generator **already support search-log ingestion** today — i.e. does
   it produce `failure_risk_signals: ["zero_result_search"]` + non-zero
   `zero_result_source_count` from a search-log source? If **not yet supported,
   that's a generator change, not just a data add** — scope it separately and
   we'll sequence it (no rush). If it **is** supported, what **shape** do
   search-log rows take (columns) so we can see how `zero_result_search` is derived?
2. For resolution evidence — do you synthesize **resolved-ticket text**, or point
   the generator at synthetic **help-article / macro** docs? Either is fine; we
   just need the `resolution_evidence` items to come out grounded.
3. Any field that **changes shape** when these sources are present (e.g.
   `term_mappings` gains a field, a new `failure_risk_signals` value appears,
   `source_type_counts` keys) that the demo should handle?
4. **Overwrite** `support-ticket-saas-demo-faq-result.json`, or deliver a **v2**
   file? We can swap either way.

## Ideal deliverable

A regenerated `TicketFAQMarkdownResult` JSON (6 items: a `resolution_evidence` /
`draft_needs_review` **mix**, some `zero_result_search` signals + non-zero
`zero_result_source_count` term mappings) + the source rows used (the ticket CSV +
the search-log rows) + a one-line public source note.

Then on the page we: drop the illustrative-answer caveat for the **grounded**
items (show their real `steps`), keep the "draft · needs your review" tag on the
rest, and put **real** data behind the zero-result / findability cards.
