# Landing Page Framework — Decisions Log

A running log of decisions for the direct-response landing-page framework
we're standardizing across products. Add new decisions as they surface.
Revisit open ones in any order — this isn't sequential.

## Legend

- **DECIDED** — locked in. Don't relitigate without a reason; if you do, log the reason and supersede.
- **OPEN** — needs a call. Has context + options + recommendation but no commitment yet.
- **DEFERRED** — not now. Note when it should be reconsidered.

## Index

| ID | Topic | Status |
|---|---|---|
| D-001 | Target customer scope | **DECIDED** |
| D-002 | Voice / tone baseline | **DECIDED** |
| D-003 | One voice across brands vs branded variants | **DECIDED** |
| D-004 | Tone scale (dry vs warm) | **DECIDED** |
| D-005 | Acquisition channels / where we reach SMBs | OPEN |
| D-006 | Products that get the framework first | **DECIDED** |
| D-007 | Template count (one vs multiple) | **DECIDED** |
| D-008 | Proof-type strategy (B2B math vs visual) | OPEN |
| D-009 | SMB sub-segments (which verticals) | **DECIDED** |
| D-010 | Buyer awareness stage we write to | **DECIDED** |
| D-011 | Price-range scope for offers | **DECIDED** |
| D-012 | Page types — direct-offer vs lead-magnet | **DECIDED** |
| D-013 | Input data is the moat, not the output renderer | **DECIDED** |
| D-014 | Lead-with-one vs portfolio positioning | OPEN |
| D-015 | Offer shape — trial vs paid pilot vs subscription vs done-for-you | **DECIDED** |
| D-016 | Integration scope for v1 (which support platforms) | **DECIDED** |
| D-017 | Fulfillment model — self-serve product vs managed service | **DECIDED** |
| D-018 | "Magic moment" — what buyer sees in first 24 hours | **DECIDED** |
| D-019 | First-5-customers acquisition motion | **DECIDED** |
| D-020 | Build product first vs run workflow manually | **DECIDED** |
| D-021 | Tier-A output expansion order (which renderer head after FAQs) | OPEN |
| D-022 | Problem framing — known vs unknown problem in hero | **DECIDED** |
| D-023 | Customer-facing product name (vs internal platform name) | **DECIDED** |
| D-024 | Every deliverable terminates in an action path | **DECIDED** |
| D-025 | Partner pricing gate — URL approach | **DECIDED** |
| D-026 | Landing page copywriting framework | **DECIDED** |
| D-027 | Export window for first ask | **DECIDED** |
| D-028 | Google/SEO-ranking headline — current wedge vs separate offer | **DECIDED** |
| D-029 | Mechanism altitude on the landing (3 steps vs pipeline) | **DECIDED** |

---

## D-001 — Target customer scope

**Status:** DECIDED (2026-05-15, sharpened 2026-05-16)

**Question:** Who do we sell to?

**Decision:**

- **SMBs only.** No enterprise. No consumers.
- **15–75 employees (sweet spot); 10–200 outer prospecting band** (operator, 2026-05-25, revised from a briefly-locked 10-50 after working the outbound targeting criteria). Supersedes both the 10-50 cut and `offer-locked.md`'s "10–100". The landing "who it's for" leans on the **15–75 sweet spot + fit-signals** (B2B SaaS, runs an exportable help desk, has a help center); the broad **10–200** band + title/qualifier/exclusion filters are **outbound-list criteria** — see `support-deflection-acquisition-pack.md`.
- **Actively seeking AI solutions** — NOT "AI-curious." Different buyers.
- Value either **time saved** or **money made/saved** (or both) — must be quantifiable on day 1.

**Sharpening 2026-05-16 — what "actively seeking" means:**

| State | What they're doing right now | Target? |
|---|---|---|
| AI-curious | Reading AI newsletters, signing up for free trials, no urgent need driving the search | **No** |
| **Actively seeking** | Has a specific operational problem AND has concluded AI is the right solution AND is comparing vendors | **Yes** |

Schwartz **stage 4-5** (product-aware to most-aware). They've already crossed the "should we use AI" bridge. We don't sell *why* AI — we sell *the specific outcome*. We compete against other AI tools they're already evaluating, not against "doing nothing."

**Identification signals for "actively seeking" buyers** (used in D-019 outbound targeting):

- Company is hiring "AI Engineer" / "Head of AI" / "AI Product Manager" roles
- Decision-maker has posted on LinkedIn about AI initiatives or internal experiments
- Company stack (BuiltWith / similar) shows OpenAI / Anthropic / Pinecone / vector databases
- Engaged with other AI-tool outreach publicly
- Public RFP mentioning AI automation
- Company has shipped an AI feature themselves

Filters out ~70% of all SMBs; what's left is the 30% who buy at the price we need.

**Why this matters:** Filters every other downstream decision. Page voice, proof bank, pricing tier, channel choice — all change based on this. Enterprise demands procurement-heavy content (SOC 2, MSAs, RFP support). Consumers demand emotional + visual proof. AI-curious SMBs convert at low rates because their next click is comparison shopping. **Actively-seeking SMBs** have budget already allocated, decisions to make now, and recognize the problem instantly.

---

## D-002 — Voice / tone baseline

**Status:** DECIDED (2026-05-16)

**Question:** What direct-response voice school do we adopt as our default?

**Context:**
- Recent landing pages read "polished tech vendor" — explains *what*, hides *how it works on day 1*. That look has been suppressing conversion.
- Buyer profile per D-001 (SMB operator, AI-curious, wants ROI fast) responds to specific over polished.

**Options:**

| Voice | When it works | Risk for us |
|---|---|---|
| Plain-spoken specific (Bencivenga + Hormozi + patio11) | Technical or operator buyers who want math + transparency | Can read flat if dialed too dry |
| Hormozi loud DR | High-ticket coaching / info products to financial-pain buyers | Reads as snake-oil to technical SMB buyers; kills credibility |
| Brunson hook-story-offer | Personal brand, info products, long-form sales letters | Wrong buyer state — SMB ops people don't read 4000-word sales letters cold |
| Modern startup ("Why X is broken…") | Disrupting incumbents in a known category | What we're moving AWAY from — reads as model-generated polish |
| Schwartz sophistication-stage-aware | Any voice can layer this on; awareness-stage is a tool, not a voice | Not a voice on its own |

**Recommendation:** Plain-spoken specific.

**Decision:** **Plain-spoken specific** (DECIDED 2026-05-16; refined 2026-05-16 to swap Hormozi for Ogilvy). Composite voice from a tight trio:

- **Bencivenga** — sentence-level voice, situational openings, warm asides, plain-language specificity
- **David Ogilvy** — headline craft + research discipline, factual specificity, anti-hyperbole
- **patio11 (Patrick McKenzie)** — B2B technical specificity, math-first, "here's the math, here's the price, here's what we won't do"

**Hormozi explicitly removed from the voice trio:** His offer-structure thinking (value equation, risk reversal) is still useful as reference for D-015, but his sentence-level voice (loud DR, godfather-offer rhetoric) reads as snake-oil to our buyer (D-001 actively-seeking SMB AI buyer). See `voice-reference.md` section 2.

**Operating principles for this voice:**

1. **First-person, direct.** "I built this because…" not "Atlas LLM Gateway is a hosted gateway that…"
2. **Short sentences.** Longer ones reserved for proof points where compression hurts.
3. **Specific always.** Numbers, names, dollar amounts, time windows. Never "fast" — always "in under 90 seconds." Never "many customers" — "the 14 we've shipped to."
4. **Name the buyer's situation before pitching.** "If your team has 3 tabs of customer call notes open right now and is supposed to write a blog post about them by Friday, this page is for you."
5. **Show the mechanism transparently.** Not "AI magic" — "here are the 4 things that have to happen and how we do each one."
6. **Name what we don't do.** "This won't write Twitter threads. It won't replace a copywriter. It won't work if your sources are PDFs of handwritten notes."
7. **Price-transparent always.**
8. **Zero exclamation points. Zero "limited time" theater. Zero "imagine if..."**
9. **Conversational without being chummy.** Doesn't say "hey friend" — says "you'd probably want to know..."

**Why this fits us (per D-001 buyer profile):**

- SMB AI buyers are operators (CTOs, founders, ops/CS/marketing leaders). Allergic reaction to loud DR / Brunson narratives. Convert higher on under-claimed, math-shown copy.
- Plain-spoken-specific is structurally compatible with D-013 ("input data is the moat") — proof-grounded outputs require proof-grounded copy.
- Hardest tell of model-generated copy is generic claims. Plain-spoken specific is structurally incompatible with generic claims.

---

## D-003 — One voice across brands vs branded variants

**Status:** DECIDED (2026-05-16)

**Question:** Do `juancanfield.com`, EOM, and any future product get the same voice, or do we vary by brand?

**Decision:** **One voice across all brands.** Same plain-spoken-specific voice from D-002 carries to juancanfield.com, Effingham Office Maids, AI Content Ops product, and any future product.

**What varies per brand is the *proof bank*, not the voice:**

| Audience | Proof type |
|---|---|
| B2B SaaS / AI Content Ops buyers | Screenshots of real outputs, time-to-value numbers, sample reports, customer language quotes |
| Consulting / juancanfield.com | Architecture diagrams, code snippets, real engagement scope+price, named outcomes |
| Local services / EOM | Photos of work done, real customer first names + town, before-after, exact prices |

**Why one voice:** Easier to maintain. Harder to fake-generate. Branded variants are often the tell that there isn't a real voice yet. One voice + varied proof gives both consistency and audience-fit.

---

## D-004 — Tone scale (dry vs warm)

**Status:** DECIDED (2026-05-16)

**Question:** Within plain-spoken-specific (D-002), where on the dry↔warm scale do we sit?

**Decision:** **Warm.** Direct + personality showing through. Closer to how Juan actually talks.

**Reference comparison** (same content, same voice, different temperature):

> *Dry:* "Our pipeline ingests support tickets, ranks the top 50 questions by ticket volume, and outputs publish-ready FAQ entries. The sample report below shows 47 entries for Acme Corp."
>
> *Warm (chosen):* "Most B2B SaaS companies have 30,000+ support tickets sitting in Zendesk that nobody reads. We turn that pile into your next 50 help docs — ranked by what your customers actually ask about. Here's what it looks like for Acme Corp (47 entries):"

**Warm is the higher-risk choice.** Easier to slip into chummy/generic. The discipline that keeps it on the rails:

- Still **specific always** (D-002 principle #3 — numbers, names, exact amounts).
- Still **first-person, direct** (D-002 #1).
- Still **price-transparent** (D-002 #7).
- Still **zero exclamation points / urgency theater** (D-002 #8).
- "Warm" means context-setting + acknowledging the reader's situation. Not friendliness theater.

If a sentence could fit on any vendor's homepage, it's drifted toward generic. Pull it back to a fact, a number, or a specific situation.

---

## D-005 — Acquisition channels (where we reach SMBs)

**Status:** OPEN

**Question:** Which channels will we drive traffic from? This shapes the landing page (cold visitor vs warm needs different first 100 words).

**Candidate channels:**
- LinkedIn organic (you posting; warm-ish visitors)
- LinkedIn outbound DMs (cold but personalized)
- Google Search organic (cold, intent-driven)
- Google Ads search (cold, intent-driven, paid)
- Cold email
- Referral / word of mouth (warm)
- Podcast appearances (warm)

**Why this matters:** A page that converts cold Google Search clicks looks very different from a page that converts warm referrals. We may need 2 page types.

**Decision:** _pending_

---

## D-006 — Products that get the framework first

**Status:** DECIDED (2026-05-15)

**Question:** Which existing or planned product gets the first direct-response rewrite, and in what order?

**Decision:**

Lead with **AI Content Ops Station — applied use case: support-tickets → SEO/help content.**

The AI Content Ops architecture is the moat (ingest → extract signals → synthesize → render).
The first **renderer head** we sell is help-doc/FAQ/SEO content generated from the buyer's
existing support tickets (Zendesk / Intercom / HelpScout / Freshdesk).

**Why this output first:**

1. **Lowest fulfillment friction** — tickets are static, structured, in a single source system. No real-time scraping, no LinkedIn rate limits, no news API costs.
2. **Buyer data is already aggregated** — every B2B SaaS has 1k-100k tickets sitting unused.
3. **Demo is visceral** — "paste a Zendesk token → 60 seconds later see the top 50 customer questions by volume, each with a publish-ready FAQ draft."
4. **Before/after is concrete** — "yesterday you had 50,000 tickets and 12 help docs. Today you have 50 help docs ranked by volume."
5. **ROI math is simple** — each FAQ entry = SEO long-tail capture + ticket-deflection saving CS hours.
6. **Onboarding is fast** — value within 24 hours of integration.

**Considered + parked:**

- *Sales Briefs* — strong demo + higher ACV ($1.5-3k/mo), but requires fresh data (LinkedIn, news APIs) → heavier fulfillment cost + integration friction. Park for v2.
- *A/B variant LP copy grounded in customer evidence* — open lane (unsaturated wedge), but narrower buyer (mid-market with statistically significant traffic) and bundled with the same pipeline. Park for v2 as a second renderer head.
- *Blog post generation from a blank prompt* — saturated lane (Jasper/Copy.ai), explicitly rejected.
- *Social content* — solopreneur market, fails the SMB-with-budget filter from D-001.

**Strategic frame to carry forward:** The AI Content Ops pipeline is the product. Each "use case" (support→content, calls→briefs, reviews→LP) is a configurable output adapter on the same engine. We lead with one wedge but the architecture supports a portfolio.

---

## D-007 — Template count

**Status:** DECIDED (2026-05-22)

**Question:** Do we standardize on one template or maintain 2+ (e.g., "direct-offer" page + "lead-magnet" page + "long-form sales letter")?

**Context:** Strong opinion that one template forces clarity; two templates allows different buyer states (cold vs warm) without distorting either.

**Recommendation:** Start with one. Fork to a second only when we measure a real conversion gap on a specific traffic source.

**Decision:** **Use one diagnostic landing-page template for now.** Extend `DiagnosticReportLandingPage` with typed visual slots when a page has a real structural need, but do not create a separate long-copy template yet.

**Why:** The current Support Ticket Deflection Report page already needs modern long-copy, a report artifact, pricing, fit/not-fit, and FAQ. Those are diagnostic-template behaviors, not a separate page type. A second template would add maintenance before we have traffic-source data proving that the shared template is limiting conversion.

**Current implementation rule:** Add optional slots for first-viewport proof and before/after comparison. The route owns offer-specific copy, report naming, and artifacts; the template owns repeated layout rhythm.

---

## D-008 — Proof-type strategy

**Status:** OPEN

**Question:** What kinds of proof do we standardize on for the framework?

**Options (not mutually exclusive):**
- Screenshots of real outputs (B2B-friendly)
- Embedded short-form video demo (universal but production-heavy)
- Customer logos + named quotes (requires real customers)
- Numeric outcomes ("X hrs saved", "$Y produced") with source
- Specific transaction data ("we processed 14,000 reviews and 380 made it into content")

**Decision:** _pending_

---

## D-009 — SMB sub-segments (verticals)

**Status:** DECIDED (2026-05-24)

**Question:** "SMB" is too broad to write copy to. Which specific verticals?

**Decision:** B2B SaaS first. The pipeline is industry-agnostic but the copy,
proof assets, demo, and outbound targeting are all written for B2B SaaS teams.
Expand to other verticals only after the first paying SaaS customers validate
the offer. Apollo list targeting is SaaS-filtered from launch.

**Why SaaS first:** Support ticket volume is visible, exportable, and high enough
to show repeat patterns. Buyers (founders, Heads of Support, CS leads) feel
ticket cost directly. Help center infrastructure already exists in most SaaS
companies -- the gap is content and ranking, not infrastructure.

---

## D-010 — Buyer awareness stage

**Status:** DECIDED (2026-05-16)

**Question:** Where on the Schwartz awareness scale do we write to by default?

**Schwartz stages:**
- Unaware — doesn't know they have the problem
- Problem-aware — knows the pain, doesn't know solutions exist
- Solution-aware — knows solutions exist, doesn't know products
- Product-aware — knows the product, hasn't bought
- Most-aware — close to buying, needs the right offer + risk reversal

**Decision:** Write to **solution-aware to product-aware** (Schwartz stage 4-5) by default.

This follows directly from D-001's "actively seeking AI solutions" target — those buyers are already past the "should we use AI" bridge. They know solutions exist; they're comparing vendors. We write to a buyer who's:

- Already searching specific solution terms ("AI for support tickets", "Zendesk AI alternative")
- Already evaluating other AI tools
- Has budget allocated to "improve support / scale content / automate X"
- Asks "why you over [competitor]" rather than "why this category"

**Page implications:**
- We do NOT explain why AI is useful
- We DO compare directly against alternatives they're evaluating
- We DO assume baseline AI literacy (no "powered by GPT" theater)
- We DO show specific ROI math because they've earned the right to ask for it

**Pages targeting earlier-stage buyers** (problem-aware) should be a separate page type — not a watered-down version of the main page. Most likely candidates: SEO content / blog posts that capture "how do I [problem]" searches, then route those readers to the product page once they're solution-aware.

---

## D-011 — Price-range scope for offers

**Status:** DECIDED (2026-05-24)

**Question:** What price bands do our offers live in?

**Decision:**

| Tier | Price | Notes |
|---|---|---|
| Free Deflection Snapshot | $0 | First ask, no card |
| Full Deflection Report (partner) | $1,000 | First 5 design partners only, partner URL |
| Full Deflection Report (standard) | $1,500 | Public page |
| Quarterly Refresh | $1,500/quarter | Ongoing cadence |

**Gating mechanism:** Separate URL approach (see D-025). Partner price is never
shown on the public page. Standard price is never discounted on the public page.

**Annual tier ($4,800 prepaid):** Was in prior planning docs. Not confirmed or
removed in this session. Revisit after first 5 paying customers.

---

## D-012 — Page types — direct-offer vs lead-magnet

**Status:** DECIDED (2026-05-24)

**Question:** Does our framework cover direct-offer pages and lead-magnet pages,
or just one?

**Decision:** Direct-offer only. The free Deflection Snapshot is the entry point
but the page is a direct-offer page -- the action is upload your export, not
download a PDF in exchange for an email. Lead-magnet template deferred until
channel data (D-005) proves it is needed.

---

## How to use this log

- **When you make a call** on an OPEN decision, change Status to DECIDED, fill the `Decision:` field with what you chose and why (1-3 lines), and add a date.
- **When new decisions surface** in conversation, add a new D-### entry with status OPEN. Don't try to decide it then; just log it.
- **When you supersede a prior decision**, don't delete — change the old one to SUPERSEDED and link to the new one. We want to see history.

Once enough core decisions land, we'll build the matching `framework.md` and `templates/` directory next to this file.

---

## D-013 — Input data is the moat, not the output renderer

**Status:** DECIDED (2026-05-24 -- frame confirmed as operating principle)

**Frame:** Generic AI-copy tools (Jasper, Copy.ai, Anyword) compete on output quality from blank prompts. That lane is saturated. The wedge is the **input pipeline** — turning the buyer's own data (tickets, calls, reviews, docs) into evidence-grounded outputs.

**What this implies:**
- Marketing copy emphasizes the input ("your tickets → ranked content") not the model ("AI-powered blog generator")
- Output type is a configurable renderer head, not the product identity
- Defensibility is the data integrations + extraction quality + evidence linking, not the LLM

**Decision:** Confirmed as the operating frame. All copy, proof assets, and positioning
carry this frame. The headline, subheadline, Picture section, and CTA copy all
reference the buyer's own ticket data as the source -- not AI generation from scratch.

---

## D-014 — Lead-with-one vs portfolio positioning

**Status:** OPEN

**Question:** From day one, do we position publicly as:

- (A) "Help-doc / FAQ generator from your support tickets" — single sharp wedge
- (B) "Your customer-data-to-content engine — start with FAQs, expand to LP copy, sales briefs, etc." — portfolio framing

**Tradeoffs:**

| | (A) Single wedge | (B) Portfolio |
|---|---|---|
| Conversion velocity | Faster — buyer instantly knows what it does | Slower — buyer has to map to their use case |
| Pricing power | Lower (one outcome to price against) | Higher (multiple outcomes to bundle) |
| Future flexibility | Have to rebrand later when adding outputs | Already positioned for expansion |
| Demo specificity | Sharp, visceral | Risks "do everything" vagueness |

**Recommendation:** **(A) Single wedge** publicly. Build the architecture for portfolio internally. Add a second renderer head only after the first one has paying customers.

**Update — 2026-05-16 (multi-department angle surfaced):**

The same ticket data feeds outputs for **different departments inside the same customer** — FAQs for Marketing/CS, sales-objection map for Sales, feature-request ranking for Product. This makes the portfolio play more credible because expansion happens within an existing account with zero new data integration.

Externally still keep the wedge ("support tickets → FAQs") until the first paying customer asks for the second output. Customer-pull determines the next renderer head; the resulting story is "Customer X used us for FAQs and asked us to also do their sales objections" — sharper than self-declared "we do everything."

**Internally:** treat the portfolio as architecture target + vision; **externally:** keep the wedge until the customer asks for more.

**Decision:** _pending_ (still leaning single-wedge externally, with multi-output as land-and-expand framework once we have proof)

---

## D-015 — Offer shape

**Status:** DECIDED (2026-05-16)

**Question:** What does the actual purchase look like?

**Decision:** Three-tier offer ladder, shipped on `/systems/support-ticket-deflection`:

| # | Tier | Price | Cadence | Purpose |
|---|---|---|---|---|
| 1 | **First wedge report** | Free | One-time | First-5 design-partner offer per D-019; D-018 magic moment delivered for verification |
| 2 | **Quarterly wedge report** | $1,500 | Every 90 days | Recurring deliverable; matches operator Q5 + D-022 recurrence framing |
| 3 | **Annual (4 reports)** | $4,800 | Prepaid yearly | 20% discount vs quarterly; cash-flow anchor; ops-budget-friendly |

**Qualifier:** The free Deflection Snapshot can run on a few hundred closed tickets when repeat questions are visible. The full paid report works best with ~2,000+ closed tickets so the 25-50 item ranking math is honest. Below a few hundred tickets, the snapshot should fail closed or ask for a wider export window.

**No retainer.** Previous `/systems/ai-content-ops/ongoing-support` retainer offer ($2,500/mo) is dropped from this product's pricing — the quarterly cadence subsumes ongoing optimization. The retainer page itself can stay live for non-Gap-Report engagements but is no longer linked from this product's pricing section.

**What's not included** (named in the pricing section, per D-002 #6):
- No integration into the buyer's help center — they publish from their CMS
- No real-time alerts — quarterly cadence, not per-ticket
- No copywriting beyond the top 3 FAQ drafts — we hand them the framework, their tech writer scales

**Reasoning:**

- **Free first analysis** matches D-019's design-partner motion. Cold buyer → CSV upload → report in 48 hours → become customer #1-5. No card, no contract, qualifies via deliverable value not pricing-page commitment.
- **$1,500/quarter** sits at the LOW end of D-017's founder-led pricing band ($1,500-3,000/mo while UI matures). Reasoning: first product, no customers yet, drop friction. Raise to $2,500 after 5 paying customers validate value.
- **$4,800/year (saves $1,200)** = 20% annual discount. Direct-response standard anchor — cash flow for us, locked rate for them.
- **Quarterly cadence** turns "one-time data report" into "operational discipline" — same trick that makes Gainsight / ChurnZero / monthly intelligence reports work.

**What this rejects:**

- **14-day free trial** — SMB free trials convert at <2% and consume support time
- **$500 paid pilot** (from original recommendation) — too low to qualify buyer intent; either free or quarterly-priced is sharper
- **Done-for-you retainer at $2-5k/mo** — wrong-shaped product; we sell a deliverable, not capacity
- **Subscription-only with no free tier** — no proof artifact = no first conversion

**Connections to other decisions:**

- D-017 founder-led product → $1,500/quarter sits in the pricing band that supports manual fulfillment
- D-018 magic moment → free Deflection Snapshot IS the magic moment, productized as the entry tier
- D-019 first-5-customers → free tier IS the LinkedIn outbound offer (upload your export via the intake UI)
- D-022 known-problem framing → "Free first analysis. Paid quarterly after." is two beats matching the known→action structure
- D-024 action path → every tier terminates in a single concrete next step (Upload export / Subscribe Quarterly / Subscribe Annually)
- D-025 partner URL → free snapshot is the offer on the partner URL; paid report price shown as $1,000 on partner page, $1,500 on public page
- D-027 export window → first ask is 3-6 month full export, not 90 days

---

## D-016 — Integration scope for v1

**Status:** DECIDED (2026-05-24)

**Question:** Which support platforms do we integrate on launch, and what ingestion methods do we support?

**Two dimensions: ingestion method × platform**

**Ingestion methods, ranked by friction:**

| Method | Friction | Best fit |
|---|---|---|
| **Manual paste** (50-100 tickets in a textarea) | Zero | Live sales-call demo — "paste 20 tickets, watch this" |
| **CSV / JSON export** | Near-zero — admin runs an export, uploads file | **Primary entry point** for free analysis + paid pilot. No auth, no IT review, no security questionnaire. |
| **API token (read-only)** | Low — admin issues a token | **Upgrade path** for paying customers running weekly/monthly |
| **Email forwarding** | Medium — platform-level rule | Incremental real-time ingestion without API |
| **Zapier / Make.com webhook** | Medium — admin builds a Zap | New-ticket auto-ingestion |
| **Browser extension / scraping** | High (fragile + security ask) | Not v1 |
| **DB direct access** | Very high | Not at this stage |

**Platform coverage, ranked by SMB B2B SaaS share:**
- Zendesk (largest)
- Intercom
- HelpScout
- Freshdesk

**Strategic shift:** Originally framed as "Zendesk API integration first." With CSV/manual ingestion in v1, we can serve **any platform that supports export** (which is all of them) from day one — without writing a single platform integration. API integrations become the upgrade lever, not the launch gate.

**Updated recommendation:**
- **v1 ingestion:** Manual paste + CSV/JSON upload — universal, zero auth required
- **v1 demo:** Manual paste (60-second wow on a call)
- **v1 free analysis:** CSV upload (customer self-serves the export from their platform)
- **v2 upgrade for paying customers:** Zendesk API (most-asked first), Intercom API (second)
- **v3+:** HelpScout, Freshdesk API as customer demand pulls

**Why this matters for D-019 (first 5 customers):** The intake UI accepts uploads directly.
The pitch is "upload your full 3-6 month export at [partner URL] and we will send back
a ranked snapshot in 24 hours." No CSV handoff by email, no auth dance, no security review.

**Decision:** DECIDED (2026-05-24). v1 ingestion is self-serve UI upload (CSV/JSON/JSONL).
The buyer uploads via the intake form at the product URL. No manual handoff. No API
integrations at launch. Copy must say "upload your export" not "send us a CSV" or
"connect Zendesk." API integrations remain the v2 upgrade path.

---

## D-017 — Fulfillment model — self-serve product vs managed service

**Status:** DECIDED (2026-05-16)

**Question:** Do customers run the workflow themselves through a dashboard, or do we run it for them?

**Current reality (2026-05-16):** Product UI exists but is in-flight, not complete. This rules out "pure self-serve" (UI isn't ready) AND rules out "pure managed" (UI exists and shouldn't be hidden). What's actually true:

**Decision: Founder-led product.** Hybrid customized to the in-flight UI state:

- Customer sees the UI for the parts that work today
- Juan personally runs/bridges the parts the UI doesn't cover yet (using Loom, email, Notion, or direct invocation of the pipeline)
- As the UI matures, the bridging shrinks
- Customers are told this honestly — early-stage SaaS buyers expect it and trust the trajectory more than they trust a fake-finished product

**Why this is the right framing now:**

1. **Aligned with D-001's "actively seeking" buyer profile.** Actively-seeking buyers are evaluating AI vendors at all maturity levels. They're sophisticated enough to recognize founder-led products and reward them with patience.

2. **Aligned with our voice (D-002 #6 — name what we don't do).** Plain-spoken specific naturally extends to "the product is at this maturity level today" instead of pretending.

3. **Doesn't block first revenue.** We can sell and deliver value with whatever the UI covers today + founder bridging — no need to wait for "v1 GA."

4. **Generates the right product feedback.** Founder-led delivery means Juan personally sees every friction point + builds the next UI iteration against real customer use, not assumed use.

**Transition out:** As the UI matures and bridging shrinks to <30 min/customer/week, transition to hybrid (managed first 30 days, self-serve after). Pure self-serve only once 10+ customers run successfully unattended.

**Pricing implication:** Founder-led can sustain $1500-3000/mo while bridging is heavy. Drops to $500-1500/mo when UI handles most of the workflow. Pricing should be communicated as outcome-priced ("$X/mo for the report") not headcount-priced.

---

## D-018 — "Magic moment" — what the buyer sees in first 24 hours

**Status:** DECIDED (2026-05-22)

**Question:** What's the visceral, demonstrable outcome that hooks the buyer in their first 24 hours?

**Candidate magic moments:**
- Ranked list of "your top 50 customer questions by ticket volume" with one-line summaries
- First 5 publish-ready FAQ entries with cited tickets ("47 customers asked some version of this")
- Identified the 10 highest-volume questions WITHOUT a help doc (the gap)
- Estimated ticket-deflection rate if the top 10 FAQs went live

**Recommendation:** Combine — show **the ranked list + top 5 ready-to-publish FAQs + the 10 highest-volume gaps** in one report. That's the "wow."

**Decision:** **The magic moment is a wedge-specific report preview: ranked repeat issues, customer-language examples, highest-volume gaps, and the first draft outputs your team can review.**

For the Support Ticket Deflection Report page, this shows up twice:

- In the first viewport as a compact artifact preview so the buyer immediately understands what comes back.
- In the main sample section as the fuller public-dataset report artifact with source counts and grounded FAQ excerpts.

Future wedges should keep the same magic-moment shape but rename the artifact for the wedge, such as Sales Objection Report, Feature Request Report, or Local SEO Report. Do not make "Gap Report" the permanent customer-facing brand.

Do not claim the report guarantees ranking, prevents churn automatically, or fully optimizes SEO/GEO/AEO. The safe promise is that it turns repeat source data into clear draft outputs the team can review, edit, and ship.

---

## D-019 — First-5-customers acquisition motion

**Status:** DECIDED (2026-05-22)

**Question:** How do we get the first 5 paying customers?

**Options:**
- Cold LinkedIn outbound to Heads of CS at $1M-$20M ARR B2B SaaS
- Cold email to same
- Post case studies (do free analyses + post results with permission) — bait the network
- Partnerships with Zendesk-adjacent consultants
- Slack communities (CS Leaders, RevOps Co-op, Pavilion)
- Founder network referrals

**Recommendation:** Stack 3 channels — do **10 free analyses** to companies in your network (or strangers via LinkedIn) + post the most striking results publicly + cold LinkedIn outbound to similar-shaped companies referencing the published results.

**Decision:** **Run 10 free Deflection Snapshots to earn the first 5 serious conversations.** Start with warm network and founder-led LinkedIn outreach to support-heavy B2B SaaS teams, then publish anonymized patterns only after review.

**Operating rule:** The first ask is not "buy software." It is "upload your full
3-6 month export at [partner URL] and we will show the repeat questions worth
deflecting first within 24 hours." The conversion event is a completed upload
via the intake UI. No CSV handoff by email, no scheduled call required.

**Target account shape:**

- B2B SaaS, marketplace, or productized service business.
- Uses Zendesk, Intercom, Freshdesk, HelpScout, or a support inbox that can export CSV.
- Has enough support volume that repeat questions are visible, but not enough documentation ownership to keep up.
- Buyer feels ticket-volume pressure directly: founder, Head of Support, CS lead, or operator responsible for support cost.

**Proof rule:** Do not publish company names, screenshots, ticket excerpts, volume counts, or before/after numbers without explicit permission. Until measured customer outcomes exist, public proof can say what the snapshot found, not what it guaranteed.

---

## D-020 — Build product first vs run workflow manually

**Status:** DECIDED (2026-05-22)

**Question:** To deliver the first free analyses (per D-019), do we:

- **(A) Manual** — prompt Claude/GPT directly + Notion templates, no productized pipeline yet
- **(B) Build the productized version first** — Zendesk API + CSV ingest + pipeline + report rendering
- **(C) Hybrid** — first 3 analyses manual; productize starting at #4

**Tradeoffs:**

| Option | Time-to-first-analysis | Per-analysis cost | Scales | Learning rate |
|---|---|---|---|---|
| (A) Manual | 1-2 days | $20-50 API + 4-8 hrs of your time | No | High — you discover what to actually build |
| (B) Build first | 2-3 weeks | $5-10 API + 30 min after first run | Yes | Lower — building before knowing the workflow |
| (C) Hybrid | 1-2 days for first analysis; productize in weeks 2-5 | Mixed | Yes after #4 | Best of both — learn first, automate second |

**Recommendation:** (C) Hybrid. First 3 analyses run manually using existing Atlas pipeline + manual prompts; from #4 onward the productized version takes over.

**Decision:** **Use the hybrid path.** Run the first 3 Deflection Snapshots manually with existing tools and documented review gates. Productize only the stable parts that repeat across those first analyses.

**Why:** The landing page promise is already narrow enough to deliver manually: rank repeat tickets, extract customer wording, draft a small number of self-service answers, and name the next action. Building automation before the first customer CSVs would hide the messy parts we need to learn from.

**Manual floor for the first 3 snapshots:**

- Intake: buyer uploads via the intake UI at the partner URL.
- Normalize: remove obvious PII and discard unusable rows.
- Cluster: group repeat questions by intent.
- Rank: sort by visible ticket volume and severity clues.
- Draft: write one free sample self-service answer for the snapshot.
- Review: human check before sending anything back.
- Action path: name the first answers to publish or revise.

**Productization trigger:** Start automating a step only after it repeats across at least 3 customer CSVs with the same input shape, review criteria, and deliverable language. Do not automate edge-case cleanup first.

**Playbook:** `docs/landing-page-framework/support-deflection-first-analysis.md`.

---

## D-021 — Tier-A output expansion order (which renderer head after FAQs)

**Status:** OPEN (anticipatory — decide when first FAQ customer asks for second output)

**Question:** Once support-tickets → FAQs is shipping and we have ≥1 paying customer, which Tier-A output do we productize next?

**Strategic frame:** The same ticket data has multiple outputs that target different departments inside the same customer (per D-014 update). Adding a second output = land-and-expand inside existing accounts with zero new data integration.

**Tier-A candidates (content-shaped, fit the pipeline):**

| Output | Target buyer | Why it's strong |
|---|---|---|
| **Sales objection map + battle cards** | Head of Sales / RevOps | Highest ACV uplift; ties directly to deal flow |
| **Feature request ranking with citations** | Head of Product / PM | Most-asked PM question; customer language with volume counts |
| **Onboarding friction map** | Head of CS / Implementation | Concrete "where new customers get stuck" report |
| **Competitor mention report** | Head of Marketing / CRO | Surfaces who you're losing to and why, in customer's words |
| **Documentation gap audit** | Head of CS / Tech writing | Adjacent to FAQs but distinct: "what should exist but doesn't" |

**Decision strategy:**

Don't pick this in advance. **Let the first paying FAQ customer pull the next output** by asking for it. Customer-pull turns the second product into a referenceable case study ("Customer X started with FAQs, asked us to also do sales objections — here's what we found in their tickets") which is sharper marketing than internal prioritization.

If no customer asks within 90 days of FAQ launch, default to **sales objection map** as the next productized renderer head — highest ACV, clearest revenue tie, strongest cross-department land-and-expand story.

**Decision:** _pending — revisit at first-customer milestone_

---

## D-022 — Problem framing — known vs unknown problem in hero

**Status:** DECIDED (2026-05-16)

**Question:** Does the hero lead with a problem the buyer KNOWS they have, or one they DON'T realize they have?

**Decision:** **Lead with known, hook with unknown.** Two-beat sequence in every product hero:

1. **Beat 1 — Known problem (recognition in 5 seconds).** Name the operational pain the buyer already feels. They recognize themselves immediately. Search-intent match.
2. **Beat 2 — Unknown hook (differentiation).** Name something they didn't realize was related to the same data / problem. Distinguishes us from competitors targeting only the known problem.

**Why this sequence, not either alone:**

| Approach | Pros | Cons |
|---|---|---|
| Known-only | Easy recognition, search-intent match | We look identical to every competitor in the category |
| Unknown-only | Massive differentiation, novel category | High bounce — buyer doesn't recognize themselves, doesn't realize page is for them |
| **Known → unknown (chosen)** | Recognition first, then differentiation. Buyer thinks "yes, that's me" → "wait, I didn't think of that" | Requires both to land in 15 seconds. Tight writing. |

**Reference example for the support-tickets → FAQs product:**

> **Hero (known):**
> You have 30,000 closed support tickets in Zendesk and 12 help docs.
> Your team answers the same 50 questions every week.
> You know your help center should be bigger. You don't have the time.

> **Sub-hero (unknown hook):**
> Most help center tools generate articles from a topic. Ours generates them from your *actual customer questions*, ranked by how many times your customers asked. The result ranks for SEO because it's written in your customers' words — not your team's.

**Why this aligns with the framework so far:**

- **D-002 / D-004 (plain-spoken specific, warm):** Beat 1 is specific recognition ("30,000 tickets"), beat 2 is transparent mechanism ("ranked by how many times customers asked")
- **D-010 (solution-aware/product-aware buyer):** They already know they have a content/help-doc problem; we don't have to convince them. We just need to be the *specific* tool worth picking.
- **D-013 (input data is the moat):** The unknown hook is structurally about the input source ("written in your customers' words, not your team's"). Reinforces the data-as-moat positioning.

**Applies to every product page** in the framework, not just AI Content Ops. Each product's hero must answer: what's the known pain (Beat 1) + what's the related thing competitors miss (Beat 2)?

**What this is NOT:** It's not "lead with curiosity gap." Curiosity-gap headlines ("the one thing your support data is hiding") fail with actively-seeking buyers because they read as clickbait. We name the problem directly, then differentiate. No teasing.

---

## D-023 — Customer-facing product name (vs internal platform name)

**Status:** DECIDED (2026-05-16)

**Question:** What is the public, customer-facing name of our first product?

**Decision:** **Use wedge-specific report names.** "Gap Report" describes the pattern, not the permanent customer-facing product brand.

**The naming distinction:**

- **AI Content Ops Station** = internal platform / engine family name. Not the visible offer name on focused product pages.
- **Support Ticket Deflection Report** = the current support-ticket wedge: support tickets to self-service answers that reduce avoidable repeat tickets.
- **Future report names** should fit their wedge: Sales Objection Report, Feature Request Report, Onboarding Friction Report, Local SEO Report, or another specific deliverable name.

This keeps the useful "gap" instinct without forcing every future page into the same brand. The buyer should understand the report from the page title alone.

**Why this supersedes the earlier Gap Report framing:**

- **Wedges need their own language.** A support leader understands Support Ticket Deflection Report faster than a generic Gap Report. A sales leader may understand Sales Objection Report faster than Gap Report.
- **Names the deliverable, not the technology.** Matches D-013 frame: the input data and action path are the moat, not the model.
- **Preserves expansion.** The shared pattern can produce many reports while each page feels specific to its buyer and traffic source.
- **Avoids premature brand lock-in.** We do not yet have enough market evidence to make Gap Report the umbrella product brand.

**Tagline rule:** Name input and output in one short phrase. For the Support Ticket Deflection Report: *"From your support tickets. For your self-service layer."*

**SEO + URL implications:**

- AI Content Ops stays at `/systems/ai-content-ops` as the broader content-operations system page.
- The support-ticket wedge lives at `/systems/support-ticket-deflection` so the focused offer does not overwrite the platform page.
- Page metadata should use the wedge name that buyers understand. The current support-ticket wedge uses "Support Ticket Deflection Report." Future wedge pages should get their own focused URLs once the product exists.

**What the platform name is used for going forward:**

- Internal documentation, architecture diagrams, code module names
- Investor / partner conversations where platform framing matters
- NOT customer-facing landing pages, ads, cold DMs, or demo materials for wedge-specific pages

---

## D-024 — Every deliverable terminates in an action path

**Status:** DECIDED (2026-05-16)

**Question:** What structural rule do we apply to every deliverable we ship — reports, demos, landing pages, case studies, emails?

**Decision:** **Every deliverable terminates in an action path.** No abstract "things to consider," "next steps to explore," or "key takeaways" that don't translate into a concrete next action.

A deliverable without an action path is academic. A deliverable WITH an action path is operational. SMB owners (D-001) demand operational. They feel consequences directly; their abstraction tolerance is low. If payroll depends on fixing the issue, "considerations" don't help — only the next concrete step does.

**What this rule rejects:**

- "Here are 7 trends to watch in customer support."
- "Key takeaways: AI is changing how teams operate."
- "Recommendations: consider implementing a knowledge management strategy."
- Reports that end with a summary slide and no next action
- Pages that end with "learn more" buttons leading to other pages with no terminal action

**What this rule requires:**

- Every report ends with a concrete "do this" section — what to ship, when, who owns it
- Every long-form page section terminates in a specific next click (CTA, deliverable preview, demo)
- Every sales demo concludes with one named next step ("send us a CSV by Friday")
- Every case study ends with "this is what our customer did next" — naming the action
- Every email follow-up ends with one named ask

**Connection to D-022 and the Operator's 5-Question Structure (`voice-reference.md` §5.4):**

Question 4 of the operator framework is "Who fixes it / how?" — that's the action path. This decision elevates that question from a writing pattern to a non-negotiable framework rule. Every deliverable we ship MUST answer question 4 concretely. Other questions (1, 2, 3, 5) may be soft-pedaled in shorter deliverables; question 4 cannot.

**For report-style wedges:**

- The Support Ticket Deflection Report deliverable must end with "Ship these 3 self-service answers Monday" — not "consider building these 10 help docs"
- The free-analysis email must end with "Send the next CSV in 90 days for a refreshed Deflection Report" — naming the recurrence cadence (also satisfies question 5)
- The product page CTA must be a single-step action ("Send us your CSV") — not a multi-form intake or "learn more" loop

**Pitfall — honest scope over performative actionability:**

Don't invent fake action paths to satisfy this rule. If a deliverable genuinely doesn't have a clear next action, that's a sign the deliverable shouldn't exist — not a sign to invent one. A piece of content that's primarily informational (e.g., an architecture diagram, a glossary) doesn't need an action path; it shouldn't pretend to have one.

---

## D-025 -- Partner pricing gate -- URL approach

**Status:** DECIDED (2026-05-24)

**Question:** How do we gate the $1,000 partner price for the first 5 design partners
without engineering a discount system?

**Decision:** Separate URL approach.

- Public page at `/systems/support-ticket-deflection` shows $1,500 standard price.
- Partner page at `/systems/support-ticket-deflection/partner` shows $1,000 partner price.
- Partner URL is shared only in outbound DMs and cold email.
- Partner URL is never linked from the public page.
- No coupon codes, no honor system, no Stripe discount engineering required at launch.
- First 5 design partners only. Once filled, the partner URL can be retired or
  redirected to the public page.

**Why this approach:** Matches D-017 founder-led model. Simple to execute today
with no engineering. Keeps the public page clean -- no two-tier pricing explanation
required. Outbound message controls who sees the partner price.

---

## D-026 -- Landing page copywriting framework

**Status:** DECIDED (2026-05-24)

**Question:** What copywriting framework structures the landing page?

**Decision:** Promise, Picture, Proof, Push.

| Section | Job |
|---|---|
| Promise | Headline and subheadline. Land the offer in 5 seconds. |
| Picture | Four-beat scene. Put the reader's own situation back at them. |
| Proof | Three-layer stack: category SEO truth, demo, calculator. |
| Push | Single action. Upload your export -- free. No alternatives. |

**Picture section -- four beats (locked):**

1. Open on the scene -- second person, agent, queue, Monday morning.
2. Name the specific questions -- lowercase, customer-phrased, 3-4 examples.
3. Run the math -- small to large, $20 anchor, visceral not precise.
4. Name the cause, land on the missed opportunity -- the language gap, end on
   what Google could have handled.

**Proof stack -- three layers (locked):**

1. Category truth -- ranked pages outperform unranked, established SEO fact.
2. Demo -- inline comparison, company language vs customer language on real data.
3. Calculator -- buyer inputs their own numbers, confirms their own suspicion.

**What this framework rejects:** Bullet-point pain lists. Lecture on why SEO
matters. Curiosity-gap headlines. Vague CTAs.

**Full framework doc:** `landing-page-framework.md`

---

## D-027 -- Export window for first ask

**Status:** SUPERSEDED by D-030 (2026-06-05). **D-030 is the current source of truth for the first-ask window (now 30 days).** Everything below in D-027 — including the "3 to 6 month export" decision and its "Copy implication" — is historical and no longer current guidance; it is retained only for the rationale trail.

**Question:** What ticket export window do we ask for in the first ask?

**Previous default:** 90 days (from D-019 and acquisition pack).

**Decision:** 3 to 6 month export. Any period works -- the volume and window do not affect the paid report scope or price. The 3-6 month ask gives enough data to show repeat patterns without making the export feel like a large project.

**Why the window changed (revised 2026-05-24):**

- The pipeline handles up to 50,000 rows. A 90-day sample undersells the
  capability and produces weaker clustering.
- More data means the financial math in the snapshot is more alarming.
  15 repeat tickets over a month is annoying. The same 15 questions costing
  $18,000+ over a year is a budget conversation.
- Full history gives the deterministic parser a richer set of customer language
  clusters, making FAQ drafts more accurate.

**Qualifier:** Below a few hundred usable rows the snapshot fails closed or asks
for a wider export window. The 3-6 month ask assumes the buyer has enough
support volume to show repeat patterns. Thin-signal reply process unchanged.

**Copy implication:** All outbound messages, landing page CTAs, and intake
instructions say "upload your last 3 to 6 months" not "last 90 days." NOTE: the
**quarterly refresh cadence stays "every 90 days"** — only the *first-ask export
window* changes. Copy swaps are per-instance, not a global find-replace.

---

## D-028 — Google/SEO-ranking headline — current wedge vs a separate offer

**Status:** DECIDED (2026-05-25)

**Question:** `copy-template.md` locks a headline that foregrounds Google/SEO
ranking ("Is Google deflecting your tier-one tickets? … FAQ pages that rank on
Google"). Does it go on the current wedge?

**Decision:** **No — not on the current wedge, and not yet.** The Google/SEO-ranking
angle is locked as a **separate future offer / landing to test.** The current wedge
(`/systems/support-ticket-deflection`) stays on the **cost / repeat-answering**
angle. This is the direction we move *later*, not now.

**Why:** "ranks on Google" is a stronger claim than the search backend (relevance
ranking, not an SEO guarantee) can defensibly stand behind today. Quarantining it
to a separate test page keeps the live wedge inside the no-guaranteed-ranking
guardrail. Revisit as its own landing/A-B once ranking outcomes can be substantiated.

---

## D-029 — Mechanism altitude on the landing (3 steps vs the pipeline)

**Status:** DECIDED (2026-05-25)

**Question:** `copy-template.md` §18 says the mechanism section is "three steps
maximum." The wedge currently renders a 6-stage pipeline (Support Tickets →
Cluster → Rank → Extract → Draft → Review & Publish).

**Decision:** The landing's **"how it works" = 3 buyer-altitude steps** (export →
we run the analysis → the repeat questions stop becoming tickets — matching the
demo's existing `HowItWorks`). The 6-stage pipeline's internal rigor
(cluster / rank / extract / draft) is **not deleted** — it **relocates to a
proof / methodology context** (the demo, or a "what the analysis does" line), where
detail reads as credibility, not friction.

**Why:** the 6 stages mix what the *buyer* does with internal mechanics; for a
15–75 operator the 3-step view lowers perceived effort, while the pipeline detail
still earns trust where rigor = proof (D-002 specific, D-013 data-is-moat).

---

## D-030 -- First-ask export window simplified to 30 days

**Status:** DECIDED (2026-06-05) — supersedes D-027.

**Question:** What ticket export window do we ask for in the first ask?

**Decision:** **30 days.** The first-ask copy across every deflection surface asks
for "30 days" / "the last 30 days" of closed tickets, not "3 months" / "3-6
months."

**Why the window changed again:**

- **Simplicity / lower friction.** "Last 30 days" is the smallest, most concrete
  export a buyer can produce without it feeling like a project — the point of the
  free snapshot is a fast value check, not a full audit.
- **Consistency with the artifact.** The snapshot demo and the live snapshot are
  built around a 30-day source window (`DEMO_DEFLECTION_SNAPSHOT.summary` uses
  `source_window_days: 30`). Asking for 3 months while the snapshot reads as a
  30-day window was an internal contradiction (tracked in the #250 landing review).

**Trade-off (acknowledged, accepted):** D-027 argued a longer window produces
stronger clustering and a more alarming annualized cost figure. That reasoning
still holds; we are accepting a smaller first sample in exchange for a simpler
ask and a consistent artifact. The snapshot already annualizes from the source
window, so the cost framing survives a shorter window.

**Carve-outs (unchanged):** the **quarterly refresh cadence stays "every 90
days"**, and the **data-retention "held 90 days"** line is unrelated — neither is
a first-ask export window. Copy swaps are per-instance, not a global
find-replace.
