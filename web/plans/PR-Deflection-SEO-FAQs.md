# Plan: Bake deflection-intent keywords into the page (FAQ content + meta)

Operator wants the wedge to earn organic traffic for the terms it would otherwise
pay for. The mechanism (confirmed earlier): Google ranks on **visible content**, not
the `keywords` meta tag — so the real lever is putting the searched phrases into
on-page copy. The FAQ section renders each question as an `<h3>` *and* feeds the
FAQ JSON-LD (`faq.items: pricingFaqs` → `generateFaqJsonLd(pricingFaqs)`), so new
FAQ entries are the highest-leverage, lowest-risk way to target queries (content +
rich-result schema in one).

## Why this slice exists

- High-intent deflection queries (how to reduce support tickets, knowledge base
  failing, self-service failure rate, chatbot/AI-agent resolution rate) aren't
  addressed as on-page content. Adding them as real FAQ Q&A captures the intent and
  reinforces the product thesis.

## Scope (this PR)

Slice phase: Product polish

Used only the **deflection-fitting subset** of the operator's ad keywords (the ad
export was dominated by FAQ-schema-generator + customer-service-automation terms
that belong to a different page/buyer — deliberately excluded to avoid diluting the
page and re-introducing the automation/AI framing #116 just removed).

1. **4 new FAQ entries** (`pricingFaqs` in `landingConfig.tsx`) — real prospect
   questions phrased in the searchers' words:
   - "How do you reduce repeat support tickets?" → *how to reduce support tickets, reduce repeat tickets*
   - "Will this help if our knowledge base is not working?" → *knowledge base not working / failing*
   - "Why is our self-service resolution rate so low?" → *self-service failure rate* (ties to the Gartner 73/14)
   - "How is this different from a chatbot or AI agent?" → *chatbot / AI agent resolution rate* (handled on-brand: deterministic, not a bot)
2. **Meta keywords** (`layout.tsx`) — added 11 deflection/knowledge-gap terms for the
   ad-planning inventory (`keyword-inventory.md` source of truth). Held the
   chatbot/AI-agent terms OUT of the meta tag (re-adding "AI" terms invites the
   review flag #116 fixed, and the tag doesn't affect organic anyway — FAQ #4 carries
   that intent).

### Files touched

- `web/plans/PR-Deflection-SEO-FAQs.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — 4 new `pricingFaqs` entries
- `web/src/app/systems/support-ticket-deflection/layout.tsx` — 11 deflection meta keywords

## Mechanism

- Copy-only. New FAQ entries render as `<h3>` questions in the FAQ section AND extend
  the existing FAQ JSON-LD (eligible for Google's FAQ rich result). No component change.
- Meta keywords feed the ad-planning inventory; they do **not** affect Google ranking
  (documented expectation), so they're not the organic lever — the FAQ content is.

## Intentional

- **Fact, not guarantee** (claims doctrine [[claims-doctrine-fact-not-guarantee]]):
  FAQ answers assert sourced facts (Gartner 73/14), the deterministic mechanism, and
  "find the answer instead of opening a ticket" (possibility, not a % promise).
- **No-AI consistency** preserved: the chatbot FAQ states "100% deterministic … no AI
  talks to your customers," consistent with the body/intake/`<head>` from #116.
- **Title untouched** — "software"/"tools" would misdescribe a done-for-you report
  (the page says "not a platform"); those ride in meta only.
- **Excluded ~75% of the ad keywords** (FAQ-schema-generator + automation-software +
  the `rockwell software downloads` junk) as off-page-intent; flagged the ad-campaign
  mismatch to the operator separately.

## Deferred

- Re-clustering / pruning the ad campaign (one ad group of 40 mixed-intent terms) and
  the FAQ-generator cluster's true home — operator-side, not this PR.

Parked hardening: none.

## Verification

- `tsc --noEmit` / `npm run lint` clean; `npm run build` green.
- FAQ renders 15 entries; JSON-LD includes the 4 new Q&A; no new AI/guarantee claims.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  3 == 3 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| 4 FAQ entries | ~16 |
| 11 meta keywords | ~11 |
| this plan doc | ~75 |
| **Total** | ~102 |

Well under the 400-LOC soft cap.
