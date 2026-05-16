# Voice Reference

A working reference for writing in our chosen voice (per `decisions.md` D-002 / D-003 / D-004 / D-022). Use this when drafting hero copy, body sections, cold DMs, demo narration, email replies — anywhere our writing has to *sound like us*.

Living document. When a new pattern proves out in production, add it here. When a pattern stops working, mark it deprecated and explain why.

---

## 1. Voice signature (from D-002)

**Plain-spoken specific.** Warm dial (D-004). One voice across all brands (D-003). Proof bank varies per audience but voice doesn't.

The nine operating principles (re-stated for reference; canonical source is D-002):

1. **First-person, direct.** "I built this because…" not "Atlas LLM Gateway is a hosted gateway that…"
2. **Short sentences.** Longer ones reserved for proof points where compression hurts.
3. **Specific always.** Numbers, names, dollar amounts, time windows. Never "fast" — always "in under 90 seconds." Never "many customers" — "the 14 we've shipped to."
4. **Name the buyer's situation before pitching.** "If your team has 3 tabs of customer call notes open right now and is supposed to write a blog post about them by Friday, this page is for you."
5. **Show the mechanism transparently.** Not "AI magic" — "here are the 4 things that have to happen and how we do each one."
6. **Name what we don't do.** "This won't write Twitter threads. It won't replace a copywriter. It won't work if your sources are PDFs of handwritten notes."
7. **Price-transparent always.**
8. **Zero exclamation points. Zero "limited time" theater. Zero "imagine if..."**
9. **Conversational without being chummy.** Doesn't say "hey friend" — says "you'd probably want to know..."

**One-line summary:** Specific facts, transparent mechanism, no hype, named what-we-don't-do, conversational warmth — written for a sophisticated buyer who's already shopping for a solution.

---

## 2. Reference writers — what each contributes

We don't imitate any one writer. We blend their layers. Tight trio — no others belong here unless we have a real reason to add them.

| Writer | Layer | One-line essence |
|---|---|---|
| **Gary Bencivenga** | Sentence-level voice | Situational openings, warm asides, plain-language specificity. Reads like a smart friend who happens to be a copywriter. |
| **David Ogilvy** | Headline craft + research discipline | Specific, surprising, factual. "At 60 miles an hour the loudest noise in this new Rolls-Royce comes from the electric clock." Anti-hyperbole religion. |
| **Patrick McKenzie (patio11)** | B2B technical specificity | Math-first, procurement-aware, "here's exactly what's in the box and here's exactly what we won't do." Talks to operators like they're operators. |

**Explicitly NOT in the voice trio:**

- **Alex Hormozi** — useful for D-015 (offer structure: value equation, risk reversal, godfather offers) but his sentence-level voice is loud-DR / godfather-offer rhetoric. Per D-001, our buyer reads that register as snake-oil. Pull his offer-mechanics thinking when working on D-015; do not pull his voice for any landing-page sentence.
- **Russell Brunson** — wrong buyer state. Sells info products via long-form sales letters.
- **Modern startup "Why X is broken" voice** — what we're moving away from. Reads as model-generated polish.

---

## 3. Curated examples — annotated

Each example is a real paragraph from one of our reference writers, with margin notes calling out the specific moves. Build the library here as we find more.

### Example 3.1 — Bencivenga, "Marketing Maxims" e-letter pitch

> For example, imagine this…
> Your deadline looms as you stare at a blank screen. You must write an email so engaging that it immediately persuades legions of strangers to stop what they're doing, read your message, take out their credit cards and buy.
>
> But with everyone's inbox overflowing with hyped-up, unwanted messages, you can't conceive of anything that will break through the clutter, engage and persuade.
>
> No worries! Sign up for my free e-letter, Marketing Maxims, and I'll tell you precisely how to begin—and succeed!

**Structural breakdown (6 beats):**

| Beat | Bencivenga | Why it works |
|---|---|---|
| 1. Vivid scenario | "Your deadline looms as you stare at a blank screen" | Reader sees themselves *in a specific moment* — not "if you struggle with email" |
| 2. High-stakes outcome | "Persuade legions of strangers to take out their credit cards" | Named, specific outcome — not "succeed at email marketing" |
| 3. The wall | "Everyone's inbox overflowing… you can't conceive" | Acknowledges a fact the reader already knows; builds shared reality |
| 4. The promise | "Sign up for Marketing Maxims and I'll tell you precisely how" | Direct offer, not buried |
| 5. Specificity hook | "How to begin—and succeed!" | Concrete promise (but vague enough — this is the curiosity-gap part we DON'T use) |
| 6. Casual proof | "No worries!" | Warm aside, contrast to heavy pain in beats 1-3 |

**What we take from this:**
- The sensory opening ("deadline looms as you stare")
- Acknowledging known facts ("inbox overflowing")
- Casual warmth interjected into heavy pain ("No worries!")
- Direct second-person voice
- Named stakes in the reader's words

**What we don't take:**
- The curiosity-gap close ("I'll tell you precisely how" — vague reveal). Our buyer reads this as clickbait.
- The sign-up-for-free-thing funnel — we sell software, not info products.

### Example 3.2 — Ogilvy, Rolls-Royce headline (1958)

> "At 60 miles an hour the loudest noise in this new Rolls-Royce comes from the electric clock."

**Why it works:**

- **Specific number** (60 mph)
- **Surprising angle** — it's a luxury car ad that's actually about *quietness*, not status
- **Zero hyperbole** — no "the world's most luxurious vehicle"
- **Concrete detail** (electric clock) you can picture
- **The product does the bragging** — Ogilvy doesn't say "incredibly quiet"; he gives you a detail that *demonstrates* incredibly quiet
- **No exclamation point. No urgency. Just the fact.**

**What we take:**
- The pattern: **specific number + surprising angle + concrete detail = a hero line that doesn't sound like marketing**
- The discipline of letting facts do the persuading. If your product has a real fact like the Rolls-Royce electric clock, ship that fact, not a claim about it.

**Translation to our product:**

> Hero candidate in this register:
> "Last week we generated 47 publish-ready FAQ entries from a B2B SaaS company's last 90 days of support tickets. They shipped 10 to their help center on Monday. Ticket volume on those 10 questions dropped 31% by Friday."

That's the Rolls-Royce structure: specific number (47, 10, 31%), concrete detail (ticket volume), surprising claim (ticket volume drops fast when you ship the right docs), no hype.

### Example 3.3 — Ogilvy body copy pattern (Rolls-Royce ad body, abbreviated)

The Rolls-Royce ad body that followed the headline used **18 numbered, specific reasons** the car was the best. Things like "the radiator is hand-polished for 5 hours" and "every Rolls-Royce engine is run for seven hours at full throttle before installation."

**What we take:**

- **The numbered-fact body** is a reusable B2B pattern. Replace "luxury features" with "what the product actually does":
  - "Here are the 12 things our pipeline does to your support tickets"
  - "Here are the 8 reasons our reports rank for SEO when most AI-generated content doesn't"

Specific, factual, scannable, hyperbole-free. Lets the product carry the persuasion.

---

## 4. What translates to our buyer / what doesn't

(Mirror of the analysis from our brainstorm session)

### Translates

| Pattern | Why it works for actively-seeking SMB AI buyers |
|---|---|
| Vivid sensory opening | They recognize themselves in 5 seconds (D-022 Beat 1) |
| Acknowledged known facts/stats | Builds trust through shared reality |
| Casual warmth interjected | D-004 warm dial |
| Direct second-person | D-002 #1 |
| Numbered, factual body copy | D-002 #3 specificity, D-002 #5 transparent mechanism |
| Specific surprising detail (Ogilvy electric clock) | D-022 Beat 2 unknown hook |
| Anti-hyperbole religion | D-002 #8 — no exclamation points / urgency theater |

### Doesn't translate

| Pattern | Why it fails for our buyer |
|---|---|
| Curiosity gap reveals ("the secret 12-word sentence") | D-010 sophisticated buyer reads as clickbait |
| Sign-up-for-free-e-letter funnels | Wrong product type (we sell software, not info products) |
| Vague specificity-promises ("I'll tell you precisely how") | D-002 #3 — we have to BE specific, not promise it later |
| Aspirational stakes ("lifelong financial independence") | Our buyer's stakes are operational, not life-altering |
| Hormozi-style loud DR ("you'd be insane not to") | D-001 buyer reads as snake-oil |
| Brunson hook-story-offer narrative | Buyer doesn't read 4000 words cold |

---

## 5. Pattern templates

### 5.1 The 5-beat hero (extracted from Bencivenga, adapted via D-022)

Bencivenga's 6-beat structure rewired to fit our buyer state (D-010 solution-aware) and framing (D-022 known→unknown):

| Beat | Function | Example for AI Content Ops |
|---|---|---|
| **1. Vivid scenario (KNOWN problem)** | Reader recognizes themselves in 5 seconds | "You have 30,000 closed support tickets in Zendesk and 12 help docs." |
| **2. Pain crystallized** | Make the situation viscerally specific | "Your team answers the same 50 questions every week. You know your help center should be bigger. You don't have the time." |
| **3. Unknown hook (differentiation)** | Name something they didn't realize was related — separates us from competitors targeting same known pain | "Here's what most teams miss — your tickets are a ranked priority list of which help docs to build first, in your customers' own words." |
| **4. Mechanism transparently** | Show how it works, not just what it does | "Upload a CSV. We cluster questions by intent, rank by ticket volume, extract customer language, generate FAQ entries with source ticket IDs. 48 hours to first report." |
| **5. Specific proof or named outcome** | Concrete number from a real customer | "Last customer: 12,400 tickets → 47 publish-ready FAQs → 10 deflectable in week one." |

**Note the swap from Bencivenga:** he ends with curiosity ("sign up for the secret"). We end with **proof** (a real customer number). Same energy, sophisticated-buyer-appropriate.

### 5.2 The Ogilvy-style headline formula

`[specific number]` + `[surprising angle]` + `[concrete detail you can picture]` = headline that doesn't sound like marketing.

Examples:
- Ogilvy original: "At **60 miles an hour** the **loudest noise** in this new Rolls-Royce **comes from the electric clock**."
- Our adaptation: "We turn **30,000 closed support tickets** into **50 ranked help docs** in **48 hours**."

### 5.3 The numbered-fact body pattern (Ogilvy)

Replace "value props" with **a numbered list of specific operational facts about the product.** No adjectives. Just facts.

Skeleton:
```
Here are the [N] things our system does to your [data type]:
1. [Specific operation 1 — concrete verb + concrete object]
2. [Specific operation 2]
...
N. [Specific operation N]
```

Versus the polished-tech-vendor anti-pattern:
> ✗ "Our AI-powered platform leverages cutting-edge natural language processing to surface key insights from your customer data."

The Ogilvy version:
> ✓ "We cluster your tickets by intent. Rank them by ticket volume. Extract the customer's exact wording. Identify which questions have no documentation. Generate FAQ entries citing the source ticket IDs. Deliver as PDF + interactive web view in 48 hours."

---

## 6. Our voice in action

Drafts produced using this reference. These become the gold standard for future copy.

### 6.1 AI Content Ops Station — hero (first draft)

```
You have 30,000 closed support tickets in Zendesk and 12 help docs.

Your team answers the same 50 questions every week. You know your
help center should be bigger. You don't have the time.

Here's what most teams miss — your tickets aren't just unanswered
questions. They're a ranked priority list of which help docs to
build first, written in your customers' own words. Most help
centers fail SEO because they're written by your team, not from
real customer questions. Yours could be different.

Upload a CSV of your last 90 days of tickets. We cluster questions
by intent, rank by volume, extract customer language, generate FAQ
entries with source ticket IDs. 48 hours to first report. No
integration required.

Last customer: 12,400 tickets → 47 publish-ready FAQs → 10
deflectable in week one.

[ Send us your CSV — first analysis free ]
```

**Annotation:**
- Lines 1-2: Beat 1 — vivid scenario (KNOWN problem). Specific numbers (30k, 12).
- Line 3-4: Beat 2 — pain crystallized in their own words.
- Lines 5-9: Beat 3 — unknown hook (their tickets ARE a priority list, written by their customers).
- Lines 10-13: Beat 4 — mechanism transparent. Four operations named explicitly.
- Lines 14-15: Beat 5 — specific proof from a real customer.
- CTA: matches D-019 outbound offer (free CSV analysis), no aspirational language.

**Move-by-move:**
- Zero exclamation points (D-002 #8 ✓)
- Specific always (D-002 #3 ✓ — 30k, 12, 50, 90, 48, 12,400, 47, 10)
- Mechanism transparent (D-002 #5 ✓ — "cluster… rank… extract… generate")
- Names what we don't do (D-002 #6 — implicit in "No integration required" and the specific scope)
- First-person ("we cluster… we deliver") — D-002 #1 ✓
- Conversational not chummy (D-002 #9 ✓ — "You know your help center should be bigger. You don't have the time." is direct, not pally)

### 6.2 Cold LinkedIn DM (first draft, for D-019)

```
Hey [first name] —

Quick test offer. I'm building a tool that turns Zendesk ticket
exports into ranked help-doc gaps. Free analysis: send a CSV of
your last 90 days of tickets, I send back a report in 48 hours
with the 10 highest-volume customer questions you have no
documentation for, plus 3 publish-ready FAQ drafts.

No sales call required. If the report's useful, we talk. If not,
no follow-up.

Worth a CSV?

— Juan
```

**Annotation:**
- Opens with "Hey [name]" — warm but not chummy (D-004 / D-002 #9)
- "Quick test offer" — sets expectation, no buildup
- Names the offer specifically in 3 lines (mechanism + deliverable + timing)
- "No sales call required" — names what it isn't (D-002 #6)
- "If the report's useful, we talk. If not, no follow-up." — risk reversal in 9 words (Hormozi offer-structure, voice still ours)
- "Worth a CSV?" — direct ask, no "I'd love to chat" filler

---

## 7. Anti-patterns

Sentences we explicitly reject. When a draft starts drifting toward any of these, pull it back.

### 7.1 Polished tech vendor

> ✗ "Our AI-powered platform leverages cutting-edge natural language processing to surface key insights from your customer data."

Why we reject: zero specifics, jargon-heavy, every AI tool sounds identical. This is what we're moving AWAY from.

### 7.2 Curiosity-gap clickbait

> ✗ "The one thing your support data is hiding from you (and 3 ways to fix it)."

Why we reject: D-010 sophisticated buyer reads as clickbait. Just name the thing.

### 7.3 Generic claims without proof

> ✗ "Trusted by leading B2B companies."

Why we reject: every site says this. Either name the customers or don't make the claim.

### 7.4 Exclamation points / urgency theater

> ✗ "Transform your support team in just 48 hours!"
> ✗ "Limited time — first 10 customers get 50% off!"

Why we reject: D-002 #8 — operators read these as low-trust signals.

### 7.5 Aspirational stakes vs operational stakes

> ✗ "Build a customer support function your team will love."

Why we reject: vague aspirational language. Replace with operational: "Cut ticket volume on your top 10 questions by ~30% within 30 days of publishing."

### 7.6 "Imagine if" hypotheticals

> ✗ "Imagine if you could ship 50 help docs a quarter without writing a single one."

Why we reject: D-002 #8 — hypotheticals signal we don't have proof. Replace with the actual customer example.

### 7.7 First-person plural that sounds corporate

> ✗ "We empower teams to deliver exceptional customer experiences."

Why we reject: empty. "We" should be doing concrete things ("We cluster your tickets, rank them, generate FAQ entries"). Not "empowering" or "enabling" or "transforming."

---

## How to use this doc

- Before writing any copy: re-read sections 1, 5, and 7. They cover voice, structure, and what to avoid.
- When drafting: write a draft, then audit it against sections 4 (translates/doesn't) and 7 (anti-patterns). Each sentence should pass.
- When stuck: pull a structural template from section 5, or imitate the closest annotated example from section 3.
- When you find a new pattern that works: add an example to section 3, a template to section 5, or an anti-pattern to section 7. Date the addition.
- The voice signature in section 1 is canonical and doesn't change without updating D-002.
