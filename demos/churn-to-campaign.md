# Demo: Churn Signal -> Targeted Campaign

This demo shows the core Atlas workflow: a raw review becomes structured churn intelligence, then turns into a personalized outbound campaign and a competitive battle card.

## Why This Demo Matters

- It shows AI working across research, sales enablement, and content instead of as a single prompt.
- It demonstrates evidence-grounded automation rather than generic generation.
- It makes the business value obvious in one pass: detect pain, explain it, and turn it into GTM action.

## Watch the Clip

- GIF preview: [`../recordings/gifs/campaign-review.gif`](../recordings/gifs/campaign-review.gif)
- Full recording: [`../recordings/ui/campaign-review-demo.webm`](../recordings/ui/campaign-review-demo.webm)

## The Flow

1. A raw review is scraped from a public review source.
2. Atlas enriches it with an LLM to extract structured churn fields.
3. Vendor-level churn signals and evidence pools are updated.
4. Atlas generates:
   - a personalized outreach campaign
   - a competitive battle card
   - reusable vendor reasoning for other downstream artifacts

## Open the Demo

- Full narrated walkthrough: [`../pipeline-walkthrough/WALKTHROUGH.md`](../pipeline-walkthrough/WALKTHROUGH.md)
- Raw review input: [`../pipeline-walkthrough/01_raw_review.json`](../pipeline-walkthrough/01_raw_review.json)
- Enriched review: [`../pipeline-walkthrough/02_enriched_review.json`](../pipeline-walkthrough/02_enriched_review.json)
- Churn signal: [`../pipeline-walkthrough/03_churn_signal.json`](../pipeline-walkthrough/03_churn_signal.json)
- Evidence vault: [`../pipeline-walkthrough/04_evidence_vault.json`](../pipeline-walkthrough/04_evidence_vault.json)
- Campaign output: [`../pipeline-walkthrough/05_campaign_output.json`](../pipeline-walkthrough/05_campaign_output.json)
- Battle card: [`../pipeline-walkthrough/06_battle_card.json`](../pipeline-walkthrough/06_battle_card.json)

## What To Notice

- The campaign is tied to specific pain, timing, and competitive context instead of generic outbound copy.
- The same evidence base feeds both the campaign and the battle card.
- Every output is intended to be reviewable, traceable, and reusable across the system.

## Best Screenshots To Add

- `dashboard-overview.png`
- `vendor-detail.png`
- `reviews-enriched.png`
- `campaign-review.png`
- `challengers.png`

See [`../screenshots/CAPTURE_GUIDE.md`](../screenshots/CAPTURE_GUIDE.md) for the exact capture list.
