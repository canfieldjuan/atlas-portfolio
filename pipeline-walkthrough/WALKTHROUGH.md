# Pipeline Walkthrough: From Raw Review to Evidence-Backed Campaign

This walkthrough follows a single G2 review through every stage of the ATLAS intelligence pipeline. Each step shows the actual data structure produced by the system.

---

## Step 1: Raw Review Ingestion

**File**: [`01_raw_review.json`](01_raw_review.json)

A review gets scraped from G2. At this point it's just unstructured text -- a frustrated VP of Sales at Meridian Technologies venting about Salesforce's 18% price increase and their upcoming evaluation of HubSpot and Pipedrive.

The raw data has: vendor name, rating, freeform text, reviewer title, company name, company size. That's it. No structure, no signals, no actionable intelligence.

```
"We've been using Salesforce Sales Cloud for 3 years now and honestly
the value proposition has gotten worse every renewal. Our annual contract
just went up 18% with no new features that matter to us..."
```

---

## Step 2: LLM Enrichment (47 Structured Fields)

**File**: [`02_enriched_review.json`](02_enriched_review.json)

The enrichment pipeline sends this review through a local LLM (vLLM) with a structured extraction prompt. Two passes:

**Tier 1 (Extract)** -- Pull out verbatim signals:
- 4 churn signals detected (actively evaluating, contract renewal, price complaint)
- 4 specific complaints extracted as bullet points
- 4 quotable phrases with exact wording
- 3 pricing-related phrases
- 2 competitor mentions (HubSpot: high confidence, Pipedrive: medium)
- 2 timeline events (Q3 renewal, October departure)
- Budget signal: $180K/year annual spend

**Tier 2 (Classify)** -- LLM classification:
- Pain categories: pricing (primary), UX (primary), features (secondary), support (secondary)
- Sentiment: negative, declining trajectory
- Buyer authority: economic buyer, active purchase stage, decision maker
- Timeline: within quarter, contract end Q3 2026
- Urgency score: **8.2 / 10**

**Layer 3 (Derived)** -- Deterministic computed fields:
- Content classification: review
- Reviewer context: executive, mid-market, technology, decision maker
- Richness class: **rich** (high signal density)
- Would recommend: **false**

One messy paragraph became 47 structured, queryable fields.

---

## Step 3: Churn Signal Aggregation

**File**: [`03_churn_signal.json`](03_churn_signal.json)

Weekly, all enriched reviews for a vendor get aggregated into a single churn signal record. For Salesforce CRM across 847 reviews:

- **89 reviews** with active churn intent
- **42% price complaint rate** (highest pain category)
- **31% decision-maker churn rate** -- not just end users complaining, executives are leaving
- NPS proxy: **-12.3** (strongly negative)
- Archetype: **pricing_shock** (87% confidence)
- Risk level: **accelerating**

The system also identifies the top competitors capturing Salesforce's churning customers:
- HubSpot: 203 mentions, 67 confirmed displacements
- Pipedrive: 89 mentions, 23 displacements

And a company-level churn list with urgency scores for each.

---

## Step 4: Evidence Vault

**File**: [`04_evidence_vault.json`](04_evidence_vault.json)

Evidence vaults are **deterministic intermediate representations** -- canonical evidence pools computed once and consumed by all downstream artifacts (battle cards, campaigns, briefings, reports). This prevents re-computation and ensures consistency.

The vault contains:
- **Weakness evidence** with confidence scores, affected segments, quotable phrases, trend direction
- **Strength evidence** (what keeps customers from churning -- integrations, brand recognition)
- **Company-level signals** with urgency, buyer role, buying stage, contract end dates
- **Metric snapshot** summarizing the vendor's position

Key insight: the vault reveals that Salesforce's strength (integrations) is also its retention anchor. Customers want to leave but perceive switching costs as high.

---

## Step 5: Campaign Generation

**File**: [`05_campaign_output.json`](05_campaign_output.json)

The campaign generator takes the enriched data and produces a personalized outreach email. For Meridian Technologies:

- **Opportunity score: 84/100** (economic buyer + active purchase + high urgency + pricing pain)
- **Channel**: cold email
- **Subject**: "Meridian's CRM evaluation -- data from 847 Salesforce reviews"
- **Body**: References their specific situation (Q3 renewal, HubSpot evaluation), includes 3 data-backed talking points, offers a relevant intelligence brief

The email does not feel generic because it is grounded in their actual review data -- their urgency score, the competitors they mentioned, and the market context (67 confirmed Salesforce-to-HubSpot switches).

Quality audit confirms: no placeholder text, no spam triggers, specificity checks pass.

---

## Step 6: Battle Card

**File**: [`06_battle_card.json`](06_battle_card.json)

Battle cards are competitive positioning artifacts generated from evidence pools plus reasoning synthesis:

- **Discovery questions**: "When is your next Salesforce renewal?" / "How many people can actually administer Salesforce?"
- **Landmine questions**: "Have you calculated total cost of ownership including admin salaries?"
- **Objection handlers**: Each has acknowledge / pivot / proof point structure
- **Talk track**: Opening → mid-call pivot → closing, with specific data points
- **Recommended plays**: "Pricing reality check" (target: mid-market, timing: 6-8 weeks before renewal)
- **Why they stay**: Honest assessment of Salesforce's strengths with neutralization strategies

Every claim in the battle card traces back to source reviews through evidence vault citations.

---

## The Full Pipeline

```
Raw G2 review (unstructured text)
    |
    v
LLM Enrichment (47 structured fields)
    |
    v
Churn Signal Aggregation (per-vendor metrics)
    |
    v
Evidence Vault (canonical intermediate representation)
    |
    +---> Campaign Email (personalized, data-grounded)
    |
    +---> Battle Card (discovery questions, objection handlers, talk tracks)
    |
    +---> Blog Post (SEO article: "Top Salesforce Alternatives for Mid-Market")
    |
    +---> Vendor Briefing (email-delivered intelligence package)
    |
    +---> Intelligence Report (PDF with charts and executive summary)
    |
    +---> Product Profile (vendor knowledge card)
```

Every output is traceable to source reviews. Every claim has a confidence score. The evidence pools ensure consistency -- a battle card and a campaign email referencing the same vendor use the same underlying data.
