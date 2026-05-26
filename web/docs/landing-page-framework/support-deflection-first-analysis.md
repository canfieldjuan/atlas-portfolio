# Support Deflection First-Analysis Playbook

This playbook is the operating contract behind the Support Ticket Deflection Report landing page. It defines how the first free Deflection Snapshots are delivered before the workflow is fully productized.

Outbound, delivery, paid follow-up, and proof-permission copy lives in `docs/landing-page-framework/support-deflection-acquisition-pack.md`.

## Goal

Use 10 free Deflection Snapshots to create the first 5 serious customer conversations for the paid Support Ticket Deflection Report.

The snapshot is not a generic audit. It is a small proof artifact built from the buyer's own support tickets:

1. Which repeat questions are showing up most often.
2. How customers actually phrase those questions.
3. Which questions look deflectable with clearer self-service.
4. One sample self-service answer the team can review.
5. The first concrete action path.

## Target Buyer

Primary buyer:

- Head of Support, CS lead, founder, or operator responsible for support cost.
- Feels repeat-ticket volume as a staffing, response-time, or customer-experience problem.
- Has access to a ticket export without needing a long procurement process.

Good-fit account:

- B2B SaaS, marketplace, productized service, or support-heavy software-enabled business.
- Has at least a few hundred closed tickets in the last 3–6 months.
- Has closer to 2,000+ closed tickets if they want the full paid report to rank 25-50 repeat question clusters honestly.
- Uses Zendesk, Intercom, Freshdesk, HelpScout, or a support inbox that exports CSV.
- Has a help center, saved replies, onboarding docs, or product docs that are not keeping up.

Weak-fit account:

- Too little support volume to show repeat patterns.
- Mostly one-off implementation tickets.
- Highly regulated data that cannot be exported safely without a security review.
- Buyer wants a guaranteed deflection percentage before publishing anything.

## First Ask

The first ask is:

> Send us a CSV of your last 3–6 months of closed support tickets. We will send back a free Deflection Snapshot showing the repeat questions worth deflecting first.

Do not lead with software, platform, AI model, or automation. Lead with the concrete artifact.

## Minimum CSV Shape

Required:

- Ticket ID or stable row ID.
- Subject or title.
- Body, description, or first customer message.
- Created date or closed date.

Helpful:

- Tags.
- Category.
- Assignee or team.
- Status.
- Resolution notes.
- Customer segment.

Not required:

- Customer names.
- Email addresses.
- Full conversation history.
- Zendesk API access.

If the export includes PII, remove obvious names, emails, phone numbers, addresses, and account numbers before model-assisted analysis. If removal cannot be completed confidently, keep the analysis manual and quote only paraphrased patterns back to the customer.

## Manual Workflow For First 3 Snapshots

1. Confirm scope.
   - Last 3–6 months of closed tickets.
   - One product or support queue when possible.
   - Snapshot only, not the full paid report.

2. Normalize the CSV.
   - Keep only useful text and metadata fields.
   - Remove empty rows, bot/system rows, and obvious duplicates.
   - Strip obvious PII before using model-assisted clustering.

3. Cluster repeat questions.
   - Group rows by customer intent, not by internal tag.
   - Preserve customer wording examples.
   - Keep source ticket IDs for traceability.

4. Rank the opportunities.
   - Sort by repeat volume first.
   - Flag urgency when the tickets mention billing, access, cancellation, onboarding blockage, or product confusion.
   - Do not turn volume into ROI unless the customer provides support-cost assumptions.

5. Draft one sample self-service answer.
   - Use the customer's wording in the title.
   - Keep the answer plain and operational.
   - Mark any product-specific step that needs customer review.

6. Human review.
   - Confirm the cluster labels match the ticket evidence.
   - Confirm no sensitive ticket text leaks into the snapshot.
   - Confirm the sample answer does not invent product behavior.
   - Confirm the action path is concrete.

7. Send the snapshot.
   - Lead with the top repeat questions.
   - Show 2-3 customer-language examples.
   - Include one sample self-service answer.
   - End with the paid-report path if the pattern is strong.

## Snapshot Output Contract

The free snapshot should include:

- Top 5-10 repeat question clusters.
- Count or count range for each cluster.
- Customer wording examples, paraphrased when needed.
- Deflection opportunity note for the strongest clusters.
- One sample self-service answer.
- Recommended next action.

The free snapshot should not include:

- A full help-center rewrite.
- 25-50 ranked questions.
- 3-5 drafted answers.
- Deflection percentage guarantees.
- SEO, GEO, or AEO guarantees.
- Raw customer ticket excerpts without permission.

## Paid Follow-Up Path

If the snapshot shows a real repeat-ticket pattern, the paid next step is the Full Deflection Report.

Paid report scope:

- Top 25-50 repeat question clusters.
- Customer wording clusters.
- Missing or hard-to-find answer list.
- 3-5 self-service answers to review and publish.
- Priority notes and source ticket IDs.
- "Ship these first" action path.

Quarterly refresh scope:

- What changed since the last report.
- Which repeat questions are still reaching support.
- New self-service answers to review.
- Recommended next publishing sequence.

## Claim Boundaries

Safe claims:

- We identify repeat support-ticket patterns.
- We rank deflection opportunities by visible ticket evidence.
- We draft self-service answers your team can review and publish.
- We use customer wording from your tickets to reduce language mismatch.

Avoid:

- Guaranteed ticket deflection.
- Guaranteed cost reduction.
- Guaranteed SEO, GEO, AEO, or ranking outcomes.
- "Fully automated" delivery language.
- Claims that publishing one answer will prevent churn.

## Proof Collection

For each snapshot, record:

- Account type and support platform.
- Ticket window and row count.
- Number of usable rows after cleanup.
- Number of repeat clusters found.
- Top cluster count or count range.
- Whether the customer asked for the full report.
- Whether any answer was published.
- Whether permission was granted to use anonymized or named proof.

Proof can become public only after permission is explicit. Until then, use anonymized internal notes to improve the offer and workflow.

## Productization Trigger

Do not productize the whole workflow at once.

Automate a step when all of these are true:

- The step repeated across at least 3 customer CSVs.
- The input shape was stable enough to validate.
- The review criteria were clear.
- Automation would reduce time without hiding judgment.

Good first automation candidates:

- CSV field normalization.
- PII redaction preflight.
- Repeat-cluster draft generation.
- Report row formatting.

Bad first automation candidates:

- ROI calculation without customer cost inputs.
- Final answer approval.
- Publishing to a customer's help center.
- Broad multi-output generation before the first report shape stabilizes.
