# Plan: Replace the misattributed 74% Gartner stat with the primary-sourced 40% leader estimate

A primary-source verification (2026-05-28) found the SEO section's headline stat —
"Gartner: 74% of issues reaching a live agent could have been resolved in
self-service" (shipped in #112) — is **misattributed and unverifiable**. This
corrects it to the real, citable Gartner figure and fixes the source doc.

## Why this slice exists

- The Gartner Aug 19 2024 release (verified via CX Today's verbatim summary; Gartner
  403s direct fetch) contains **no** "could have been resolved" figure — it reports
  14% resolved / 73% attempt / 43% can't-find-content / 45% not-understood.
- The "74%" traces to a **CoSupport AI customer testimonial** ("our chatbot now
  resolves ~74% of all support tickets") — a vendor chatbot resolution rate, not a
  Gartner study. The sourced-facts doc's `[M] Gartner` tag was a laundered
  misattribution.
- A live, prominent claim that fails "could they say you lied?" is a
  data-truthfulness issue — fix inline, not parked.

## Scope (this PR)

Slice phase: Product polish

1. **`landingConfig-v2.tsx` (SEO section):** "Gartner put it bluntly: **74%** of the
   issues that reach a live agent could have been resolved…" → "**Service leaders
   surveyed by Gartner estimate that as much as 40%** of the issues reaching a live
   agent could have been resolved…". The 40% is Gartner / Devin Poole, 2019 (leader
   survey, upper bound of the 20–40% range) — framed as a leader *estimate*, which
   is what it is. Rest of the sentence (findability point) unchanged.
2. **`sourced-facts-extract.md`:** retract the 74% entry as misattributed (with the
   primary-source finding) and point to the 20–40% leader figure (Tier 2 #8) as the
   citable replacement, so the bad stat can't be reused.

### Files touched

- `web/plans/PR-Fix-74pct-Stat.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — SEO 74%→40% line
- `SEO-Ticket-Deflection-Template-Docs/sourced-facts-extract.md` — retract 74% misattribution
- `.gitignore` — adds `.env` / `.env.local` (rides along: the local-secret protection
  added earlier this session when the OpenRouter key was placed at repo root; not
  yet committed, included here so it isn't lost — unrelated to the stat fix)

## Mechanism

- Copy-only on the page (one `seoVisibility` paragraph) + a docs correction. No
  component change. Verified no other `74%` reference exists anywhere in `web/src/`.

## Intentional

- **Framed as a leader estimate, not a measurement** — "service leaders surveyed by
  Gartner estimate… as much as 40%." The 40% is the upper bound of Gartner's 20–40%
  leader-survey range; "as much as" is honest about that.
- **Did not** reach for a bigger number — the whole point is that the inflated 74%
  wasn't real. 40% is the defensible ceiling.
- The 73%/14% (primary, rock-solid) still carries the rest of the SEO/findability
  thread; this stat is supporting, not load-bearing.

## Deferred

- None. (The 40–60% inbox-volume stat remains `[E]` industry-synthesis — verification
  found no named measured benchmark to upgrade it; left as-is, out of scope here.)

Parked hardening: none.

## Verification

- `tsc --noEmit` = 0; `npm run lint` = 0 (clean); `npm run build` green.
- No `74%` remains anywhere in `web/src/`.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  3 == 3 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| landingConfig-v2 SEO line | ~2 |
| sourced-facts-extract.md retraction | ~14 |
| this plan doc | ~70 |
| **Total** | ~86 |

Well under the 400-LOC soft cap.
