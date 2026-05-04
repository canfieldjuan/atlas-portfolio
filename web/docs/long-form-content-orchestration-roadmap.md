# Long-Form Content Orchestration — Roadmap

Last updated: May 2, 2026.

Internal-only. Captures the engineering build needed for the AI Content Ops engine to produce long-form creative content (novellas, novels, multi-part series) reliably. Landing pages today do **not** sell this — but adjacent expansion (Dark Story Engine multi-part series, novella-length premium content, ghostwritten audiobooks) will, and the build needs to land before we sell.

## Why this matters

The current productized landing pages sell short-to-medium-form content:

- **Podcast Repurposing:** 6 multi-channel assets per episode, each ~150–800 words.
- **Dark Story Engine:** 6-output video packages, central asset is a 1,500–3,000 word narration script.

Both are deliverable today with current capability + per-customer voice profile + per-customer memory. Multi-pass review per asset, but each asset is short enough to fit a single generation cycle.

Long-form is a different problem entirely. **A 50k-word novel cannot be one-shot generated.** It requires structured orchestration across multiple passes:

```
outline → chapter plan → chapter draft → continuity check → revision pass
```

None of that loop is built today. The existing creative backlog (story_evidence_engine.py, story_sequence_progression.py, story_reasoning_context.py, story_generation.py + others) was sized assuming the loop would be built. Realistic scope is **2–4× that estimate** once multi-pass orchestration is accounted for.

## Format ceiling targets

Three capability milestones, each unlocking specific landing-page expansion:

| Phase | Target length | Output type | Unlocks for landing pages |
|---|---|---|---|
| **1** | 5,000–15,000 words | Long-form narration / short story | Dark Story Engine "Premium Series" tier (multi-part stories), Audiobook short story service |
| **2** | 15,000–40,000 words | Novella | Novella-length serial fiction tier, Episodic premium content for narration channels |
| **3** | 40,000–100,000+ words | Novel | Ghostwritten book service, Season-length serial fiction, Long-form audiobook production |

Each phase ships a credible landing-page expansion. **Don't add long-form tiers to existing pages until the corresponding phase ships.**

## Architecture

Six orchestration layers. Most short-form content needs Layers 1, 3, and 6. Long-form needs all six.

### Layer 1 — Story foundation (pre-generation)

- Story arc / structural template (3-act, hero's journey, mystery structure, episodic horror)
- Character bible (per-character: name, voice, role, arc, knowledge state)
- Setting / world bible (locations, rules, recurring elements)
- Per-customer voice profile (already partially built for podcast / dark-story)

### Layer 2 — Outlining

- Macro outline: acts, chapters, key beats, climax timing
- Scene-level outline within chapters
- Foreshadowing register (what's been planted, where it pays off)
- Continuity vector: what each scene must establish, reveal, or resolve

### Layer 3 — Drafting

- Per-scene generation grounded in outline + retrieved context
- Continuity context window: relevant prior text + character state + plot state at this point in the story
- Voice consistency calls during draft (not just after)
- Length pacing: target chapter length distribution, sentence-level pacing markers

### Layer 4 — Continuity tracking (the one that actually matters)

This is where most long-form generation fails. Needs persistent state tracking:

- **Character state:** location, knowledge, emotional arc position, what they have / wear / carry
- **Plot state:** revealed facts, foreshadowed beats, resolved threads, open threads
- **World consistency:** time of day, day of week, weather, season — chronology has to hold
- **Vocabulary register:** invented names / places / terms stay spelled and used consistently
- **Foreshadowing audit:** every Chekhov's gun is fired or removed

### Layer 5 — Revision passes (multi-pass loop)

Each draft chapter goes through ordered passes:

1. **Structural** — does the chapter match the outline?
2. **Continuity** — do facts / characters / world stay consistent with prior chapters?
3. **Voice** — does it sound like the channel / author?
4. **Pacing** — does chapter rhythm work? scene breaks land?
5. **Prose** — sentence-level quality

Each pass can trigger a regeneration of specific scenes, not the whole chapter. That's the orchestration cost: the loop is multi-pass with selective regeneration, not single-shot.

### Layer 6 — Memory and feedback

- Per-project memory (what's been written, what's planned, draft / revision history)
- Per-customer memory (voice profile, past projects, what worked)
- Operator review surface — human can interject between passes
- Cost tracking per generation cycle (long-form burns inference budget fast)
- Versioning of drafts and revisions

## Phased build

Each phase is sized including the multi-pass orchestration cost (the 2–4× original estimate is baked in here, not added later).

### Phase 1 — Short long-form (5k–15k words) · ~10–14 weeks

**Files:**
- Existing: `story_evidence_engine.py`, `story_sequence_progression.py`, `story_reasoning_context.py`, `story_generation.py`
- New: `story_outline.py`, `story_continuity_state.py`, `story_revision_pass.py`, `story_voice_check.py`, `story_orchestration_loop.py`

**Layers in scope:** 1, 2, 3, partial 4 (character + plot state), 6 (basic memory)

**Deliverable target:** Generate a 10k-word multi-chapter short story from a topic prompt + voice profile, with character continuity holding across chapters and structural beats matching the outline.

**Validation criteria:**
- Generate 5 stories from 5 different prompts in 5 different voice profiles
- Run 3 independent reads (operator + LLM-judge + comparison to human-written control)
- Continuity errors per 10k words: target < 3 (characters, plot facts, timeline)
- Voice match score: target > 70% similarity to source voice profile
- Cost per story: target < $25 in inference

**What this unlocks for landings:**
- Dark Story Engine "Multi-Part Series" tier ($1,997+ for 4-part 10k-word stories per month)
- Standalone "Long-form narration" landing page targeting audiobook channels

### Phase 2 — Novella (15k–40k words) · ~6–10 additional weeks

**Files:**
- New: `story_arc_tracker.py`, `story_foreshadowing_register.py`, `story_pacing_calibration.py`, expanded revision passes

**Layers in scope:** Full 4 (continuity tracking with foreshadowing audit), full 5 (5-pass revision loop)

**Deliverable target:** Generate a 25k-word novella with at least one major foreshadowed beat that pays off, character arcs that resolve, and continuity holding across 6–8 chapters.

**Validation criteria:**
- Generate 3 novellas in 3 different sub-genres (cosmic horror, paranormal investigation, urban legend)
- Continuity errors per 25k words: target < 5
- Foreshadowing audit: 100% of planted beats resolved or explicitly removed
- Voice match: > 75% similarity (tighter than Phase 1 because the model now has more text to drift across)
- Cost per novella: target < $80

**What this unlocks for landings:**
- Novella-length serial fiction service (Substack-style, monthly chapter drops)
- Premium episodic content tier for established narration channels

### Phase 3 — Novel (40k–100k+ words) · ~8–12 additional weeks

**Files:**
- New: `story_multi_arc_tracker.py`, `story_perspective_consistency.py`, `story_long_context_summarizer.py`, `story_chapter_dependency_graph.py`

**Layers in scope:** All six, including cross-arc continuity (subplots resolving, multi-POV consistency, season-length plotting)

**Deliverable target:** Generate a 60k-word novel with 3 character arcs, 1 main plot + 2 subplots, all resolving by the end. Continuity holds across 15–25 chapters.

**Validation criteria:**
- Generate 1 complete novel
- Continuity errors per 60k words: target < 8
- Character arc resolution: all 3 arcs reach defined endpoints
- Subplot resolution: 2/2 subplots tied to main resolution
- Cost per novel: target < $300
- Operator review time: target < 8 hours (reading + lightweight editing)

**What this unlocks for landings:**
- Ghostwritten book service ($5k–$25k+ per book)
- Season-length serial fiction ($2k+/month for ongoing chapter drops)
- Long-form audiobook production

## Total realistic scope

24–36 weeks (~6–9 months) of focused work, sequenced. Each phase has a working deliverable and unlocks revenue before the next phase ships. Don't try to build all three phases in parallel — Layer 4 continuity tracking gets harder as story length grows, and Phase 1's continuity model gets stress-tested by Phase 2's longer outputs.

## Cross-cutting infrastructure (build once, used by all phases)

- **Orchestration engine:** state machine for multi-pass loops. LangGraph is the obvious starting point given it's already in `knowsAbout` from the SEO config and is the standard for this kind of work.
- **Vector store for continuity context:** retrieval of relevant prior text + character / plot state per scene generation. Existing infrastructure if we have RAG components; new build if not.
- **Cost tracking per generation cycle:** long-form burns budget fast. Per-project, per-customer, per-phase cost tracking is mandatory. Tie into the cost-observability dashboard already shipped on `/demo`.
- **Operator review surface:** the AI Content Ops "Human Approval" stage already exists conceptually. Long-form needs a chapter-level review queue with diff views between revision passes.
- **Versioning:** every draft and revision pass is a versioned artifact. Operator can roll back to an earlier draft if a revision pass made things worse.

## Open questions to resolve before Phase 1 starts

1. **Which orchestration framework.** LangGraph vs custom state machine vs DSPy. LangGraph is the obvious bet but worth a 1-day spike to validate against the multi-pass loop pattern specifically.
2. **Which model tier for which pass.** Outlining and continuity checks may not need GPT-4o-class; drafting probably does. Cost optimization here is the difference between $25 and $80 per Phase-1 story.
3. **Operator review cadence.** Does the operator review every chapter draft, or every revision pass, or only at chapter completion? Affects throughput and orchestration loop design.
4. **Voice profile seed corpus.** Per-customer voice profiles work for short-form because we calibrate against ~3 existing scripts. Long-form needs more — probably a full chapter or two of ground-truth in their voice. How is that captured during onboarding?
5. **Eval criteria for fiction quality.** LLM judges of fiction quality are unreliable. We probably need human spot-check on first 10 deliveries per phase, with the eval criteria refined from those reads.

## Landing-page coupling rules

To prevent the gap from re-opening: **no landing-page tier or product references long-form content until the corresponding phase ships.**

| Landing change | Required phase |
|---|---|
| Dark Story Engine multi-part series tier | Phase 1 complete + 5 successful customer deliveries |
| Novella subscription landing page | Phase 2 complete + 3 successful customer deliveries |
| Ghostwritten book landing page | Phase 3 complete + 1 successful customer delivery |
| AI Content Ops "long-form" capability mention | Phase 1 complete |

The current landing pages stay scoped to short-to-medium form. They are not edited as part of this roadmap.

## Files in scope (existing creative backlog mapping)

| File | Phase | Status | New scope (vs original estimate) |
|---|---|---|---|
| `story_evidence_engine.py` | 1 | Backlog | ~2× (multi-pass evidence retrieval) |
| `story_sequence_progression.py` | 1 | Backlog | ~3× (continuity state tracking added) |
| `story_reasoning_context.py` | 1 | Backlog | ~2× (long-context summarization needed) |
| `story_generation.py` | 1 | Backlog | ~2× (revision loop integration) |
| `story_outline.py` | 1 | New | (not in original backlog) |
| `story_continuity_state.py` | 1 | New | (not in original backlog) |
| `story_revision_pass.py` | 1 | New | (not in original backlog) |
| `story_voice_check.py` | 1 | New | (not in original backlog) |
| `story_orchestration_loop.py` | 1 | New | (not in original backlog) |
| `story_arc_tracker.py` | 2 | New | |
| `story_foreshadowing_register.py` | 2 | New | |
| `story_pacing_calibration.py` | 2 | New | |
| `story_multi_arc_tracker.py` | 3 | New | |
| `story_perspective_consistency.py` | 3 | New | |
| `story_long_context_summarizer.py` | 3 | New | |
| `story_chapter_dependency_graph.py` | 3 | New | |

The existing 4-file backlog grows to 9 files for Phase 1 alone. That's the 2× scope increase the original concern flagged. Phase 2 adds 3 more, Phase 3 adds 4 more. Total Phase 1+2+3: 16 files, ~24-36 weeks of focused work.

## Decision required to move forward

This roadmap is informational until you commit to Phase 1. Two decisions to make before any code ships:

1. **When does Phase 1 start?** This is real engineering scope (10–14 weeks). Worth tying to a revenue trigger (e.g., 5+ paying Dark Story Engine customers asking for longer-form, or a ghostwritten-book lead willing to pay $10k+ as a Phase 1 design partner).
2. **Does anyone besides you build it?** Three months of focused engineering is a lot of context-switching cost from the consulting / landing-page work. Worth deciding if this is solo work, contracted, or paused entirely until revenue justifies a hire.

Until those are answered, the landing pages stay scoped to what current capability can deliver. No long-form promises on any public surface.
