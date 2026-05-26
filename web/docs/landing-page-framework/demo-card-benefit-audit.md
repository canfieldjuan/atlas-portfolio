# Demo-card + benefit audit — Support Ticket Deflection landing page

**Companion to `page-overhaul-brief.md`.** This audits the on-page demo/artifact
cards against **what the report actually returns**, and inventories the
benefits we can defensibly claim (direct vs indirect), keyed to real fields.
Starting point for the page overhaul (begin with the demos).

The governing rule (from the brief): **promise a felt state we deliver on
hand-off, verifiable by the customer.** Claim what's *in the box* directly;
surface downstream outcomes (findability, churn, cost) only as the *lever* they
depend on, via mechanism — never as our guarantee.

---

## 0. The report's real fields (source of truth)

From the generated FAQ report shape (`TicketFAQMarkdownResult` / `TicketFAQItem`).
Cards/claims must map to these — nothing invented.

**Report level:** `generated` (count), `markdown` (full preview), `items[]`,
`source_count`, `ticket_source_count`, `output_checks { uses_user_vocabulary,
condensed, has_action_items }`, `warnings`.

**Per item (`TicketFAQItem`):**
- `topic`, `question`, **`question_source: "customer_wording" | "source_policy"`**
- `summary`, `answer`, **`steps[]`**, **`action_items[]`**, `when_to_contact_support`
- `frequency`, `weighted_frequency`, **`ticket_count`** *(NOTE: these differ — the
  sample item had `frequency: 20` but `ticket_count: 1`)*
- **`opportunity_score`**, `failure_risk_score`, **`failure_risk_signals[]`**
  (e.g. `"zero_result_search"`)
- **`answer_evidence_status: "resolution_evidence" | "draft_needs_review"`**,
  `resolution_source_count`
- **`evidence_quotes[]`**, `source_ids[]`, `source_labels[]`, `source_type_counts`
- **`term_mappings[]`**: `{ customer_term, documentation_term, suggestion,
  zero_result_source_count, opportunity_score, ... }`

**Compact search route** (the live demo's lighter projection): `{ query, count,
results[{ faq_id, topic, question, answer_summary, source_ids, ticket_count,
rank, score }] }` — here `score` is **text-relevance**, *not* `opportunity_score`.
Don't conflate the two.

---

## Part 1 — Demo/artifact card audit

### 1. Hero artifact (`DeflectionReportHeroArtifact`)

| Current | Issue | Real field → fix |
|---|---|---|
| Chip "Top 25 / questions ranked" | invented number | `generated` (real count), or drop the number |
| Chip "5 answers / ready to review" | "ready" overstates | answers are `draft_needs_review` → "5 drafts to review" |
| Chip "3–6 months / ticket window" | fine | keep |
| Rows: "Billing confusion · **41 tickets** · 'why was I charged twice?'" | "41 tickets" field is ambiguous — **the `frequency` vs `ticket_count` trap** | label = `ticket_count` specifically (or "occurrences" if `frequency`); topic + customer-phrase + count structure is otherwise right |
| (rows show only topic/count/phrase) | missing the hook | add `failure_risk_signals` ("zero-result search") and/or `opportunity_score` |
| "Self-service answer" = prose paragraph | doesn't match the shape | real = `steps[]` + `action_items[]` + `when_to_contact_support` + a **"draft — needs review"** tag (`answer_evidence_status`) + an `evidence_quote` |

**Biggest miss:** the hero surfaces none of the trust/proof assets
(`evidence_quotes`, `answer_evidence_status`, `output_checks`).

### 2. Comparison table (`HelpCenterComparison`) — most under-used element

Currently a *generic concept* (company language vs customer language) with
hardcoded pairs. **It is literally the `term_mappings` output**
(`customer_term → documentation_term`). Reframe as *"an actual deliverable: your
term map,"* enriched with `suggestion` ("add 'export' as alternate phrasing for
'Download report'") and `zero_result_source_count` ("customers searched this and
got nothing — N times"). This becomes the **findability pillar** (the
keyword/ranking value, grounded — not a ranking promise).

### 3. Sample demo (`DeflectionReportSample`) — the CFPB dataset

- Built on **CFPB public complaints** (Credit report disputes 28, Mortgage
  servicing 12, Debt collection 6). **Off-ICP** — the buyer is 15–75 B2B SaaS;
  this shows consumer-finance complaints. Proves the engine scales; doesn't show
  the buyer themselves.
- Scale stats (1.28M / 383k / 1,000 / 46) are real + verifiable (its strength),
  but it's CFPB's scale and exposes none of the rich fields.
- Sample answers show `summary`/`steps`/`sources` but omit `question_source`,
  `term_mappings`, `failure_risk_signals`, `answer_evidence_status`,
  `output_checks` — i.e. everything new. See Part 3.

### 4. "What's in the report" cards (`reportContents`)

"Deflectable Ticket Opportunities" (vague) → `opportunity_score`-ranked list;
"Customer Wording" → the richer `term_mappings`. **Missing cards** for: the term
map / findability gap, grounded-vs-draft labeling, the proof checks.

---

## Part 2 — Benefit inventory (keyed to real fields)

**Direct — in the box, claim confidently (verifiable on delivery):**
- `question_source: customer_wording` + `evidence_quotes` → "your customers'
  *actual words*, with the ticket quotes"
- `term_mappings` (+ `suggestion`) → "the words customers use that your docs
  don't — and where to add them"
- `ticket_count` / `frequency` → "ranked by how often it hits you"
- `opportunity_score` → "prioritized — what to fix first" *(priority, not $)*
- `steps[]` / `action_items[]` / `when_to_contact_support` → "step-by-step drafts
  your team reviews"
- `answer_evidence_status` + `output_checks` + `source_count` → **proof/trust:
  "grounded in real resolutions or flagged as drafts — nothing invented"**

**Indirect — the lever, via mechanism (never our guarantee):**
- `failure_risk_signals: zero_result_search` + `term_mappings` → **findability**
  ("the exact phrases customers search and find nothing — fix the wording, they
  find it"). The defensible bridge to the ranking/SEO benefit.
- findable answers → fewer repeat contacts → less agent time (mechanism)
- faster self-serve → less frustration-driven churn (mechanism)

Every indirect claim is now *grounded in a field* — that's the upgrade the real
schema buys us.

---

## Part 3 — Demo-swap consideration (open, not decided)

**Tension:** the CFPB demo is **real + public + verifiable** (its whole point —
"check it yourself, no customer data"), but **off-ICP** (consumer finance) and
shows **none of the new rich fields**.

An on-domain demo (B2B-SaaS examples like the "export attribution report" item,
showing `term_mappings` / `zero_result_search` / grounded-vs-draft /
`output_checks`) would be **more persuasive, on-ICP, and accurate**, and show the
actual deliverable. The `/demo` ("Clarify") flow is likely closer to this.

**The thing to solve first:** a B2B-SaaS demo needs a **defensible public/sample
corpus** (we can't show a real customer's tickets) or we lose the
"verifiable, nothing-cherry-picked" credibility the CFPB set buys. Options to
weigh: a synthetic-but-labeled SaaS set; an anonymized design-partner run (with
permission); or embedding the `/demo` flow inline.

**Lean:** yes, move to an on-domain demo that shows the rich fields — large
persuasion + accuracy gain — *gated on* nailing the defensible sample source.
Not a now-decision.

---

## Labeling traps to carry into every card rebuild

1. **`frequency` ≠ `ticket_count`** (sample: 20 vs 1) — label each number with
   the field it is.
2. **`opportunity_score` / `failure_risk_score` are derived priority scores** —
   "priority/risk," never "$ saved" or "% deflected."
3. **Search `score` (text-relevance) ≠ report `opportunity_score`** — don't conflate.
4. **Most answers are `draft_needs_review`** — copy stays "drafts your team
   reviews," never "publish-ready out of the box."
