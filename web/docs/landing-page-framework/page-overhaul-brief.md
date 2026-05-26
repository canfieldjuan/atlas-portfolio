# Page Overhaul Brief — Support Ticket Deflection landing page

**Purpose:** onboard a second working session to help overhaul the wedge
landing page's **structure, copy, and benefit architecture**. The page is built
and internally consistent (13 PRs, #78–#90, all merged) — this is the
"now make it actually persuasive" pass. Read this top-to-bottom; it points to
the deep docs for detail.

---

## 1. What this is

**Product:** "Support Ticket Deflection" — a productized service on the
**atlas-portfolio** marketing site (Juan Canfield / juancanfield.com). It's the
current **wedge** of a larger "Content Ops" family (the old "FAQ Report" was
retired/rebranded into this; `/systems/ai-content-ops` is the parent hub).

**The offer (the funnel):**
1. **Free "Deflection Snapshot"** — buyer uploads a CSV export of **3–6 months**
   of closed support tickets; we send back (within 24h) the top repeat questions,
   customer wording examples, and one sample step-by-step self-service answer.
2. **Paid "Full Deflection Report" — $1,500** (or **$1,000** for the first-5
   "design partners" on the gated `/partner` URL). Contents: top **25–50** repeat
   question clusters, customer wording clusters, the missing/hard-to-find answer
   list, **3–5 step-by-step self-service answers** to review & publish, priority
   notes, and source ticket IDs.
3. **Quarterly Refresh** — $1,500/quarter (optional follow-up).

**ICP:** 15–75-employee B2B SaaS (sweet spot); 10–200 outer prospecting band.

**The angle:** **cost / repeat-answering** ("stop paying your team to answer the
same questions"). Deliberately **NOT** a Google/SEO-ranking pitch — that angle is
quarantined as a *separate future offer* (decision **D-028**). The mechanism is
**language mismatch**: customers search "how do I cancel," the help center says
"account lifecycle changes," so the answer exists but is invisible; we surface
the questions in the *customer's own words*.

---

## 2. Claims discipline (hard constraints — do not cross)

The page must stay defensible. **Never claim:** a guaranteed deflection %,
guaranteed cost reduction, guaranteed SEO/Google/ranking outcomes, "fully
automated," auto-publishing, or fabricated client results/stats. **Safe:**
"identify repeat-ticket patterns," "rank by volume," "draft answers in your
customers' own words," "your team reviews and publishes" (no auto-publish),
"the first analysis is free." The full list is in `AGENTS.md` (do-not-claim) and
`support-deflection-acquisition-pack.md` → Claim Boundaries. The reviewer
enforces this hard.

---

## 3. How the page is built (anatomy)

**Config-driven template.** The wedge page is a thin wrapper:

- `web/src/app/systems/support-ticket-deflection/page.tsx` — 8-line wrapper.
- `web/src/app/systems/support-ticket-deflection/landingConfig.tsx` — **the
  shared config object** (all copy + the inline artifact components). **This is
  where ~all the copy lives.**
- `web/src/components/landing/DiagnosticReportLandingPage.tsx` — the template
  that renders the config. Adding a *new kind of section* means a typed slot
  here; copy/data changes are config-only.
- `/partner` (`partner/page.tsx`) imports the same `landingConfig` and overrides
  **only** pricing ($1,000) — so any copy edit propagates to both. Don't
  duplicate; edit the shared config.

**Section order (the template slots), top to bottom:**
`hero → problem (the "Picture") → solution (3-step "how it works") → comparison
(language-mismatch table) → sample (the on-page demo artifact) → deliverables
(what's in the report) → audience (who it's for) → pricing → finalCta (the
"Push") → faq → footerCta`.

**The on-page "demo"/artifact elements (where we're starting):**
- `DeflectionReportHeroArtifact` (in `landingConfig.tsx`) — the hero's
  "24-hour snapshot preview" card: stat chips (`3–6 months` / `Top 25` /
  `5 answers`), a "repeat questions found" list (`heroReportRows`: e.g. "Billing
  confusion · 41 tickets · 'why was I charged twice?'"), and one sample answer.
- `HelpCenterComparison` (`comparison` section) — the language-mismatch table
  (`comparisonRows`): customer phrase vs traditional help-center label vs the
  bridge answer.
- `DeflectionReportSample` (`sample` section) — the big demo built from a
  **public CFPB complaint dataset** (`sampleRankedQuestions`, `sampleFaqExamples`,
  `demoScaleStats` = 1.28M rows / 383k narratives / 1,000 validated / 46 shown).

**Sibling routes** (`web/src/app/systems/support-ticket-deflection/`):
`/demo` (standalone interactive "Clarify" demo, GLM-themed→re-themed),
`/calculator` (Support Tax Calculator), `/playbook` (10 question→rewrite
examples), `/intake` (CSV upload form), `/partner` ($1,000 gated, noindex).

---

## 4. What the product *actually* ships (so cards/claims match reality)

This matters because the demo cards currently show illustrative data that may
**overstate or misstate** what we deliver. Sources of truth:

- **The Full Report deliverable** = top 25–50 repeat question clusters + customer
  wording clusters + missing-answer list + **3–5** step-by-step self-service
  answers + priority notes + source ticket IDs. (The free Snapshot = top 5–10 +
  wording examples + **1** sample answer.)
- **The live search backend contract** (Atlas `faq-deflection-search`, wired but
  env-gated): returns `{ query, results[], count }`; each result =
  `{ faq_id, topic, question, answer_summary, source_ids, ticket_count, score,
  rank, status }`. `score` = text-relevance (`ts_rank_cd`), **not** an
  opportunity/cost score and **not** a 0–100. No deflection %, no cost ranking.
- **Ranking is by volume** (`ticket_count`), never by cost (we don't collect
  handle-time/cost data).

When fixing the demo cards: the labels + numbers should reflect *these* (e.g.
"25–50 clusters," "3–5 answers," volume-ranked) — not invented metrics.

---

## 5. What's been done this session (13 PRs, all merged → main)

| PR | What |
|---|---|
| #78 | Hero copy (A1 headline) + swept the first-ask window to "3–6 months" |
| #79 | Process guard: a "grep-the-old-value repo-wide" step in `AGENTS.md` §1a |
| #80 | Mechanism: 6-stage pipeline → **3 steps** (D-029) |
| #81 | Push/final-CTA copy + **removed all cost-ranking** language |
| #82 | Who-it's-for → **15–75 ICP** (+ `FREE · NO CARD` pricing badge) |
| #83 | FAQ 8 → 11 questions (feeds FAQ JSON-LD) |
| #84 | Extracted the shared `landingConfig` (no-op refactor, enables `/partner`) |
| #85 | `/partner` page ($1,000, first-5, noindex) |
| #86 | Swept "90 days" → "3–6 months" across the deflection surface |
| #87 | Retired the orphaned `ai-content-ops/intake` (308 → deflection intake) |
| #88 | **Direct-to-blob CSV upload** (no 4 MB cap) — *verify on the deploy* |
| #89 | Acq-pack templates → 3–6 months; hero "self-serve" → "self-service" |
| #90 | Swept the same stragglers in the internal `web/docs` source docs |

**Current state:** the live page is internally consistent — cost angle (not
Google), no cost-ranking, 15–75 ICP, 3–6-month window everywhere, an 11-question
FAQ, a gated `/partner` twin. **What it is NOT yet:** sharp, benefit-led, or
hooky (see §6). This was the "make it correct + consistent" pass; the next pass
is "make it persuasive."

**One open verification (owner: operator):** #88's live upload→record round-trip
couldn't be tested locally — verify a real CSV upload on the Vercel deploy before
relying on it. Then two small follow-ups: remove the old `/api/gap-report-intake`
POST (kept one cycle as fallback) and rate-limit the open upload endpoints
(`HARDENING.md` `DEFLECTION-INTAKE-RATELIMIT-1`).

---

## 6. The problems to fix next (operator's brief — this overhaul's scope)

The current page is a solid *first draft* that's correct but not yet persuasive.
Known problems, in the operator's words:

1. **Copy isn't focused.** A lot of it is loose / not earning its place. Tighten
   to one idea per beat.
2. **Benefit-architecture gap.** We barely state benefits, and where we do we
   don't *frame* them as benefits. Need a real benefit ladder.
3. **Unsurfaced "extras."** The product gives more than we say. Flagship example:
   we extract **the exact language customers use** — which is *also* the keyword
   set those FAQs would need to rank — but we don't surface that value. (Frame it
   as "you get your customers' real words," **not** "we'll rank you" — stay inside
   the no-guaranteed-ranking rule, D-028.) Hunt for more of these.
4. **Headline doesn't hook.** The current hero headline doesn't make a reader
   think "I should keep reading." Needs a stronger promise/hook.
5. **Demo cards are wrong.** The cards/artifacts have **incorrect labels** and
   **data that doesn't match what we can actually ship** (see §4). This is the
   **starting point** — fix the on-page demos first (hero artifact, comparison,
   sample), then work outward to the benefit architecture + headline + copy focus.

**Start here:** the **demos/artifacts on the landing page** (§3's three elements),
aligning their labels + data to §4 (what we really ship), then move into benefit
framing + headline + copy tightening.

---

## 7. Guardrails & how we work (so the second session matches the rhythm)

- **Decisions canon:** `web/docs/landing-page-framework/decisions.md` (D-001…D-029
  — ICP, window, pricing, mechanism, the Google-angle quarantine). If copy and a
  decision disagree, the decision wins (or we change the decision deliberately).
- **Voice:** `web/docs/landing-page-framework/voice-reference.md` (plain-spoken,
  specific, zero exclamation/urgency; Promise·Picture·Proof·Push framework, D-026).
- **PR discipline (`AGENTS.md`):** every change ships as a small slice with a
  `web/plans/PR-<name>.md` plan doc (Why / Scope+Slice-phase / Files-touched /
  Mechanism / Intentional / Deferred / Verification / Diff-size); a mechanical
  gate (`scripts/pre_push_audit.sh`) checks plan↔diff alignment. Branch
  `claude/pr-<slice>`; squash-merge.
- **§1a "grep the old value, repo-wide":** when a recurring value changes
  (number, label, route, term), grep the **whole repo** (`web/src` *and*
  `web/docs`), not just the file — and fix or explicitly track every instance.
  (This was the session's most-repeated miss; it's now a written rule.)
- **Verify with tool output**, not prose; keep claims defensible.

---

## 8. Pointers

- **Page copy:** `web/src/app/systems/support-ticket-deflection/landingConfig.tsx`
- **Template:** `web/src/components/landing/DiagnosticReportLandingPage.tsx`
- **Decisions / voice / claims:** `web/docs/landing-page-framework/`
  (`decisions.md`, `voice-reference.md`, `support-deflection-acquisition-pack.md`,
  `ticket-deflection-funnel-brief.md`, `support-deflection-first-analysis.md`)
- **Build history:** PRs #78–#90 on `github.com/canfieldjuan/atlas-portfolio`
  (each has a plan doc in `web/plans/PR-*.md`).
- **Parked risk:** `HARDENING.md`.
