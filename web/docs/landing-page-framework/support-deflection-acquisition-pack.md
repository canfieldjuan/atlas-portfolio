# Support Deflection Acquisition Pack

> **⚠️ `decisions.md` is canonical.** ICP sweet spot is **15–75 employees** (10–200
> outer band) per D-001 — the Prospect List Rules below are current. The first-ask
> export window is **3–6 months** (D-027), now reflected in the message templates
> below; the fuller outbound sequence lives in
> `SEO-Ticket-Deflection-Template-Docs/outbound-sequence.md`.

Use this pack to run the first 10 free Deflection Snapshot offers from D-019.

The goal is not to sell software in the first message. The goal is to get a real support-ticket CSV from a qualified team, send back a useful snapshot, and learn whether the paid Support Ticket Deflection Report is worth pitching.

## Prospect List Rules

Start with 30-50 accounts, not a broad scrape. List quality beats email volume.

**Company filters:**

- B2B SaaS (primary), or a marketplace / productized / support-heavy software business.
- **15–75 employees (sweet spot); 10–200 outer band** (per D-001).
- Uses Zendesk (or Intercom / Freshdesk / Help Scout) — an exportable support inbox.
- Has a help center / knowledge base (signals they already care about self-service).

**Title filters (the buyer who owns ticket volume):**

- Head / VP / Director of Support
- Head / VP of Customer Experience
- Head of Customer Success (if they own support)
- Founder / CEO (companies under ~30 — the founder is often still in the queue)

**Exclude:**

- Enterprise / Fortune 500 — a $1,500 report is below their procurement threshold; cycle too long.
- Pure high-volume consumer apps (B2C) — different product fit.
- Pre-product or very early — no months of tickets to export yet (no tickets, nothing to find).
- Teams with no visible support volume, or hiring agents for bespoke implementation rather than repeat issues.

## LinkedIn Connection Note

```text
Saw you run support/CS at [company]. I am testing a free
support-ticket analysis: you send the last 3–6 months of closed tickets,
I send back the repeat questions worth deflecting first.

Worth connecting?
```

## First DM After Connection

```text
Thanks for connecting, [first name].

Quick test offer. If you can export the last 3–6 months of closed
support tickets, I will send back a free Deflection Snapshot.

It shows:
- the top repeat question clusters
- the customer wording your help center may not match
- one self-service answer your team can review
- which answer I would ship first

No integration and no sales call required. If the snapshot is useful,
we can talk about the full report. If it is not useful, I will say so.

Worth a CSV?
```

## Cold Email

Subject options:

```text
Repeat support tickets at [company]
```

```text
Free Deflection Snapshot from your support tickets
```

Body:

```text
Hi [first name],

I am looking for 10 support-heavy SaaS teams to run a free Deflection
Snapshot.

The ask is simple: send a CSV export of the last 3–6 months of closed
support tickets. I will send back:

1. Your top repeat ticket patterns.
2. Examples of the words customers use.
3. One self-service answer your team can review.
4. The first answer I would publish or fix.

This is not an integration project. A CSV is enough.

If the pattern is not there, I will tell you. If it is, the paid next
step is a fuller Support Ticket Deflection Report.

Worth sending a CSV?

Juan
```

## Qualification Reply

Use this when someone is interested but asks what you need.

```text
The cleanest export is a CSV of closed tickets from the last 3–6 months.

Minimum useful fields:
- ticket ID
- subject/title
- first customer message or body
- created or closed date

Helpful but optional:
- tags/category
- status
- assignee/team
- resolution notes

You do not need customer names, email addresses, full conversation
history, or API access. If your export tool can strip PII, do that.
If not, send the CSV anyway and I will remove obvious PII before any
model-assisted analysis.
```

## CSV Handoff

Use this when the prospect is ready to send the file directly.

```text
Send the CSV here, or use the upload page:

https://juancanfield.com/systems/support-ticket-deflection/intake

I will check whether the file has enough repeat-ticket signal for a
snapshot. If it does, I will send the Deflection Snapshot within 24
hours. If it does not, I will tell you what export window or fields
would make it useful.
```

## Snapshot Delivery Email

Use this when sending the free snapshot.

```text
Subject: Your Deflection Snapshot for [company]

Hi [first name],

I reviewed the support-ticket CSV.

The repeat-ticket signal is [strong / usable / thin].

The biggest pattern:
[one-sentence summary of the top repeat question cluster]

Why it matters:
[one sentence explaining the support work or customer confusion this
cluster creates]

What I would ship first:
[specific self-service answer title or help-center fix]

I attached the snapshot with:
- the top repeat question clusters
- customer wording examples
- one self-service answer draft
- the first action path

If you want the full report, the next step is the first 3–6 month Support
Ticket Deflection Report. That gives you the top 25-50 clusters, 3-5
self-service answers to review, and the publishing priority list.

Juan
```

## Thin-Signal Reply

Use this when the CSV does not support a useful snapshot.

```text
Hi [first name],

I reviewed the CSV, and I would not send this as a real Deflection
Snapshot yet.

The issue is [too few usable rows / not enough ticket body text / too
many one-off implementation issues / missing date range].

A better export would be:
[specific export request]

If you can send that, I can rerun the snapshot. If not, I would not
recommend paying for the full report from this dataset.

Juan
```

## Paid Follow-Up

Use this only when the snapshot found a real repeat-ticket pattern.

```text
The free snapshot shows enough repeat-ticket signal to justify the
full report.

The paid version is $1,500 for the first 3–6 month batch.

It includes:
- top 25-50 repeat question clusters
- customer wording clusters
- missing or hard-to-find answer list
- 3-5 self-service answers to review and publish
- source ticket IDs and priority notes

The action path is practical: which answers to ship first, what wording
to use, and what to check again next quarter.

Want me to scope the full report from this same export?
```

## Proof Permission Ask

Use this after a useful snapshot or paid report.

```text
One more ask: can I use an anonymized version of this finding as a
public example?

I would not include your company name, raw ticket text, customer names,
email addresses, or screenshots.

The public version would say something like:
"A B2B SaaS support export showed [count/range] repeat tickets around
[problem]. The first recommended self-service answer was [answer
theme]."

Reply yes if anonymized is fine. If you want to approve the exact
wording first, I can send that too.
```

## Claim Boundaries

Safe:

- "I will show the repeat questions worth deflecting first."
- "The snapshot identifies repeat-ticket patterns from your CSV."
- "The sample answer is a draft your team reviews before publishing."
- "If the signal is thin, I will tell you."

Avoid:

- "We will deflect 30% of tickets."
- "This will reduce support cost by X."
- "This is fully automated."
- "This will rank in search."
- "This will prevent churn."
