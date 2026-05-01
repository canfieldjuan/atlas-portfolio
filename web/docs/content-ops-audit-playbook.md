# Content Ops Opportunity Audit — Production Playbook

Last updated: May 1, 2026.

Internal-only. Drives consistent production of the $1,500 fixed-price audit sold on `/systems/ai-content-ops`. Not customer-facing.

The audit's job is to (a) give the buyer enough proof to trust the system without doing a $7,500 pilot inside a $1,500 audit, and (b) produce a recommended pilot scope that makes the next step obvious.

## Deliverables

Two artifacts per audit. Both required.

1. **Written assessment** — 5–10 page Notion or PDF report following the page-by-page template below.
2. **Mini proof-of-output** — 2–3 sample assets generated from a small sample of their real data (one blog outline or intro, one short email sequence, one sales brief, one landing page section, or three social posts — pick the shape that fits their data best).

Frame the proof-of-output in writing as: "This is a sample output from the audit process, not an automated workflow build."

## Scope guardrails — what NOT to include

These belong in the pilot or full build. Refusing them in the audit protects unit economics.

- No full pipeline setup
- No integrations
- No dashboard
- No automation scripts
- No reusable production templates
- No live app access
- No unlimited content generation
- No full data cleanup
- No full content calendar
- No publishing setup

If a buyer asks for any of the above during the audit, route the request to "this is in the pilot scope; here's the recommended pilot quote at the end of your assessment."

## Time budget

Target: 4–8 hours total per audit, 2-business-day turnaround after intake. Hard ceiling 8 hours — escalate or scope down past that.

| Step | Target | Notes |
|---|---|---|
| Intake review | 30–60 min | Form submission + uploaded sample data; flag anything unusable before starting |
| Data scan | 1–2 hr | Review quality, themes, density, redaction needs |
| Opportunity map | 1–2 hr | Content outputs + automation paths + readiness score |
| Mini proof-of-output | 1–2 hr | 2–3 sample assets from their data |
| Final report | 1–2 hr | Compile the written assessment using the template below |
| Walkthrough call | 30–60 min | Optional 30-min readout; counts toward the budget if used |

At 5 hours/$1,500 = $300/hr blended, which lets you stack 3–4 audits/week without burning out. First 2–3 audits will overrun while templating settles in.

## Page-by-page report template

Use the same structure every time. Variation slows production and creates inconsistent buyer experience.

### Page 1 — Executive Summary

- Biggest opportunity (one sentence)
- Biggest bottleneck (one sentence)
- Best first workflow to build (one sentence)
- Recommended next step (one sentence: pilot, full build, or "not ready, here's why")

### Page 2 — Data Source Review

Table:

| Source | Usability | Notes | Best Outputs |
|---|---|---|---|
| CRM notes | High | Good customer language | emails, sales briefs |
| Reviews | Medium | Noisy but useful themes | blogs, social |
| Support tickets | High | Strong pain points | help docs, emails |

Rate every source the buyer mentioned in intake. Usability is High / Medium / Low / Not yet usable. Be honest about Low and Not-yet — that's the trust line that the public pricing card commits to: "If there is not enough usable data to justify a build, you'll know before spending more."

### Page 3 — Content Gap Map

Table:

| Gap | Why It Matters | Recommended Asset |
|---|---|---|
| No objection-handling content | Sales repeats same answers manually | Sales brief + email sequence |
| No pain-point SEO content | Missing search traffic | Blog cluster |
| Weak follow-up content | Leads go cold | Nurture campaign |

Three to five rows. Tie every gap to a recommended asset type from the public outputs list (SEO blog posts, email campaigns, sales briefs, reports, landing page copy, social content).

### Page 4 — Recommended Workflow

One arrow diagram showing the first workflow worth building. Example:

```
Customer Feedback + CRM Notes
→ Extract recurring pains and objections
→ Generate content angles
→ Produce blog + email + sales brief
→ Human approval
→ Publish/export
```

This is the workflow shape the pilot would build. Match it to the buyer's actual data sources, not a generic template.

### Page 5 — Mini Proof-of-Output

Embed the 2–3 sample assets directly in the report. Label each one clearly: "Sample blog outline generated from your CRM notes," etc. Anonymize any customer names if their data contained them.

### Page 6 — Pilot Build Recommendation

Use this template:

```
Recommended pilot: [Workflow name]
Scope: [N data source(s), [N] outputs, approval workflow]
Price: starts at $7,500
Timeline: 1–2 weeks
Next step: book a pilot scoping call
```

If the data isn't ready for a pilot, write that explicitly here. Recommended language: "Recommended next step: data cleanup phase before pilot. Contact me when [specific source] is in [specific shape]."

## Pilot recommendation — the five questions every audit must answer

Every report should answer these explicitly. Use them as a self-check before delivering.

1. Do they have usable data? (Yes / Partial / Not yet — be specific)
2. What can that data produce? (Map to specific output types)
3. What workflow should be built first? (One workflow, named)
4. What would the first pilot cost? (Pull from the public floor; adjust for actual scope)
5. What sample outputs prove the value? (The proof-of-output assets)

If any answer is vague after the report is drafted, the report isn't done.

## Intake-to-delivery flow

1. **Intake.** Buyer pays $1,500 (Stripe link or invoice) and fills the audit intake form. Required: company URL, primary content goal, list of data sources they can share, sample of one source (1–2 pages of CRM notes / 10–20 reviews / 5–10 support tickets / etc.).
2. **Day 0 — Data scan.** Review the sample. If the data is clearly unusable (PII risk, too sparse, wrong format), email same-day with a 30-min call to discuss before starting the clock.
3. **Day 1 — Opportunity map + proof-of-output.** Bulk of the production work. Templating from a previous audit speeds this up substantially.
4. **Day 2 — Final report + walkthrough.** Compile, deliver Notion or PDF link, optionally schedule a 30-min walkthrough.
5. **Day 2+ — Pilot follow-up.** If the report recommends a pilot, send the pilot scoping call link in the delivery email. Track audit-to-pilot conversion rate per quarter.

## Sales logic

The audit isn't just a deliverable; it's the bridge to the pilot. Every buyer who finishes the audit should leave with one of three clear next steps:

- "You're ready — here's the pilot quote, here's the call link." (Highest-conversion path.)
- "You're close but need [specific data cleanup]. Once that's done, the pilot scope is [X]." (Mid-term conversion; track and re-engage.)
- "You're not ready and a pilot would not produce useful results. Here's what to fix first; I can help if you want." (Disqualified honestly. Builds reputation.)

Avoid soft endings like "let me know what you think." Every report ends with a specific recommended next action.

## Pricing reference

| Tier | Price | Floor or fixed |
|---|---|---|
| Content Ops Audit | $1,500 | Fixed |
| Pilot Build | $7,500 | Floor (most pilots will be $7.5k–$15k) |
| Full Content Ops System | $15,000 | Floor (most full builds will be $25k–$50k) |
| Ongoing Optimization | $2,500/mo | Floor (10–15 hr/mo at $167–250/hr) |

Public-facing pricing lives on `/systems/ai-content-ops`. Update it there if the floors move; this table is a reference for the audit report's pilot recommendation section, not a separate source of truth.
