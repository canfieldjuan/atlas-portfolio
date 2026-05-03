# Podcast Repurposing Landing Page Strategy — Demo-First Productized Offer

Last updated: May 2, 2026.

Internal-only. Captures the conversion logic behind `/podcast-repurposing` so future productized-service pages (YouTube, recruiter brand, real estate, etc.) inherit the same shape unless there is a real reason to deviate.

The page is buyer-facing, but the buyer is an **outcome-preference buyer** — not a B2B systems buyer. The whole approach diverges from the AI Content Ops Station landing because the buyer mental model is different.

## Core principle

The buyer can understand the offer in one sentence:

> "I give you one episode. You give me multiple usable content assets."

The page does not need to educate them for 3,000 words. The demo carries the sale.

## Page shape

Short above-the-fold + strong sample-output demo + modular sections below. Not a long-form VSL.

The first version of any productized-service page should answer only four questions:

1. **What do I give you?** (input)
2. **What do I get back?** (output)
3. **Will it sound/feel like me?** (voice / quality)
4. **How much does it cost?** (pricing)

Everything else is supporting evidence.

## Section order (in priority)

### 1. Above the fold

- **Headline** that names the outcome, not the system. ("Turn one podcast episode into a week of ready-to-post content.")
- **Subhead** that names inputs and outputs concretely. ("Paste your episode link and get newsletters, blog posts, LinkedIn posts, X threads, Shorts scripts — written from the actual episode and matched to your voice.")
- **Primary CTA** that names the action a buyer would describe to a friend. ("Try one episode for $149" or "Repurpose my first episode" — both better than "Get started.")
- **Secondary CTA** that scrolls to the demo, not to pricing. The demo is the sale.

### 2. Sample-outputs demo (the sales engine)

This is the most important block on the page. Place it immediately below the fold.

- Show 2–3 sample episodes / niches. Buyer picks the one closest to their show.
- For each sample, render the full output package as visible artifacts: newsletter, blog post, LinkedIn post, X thread, Shorts script.
- No pipeline visualization. No "stages." No reasoning-layer talk. Just deliverables, side by side, with the source episode at the top so the buyer remembers what went in.
- Demo replaces the "feature list." A buyer who can SEE the deliverables does not need a paragraph describing them.

The demo's job: make the buyer think *"damn, I could use that."*

### 3. Pain section

Short. Two or three paragraphs. Names the recurring failure mode in their language: "You record the episode, post the link once, and the best ideas die there."

Do not over-explain. The pain is obvious to the buyer; the page just needs to say it back to them.

### 4. Deliverables section

Concrete list of what every episode CAN become. Phrasing matters — "can become" lets tier packages flex without overpromising every asset in every tier.

### 5. Voice / quality section

Reframes "quality gates" / "approval queue" / system language into buyer language:

- "Built from the episode, not guessed from a prompt."
- "Your tone, not GPT's."
- "Voice-matched before delivery."

Buyers do not want to hear about the QA pipeline. They want to know it will sound like them.

### 6. How it works

Four steps maximum, in buyer language. No pipeline diagrams.

1. Paste your episode link.
2. We pull out the strongest ideas.
3. You get publish-ready assets.
4. Review, edit, publish.

### 7. Pricing

Lead with the **trial** (low-friction paid sample). Then 2–3 monthly tiers, with the middle tier visually highlighted as "most popular." Do not highlight the most expensive plan — that reads pushy.

For productized-service offers below $1,000/month, simpler is better. **Two monthly tiers + a trial is usually plenty**:

- **Trial** — small one-time fee, single deliverable, no commitment
- **Standard monthly** — main offer, the one most buyers will pick
- **Higher tier** — for buyers who want priority or volume

Adding a third low-end monthly tier ($297-ish) creates decision paralysis without adding revenue. Drop it unless there is a specific market segment it unlocks.

### 8. FAQ

5–7 buyer-blocking questions, not generic ones. Pre-bake the questions that filter out bad-fit leads.

### 9. Final CTA

Mirror the trial offer, not subscription. "Give us one episode" is lower commitment and easier to say yes to.

## Checkout flow

- Read selected plan from the URL (`?plan=trial|standard|higher`). Server-side validate; bogus values fall back to trial.
- Two-step layout: (1) tell us about your show, (2) payment.
- Step 1: 5 fields max — name, email, show name, episode link, optional voice notes.
- Step 2: payment block visually present but stubbed until Stripe wires up. Honest copy: "Card processing is launching soon. We email you a secure payment link within one business day."
- Sticky order-summary sidebar so the plan stays visible through the form scroll.
- Submit posts through the existing `/api/audit` endpoint with the form data mapped to the audit payload shape. No backend changes; payment integration is the only follow-up.

## Central positioning

Use this as the bridge sentence when articulating to anyone WHY the offer exists:

> "Your podcast is not one piece of content. It is the raw material for your entire content engine."

This connects back to the AI Content Ops engine without making the buyer care about the machinery. They are buying leverage on what they already produced, not buying access to a system.

## What NOT to do

- Don't lead with "AI" or "AI Content Ops" in buyer-facing copy. The product name can stay in the eyebrow; the system name belongs internal.
- Don't show the pipeline diagram on this page. It is the wrong mental model for this buyer.
- Don't pad the page with feature comparisons against generic AI writers. Buyers in this segment are comparing to "doing it themselves" or "hiring an agency," not to other AI tools.
- Don't use the audit-pilot-build commercial structure that works for B2B systems buyers. That model presumes the buyer wants diagnostics first. Productized-service buyers want to see the deliverable and pick a tier.

## Reusable for other productized-service pages

The same structure applies to:

- **YouTube content production** (dark / mystery niches, true crime, etc.) — input is a topic or source URL, output is full video package
- **Recruiter / employer brand content** — input is careers page + Glassdoor handle, output is recruiting collateral
- **Real estate listing content** — input is MLS / Zillow URL, output is listing copy + market report + agent newsletter
- **E-commerce product descriptions** — input is product URL, output is improved description + FAQ + comparison content
- **Newsletter operators** — input is RSS feed, output is curated newsletter draft

For each, the four buyer questions stay the same. Only the inputs, outputs, and demo samples change.

## Files

- Marketing page: `web/src/app/podcast-repurposing/page.tsx`
- Demo component: `web/src/components/PodcastDemo.tsx`
- Checkout: `web/src/app/podcast-repurposing/checkout/page.tsx` + `CheckoutForm.tsx`
- Metadata: `web/src/app/podcast-repurposing/layout.tsx`
- This doc: `web/docs/podcast-repurposing-landing-strategy.md`
