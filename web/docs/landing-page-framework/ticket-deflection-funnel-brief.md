# Support Ticket Deflection — Funnel Campaign Brief (13-question intake)

**Date:** 2026-05-23
**Status:** Pre-campaign. Answers all 13 funnel-intake questions from facts in two
repos. A separate session designs the funnel (landing page, emails, lead magnet,
offer, targeting) from this; build comes later.

**Tag legend:**
- `[REPO FACT]` — verifiable in the codebase / live site / decisions doc today.
- `[CONFIRM]` — repo signal + prior notes suggest a default; operator should confirm.
- `[YOUR CALL]` — a business decision the code cannot make.

**Sources:**
- atlas-portfolio (the live marketing site) + `web/docs/landing-page-framework/decisions.md` (decisions D-017 … D-023).
- Atlas product repo: `docs/products/ticket-deflection-gtm.md` (capability source-of-truth) + `docs/extraction/validation/content_ops_faq_50k_gated_validation_2026-05-23.md` (proof).

## How much is answered

~11 of 13 are answerable from the repos. The two genuine gaps are **#8 (proof — no
client outcomes yet)** and **#13 (the 30-day goal)**. Two more need a one-line
confirm because the site and the Atlas GTM doc differ: **ICP size (#3/#4)** and
**price (#10)**.

---

## The 13 answers

```text
1. What I sell:
   [REPO FACT] The Support Ticket Deflection Report — a done-for-you ticket-analysis
   + FAQ-drafting service. Upload an export (CSV/JSON/JSONL) of recent support
   tickets; we group repeated questions by intent language, rank the biggest FAQ
   opportunities by ticket volume + failure-risk signals, preserve source IDs and
   the customer's actual wording, and draft review-ready help-center answers (with
   numbered action steps + "when to contact support"). The team reviews before
   anything publishes. A report workflow — NOT an auto-publishing integration, NOT
   a chatbot. Closest funnel options: "Ticket analysis/audit" + "Help-center / KB
   optimization."

2. Is it built yet or still an idea:
   [REPO FACT] Built. The FAQ generator is built and validated (50k rows offline).
   The live site has the full funnel: wedge landing page, interactive demo, a
   10-example playbook, and a working CSV intake (uploads to blob storage, emails
   the lead + a confirmation, writes to Postgres). Fulfillment is founder-led hybrid
   (decision D-020): the first 3 snapshots are run manually, then the productized
   pipeline takes over.
   NOT built: any ticketing API integration (upload-only today; no Zendesk/Intercom/
   Gorgias connector — those are name-normalization aliases, not integrations);
   bounded large-upload in the hosted app (50k is offline-validated; hosted large
   uploads need background execution — parked as FAQSCALE-1).

3. Ideal customer:
   [CONFIRM] The live site (D-019) says B2B SaaS / marketplace / productized-service
   businesses that export tickets from a help desk, have visible repeat-question
   volume, but no dedicated docs owner; the buyer (founder / Head of Support / CS
   lead) feels ticket cost directly. The Atlas GTM doc says the engine is
   industry-agnostic and "high ticket volume matters more than industry."
   -> Lock the segment. Default: B2B SaaS first.

4. Company size:
   -> Resolved (D-001, 2026-05-25): **15–75-person B2B SaaS** sweet spot; **10–200**
   outer prospecting band. The landing leans on the sweet spot + fit-signals; the
   broad band + the title/qualifier/exclusion list filters are outbound criteria.

5. Industry/niche:
   [REPO FACT/CONFIRM] The pipeline is industry-agnostic (generic ticket schema).
   The demo + playbook are written B2B-SaaS-flavored; proof ran on CFPB (financial
   complaints). The niche is a strategic choice, not a code constraint. Default:
   B2B SaaS.

6. Tools/platforms I know or target:
   [REPO FACT] Any platform's EXPORTED tickets — the intake accepts Zendesk,
   Intercom, Freshdesk, Help Scout (+ "Other"). Upload/export-based only; there are
   no live API integrations. Copy must say "export your tickets / send a CSV," never
   "connect Zendesk." (A Zendesk-first connector is planned, ~5 dev-days, not built.)

7. Best problem I can solve:
   [REPO FACT] Reducing repetitive, avoidable tickets via a specific mechanism:
   ingest tickets -> group repeat questions by intent / pain category -> rank by
   volume + failure-risk + opportunity -> extract the customer's actual wording ->
   draft review-ready self-service FAQ answers with next steps. The wedge insight is
   LANGUAGE MISMATCH: customers search "how do I cancel," the help center says
   "account lifecycle changes," so the answer exists but is invisible. Funnel
   phrasing: "We analyze your last 3–6 months of tickets, find the top repeat issues,
   and draft self-service FAQ content that deflects avoidable tickets."
   (Do NOT say "ranks by cost" — we don't collect handle-time/cost data.)

8. Proof/results I have:
   [REPO FACT — technical proof, not client outcomes; be honest]
   - 50,000 real CFPB ticket rows -> bounded FAQ output, all scale gates passed,
     ~1:41.86 wall, ~593 MB RSS (Atlas validation doc, 2026-05-23).
   - A 1,000-row run + a full generate -> export -> review -> update DB lifecycle.
   - A live interactive demo (juancanfield.com/systems/support-ticket-deflection/demo)
     + a 10-example before/after playbook + a sample report with source ticket IDs.
   NO before/after client numbers yet (by design: don't publish client data without
   permission; don't claim a deflection % until measured). -> Position the first
   offer as a low-friction free audit that produces THEIR FAQ as the proof.

9. Offer I want to sell:
   [REPO FACT — on the live site] Three tiers already structured:
   (A) Free Deflection Snapshot — top 5-10 repeat questions + 1 sample answer, 24h,
       no card ("first 5 design partners"). This is the lead magnet / audit.
   (B) Full Deflection Report — $1,500 one-time — top 25-50 questions, wording
       clusters, missing-answer list, 3-5 drafted answers, source IDs.
   (C) Quarterly Refresh — $1,500/quarter.
   Review-ready report/draft; the customer publishes (no auto-publish).
   [CONFIRM] Which to lead with — the funnel's "free audit -> paid report/sprint"
   maps cleanly to A -> B.

10. Price range:
    [CONFIRM / YOUR CALL] The live site publishes Free / $1,500 one-time /
    $1,500-quarter. The Atlas GTM doc treats price as uncommitted. Reconcile: is the
    $1,500 final, or provisional? (D-017 floats a founder-led ~$1,500-3,000/mo
    retainer trajectory if it goes ongoing.)

11. Lead channel I want to start with:
    [REPO FACT — decided in D-019] Stack three: do ~10 free analyses for companies in
    the network -> publish the most striking ANONYMIZED results -> cold LinkedIn
    outbound. First ask is "send a CSV of your last 3–6 months," not "buy software."
    [YOUR CALL to refine] Cold email + LinkedIn + the one landing page is the
    natural start; SEO/ads later. (Atlas notes a reusable outreach template + a
    30-min discovery script exist to seed the sequence.)

12. Assets I already have:
    [REPO FACT — the richest box]
    - Live site + brand: juancanfield.com; the full deflection funnel (wedge ->
      demo -> playbook -> working CSV intake with email + blob storage + Postgres).
    - Structured 3-tier pricing + a locked decisions doc (positioning, naming, ICP,
      acquisition plan, fulfillment model: D-017 … D-023).
    - The 10-rewrite playbook (doubles as content / lead magnet).
    - Atlas backend: FAQ generator (built + 50k-validated), plus landing-page and
      blog-post generators and a B2B campaign generator from the same ticket data;
      email MCP + CRM + invoicing; auth + Stripe billing scaffolding; the
      atlas-intel-ui dashboard; the 50k validation proof doc; a written outreach
      template + discovery script.

13. Goal for the next 30 days:
    [YOUR CALL] Fastest given what's built: "validate the offer" (run the first 3-5
    free Snapshots manually, land first design partners, generate first proof) OR
    "first 3 clients." The free ticket audit IS the lead magnet; the landing page
    exists. Name the single priority outcome.
```

---

## Defensible claims discipline (for the funnel copy — do not over-claim)

**Current defensible description.** The Support Ticket Deflection Report is a
done-for-you ticket-analysis + FAQ-drafting service. Upload a CSV/JSON/JSONL export
of recent support tickets; Atlas groups repeated customer questions by intent
language, ranks the biggest FAQ opportunities by ticket volume + failure-risk
signals, preserves source IDs + customer wording, and drafts review-ready
help-center answers with action steps and "when to contact support" guidance. Your
team reviews before anything publishes. A report workflow, not an auto-publishing
integration.

**Can claim now:** ingests CSV/JSON/JSONL ticket exports; normalizes common ticket
fields; groups repeated issues by intent / source titles / customer wording / pain
category; ranks by source volume + failure-risk signals; generates bounded Markdown
FAQ (human question phrasing, source IDs, ticket counts, evidence snippets, numbered
action steps, support-contact guidance, output checks); vocabulary-gap detection;
persistence / export / review-status for drafts; deterministic generation proven on
50k rows offline.

**Do NOT claim yet:**
- "AI clusters tickets" implying embeddings/semantic clustering — say "groups by
  intent and repeated-issue language."
- "Ranks by cost" — no cost/handle-time data; say "volume and failure-risk signals."
- "Upload 50k in the app" / "unlimited tickets" — 50k is offline-proven, not a
  bounded hosted request.
- "Publishes to your help center automatically" — it's review-ready drafts.
- "Connect Zendesk/Intercom" — upload/export only; no live integration.

**Exception — user-supplied-input calculators.** A calculator that computes a cost
from the *user's own* inputs (their ticket volume × their cost-per-ticket × a
stated, adjustable repeat-rate assumption) is fine — it's the prospect's own
estimate, not a product cost-claim. It must label the assumptions and disclaim it's
"not a forecast of what the Report will save." (See the Support Tax Calculator at
`/systems/support-ticket-deflection/calculator`.)

**Approved taglines.**
- *"Turn support tickets into a review-ready FAQ report. Atlas analyzes your recent
  ticket export, finds repeated customer questions, ranks the biggest deflection
  opportunities, and drafts help-center answers grounded in real ticket wording and
  source IDs."*
- (Safer/shorter) *"Upload recent support tickets. Get a ranked FAQ report showing
  the repeated questions customers keep asking, the wording they actually use, and
  review-ready answers your team can publish manually."*

---

## Two items to confirm before final copy

1. **ICP size (#3/#4):** Resolved — **15–75 sweet / 10–200 outer** (D-001); the live
   page reads 15–75. (Was: live site 10-50 vs Atlas GTM mid-market.)
2. **Price (#10):** the live site publishes $1,500; the Atlas GTM doc treats pricing
   as uncommitted. Confirm final vs provisional.

## Honest gaps (so the campaign doesn't over-promise)

1. **No client-outcome proof yet** — technical proof only (50k rows, clean FAQ). Lead
   with a free audit that produces *their* FAQ as the proof.
2. **No live integrations** — upload-based; "send a CSV," not "connect Zendesk."
3. **Hosted large-upload not production-ready** — parked as `FAQSCALE-1`; market the
   audit on an export, not on "upload your entire ticket history live."
