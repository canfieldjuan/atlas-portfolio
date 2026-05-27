# Plan: Swap the live interactive /demo to the B2B-SaaS dataset

Follows PR #100 (the on-page static sample swap). #100's new "B2B SaaS sample"
card has a "Try it live" CTA → `/systems/support-ticket-deflection/demo`, which
still runs the off-ICP CFPB consumer dataset (Codex P2 on #100). This swaps that
interactive demo to the same SaaS topics so the two surfaces agree. Lands
together with #100 so nothing contradictory ships.

## Why this slice exists

- The interactive `/demo` (type a question → see the answer + the demand behind
  it) runs on `DEMO_ISSUES` in `deflection-demo.ts` — consumer clusters (login,
  "charged twice", "where is my order", app crashing). After #100 the wedge card
  says "B2B SaaS sample" but its CTA lands on that consumer demo: a live
  contradiction. Swapping the demo to the SaaS topics closes it.

## Scope (this PR)

Slice phase: Product polish

1. **Rewrite `DEMO_ISSUES`** (6 entries) to the SaaS topics, mapped 1:1 to the
   sample JSON items: `intent` = the topic, `phrases[]` = the customer-wording
   question + matcher variants, `ticketVolumeInSample` = real `ticket_count`,
   `sourceCount` = real `source_ids.length`. `improved` is a hand-authored
   *illustrative* finished FAQ for the SaaS topic (same pattern as the prior CFPB
   answers — illustrative, label-gated, never generator output).
2. **`DEMO_CHIPS`** → the 6 customer-wording questions (trimmed).
3. **Copy** — `deflection-demo.ts` header comment + `demo/page.tsx` intro tie the
   surfaces together: the live demo shows the *finished* FAQ; the Report gives
   you *drafts* from your real tickets to refine (like the wedge-page sample).

### Files touched

- `web/plans/PR-Demo-Live-Swap-SaaS.md` — this plan doc (new)
- `web/src/lib/deflection-demo.ts` — `DEMO_ISSUES` + `DEMO_CHIPS` + header comment
- `web/src/app/systems/support-ticket-deflection/demo/page.tsx` — intro copy tie-line
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — input placeholder string only (consumer → SaaS examples; no structural change)

## Mechanism

- The demand side becomes genuinely real (more honest than the CFPB version,
  whose per-issue numbers were illustrative): `ticketVolumeInSample` /
  `sourceCount` are the JSON's `ticket_count` / `source_ids.length` (8/8, 7/7,
  4/4, 5/5, 4/4, 8/8 — small because it's a 36-row sample, consistent with #100).
  The answer side stays illustrative full-step FAQs, label-gated by the
  component's existing "Illustrative · sample dataset" + "review and publish" copy.
- `DeflectionDemo.tsx` changes by **one line** (the input placeholder's example
  strings); its rendering, `matchLocal`, and the route's `mapAtlasMatch` are
  untouched — they're generic over the `DeflectionIssue` shape.

## Intentional

- **Illustrative answers, not generator output** — the sample's real `steps` are
  generic `draft_needs_review` scaffolds (no resolution text in the corpus), so
  parading them would be worse than a clean hand-authored FAQ. The honesty
  mechanism is the label (as it always was for this demo), and the tie-line makes
  "draft on the card, finished example here" coherent.
- **Real demand numbers** — ticket/source counts come straight from the JSON, so
  the "real signals" panel is now actually real.
- **Item 6 relabeled** — the JSON topic "other support issues" (a permissions /
  roles / SSO / seats cluster) reads as a junk bucket in the demo's big header;
  shown as "Permissions & access". #100's static card still echoes the raw
  generator topic (honest on a real-output card); the demo uses a readable label.
- **No new claims** — no deflection %, ranking, or churn promise (D-028). The
  intake CTA keeps the existing 3–6-month window.

## Deferred

- Surfacing `evidence_quotes` / `term_mappings` in the demo would need a
  `DeflectionDemo.tsx` change — out of scope here (the component has no slot).
- A `resolution_evidence` corpus slice (real answers) would let the demo show
  actual generator answers instead of illustrative ones — generator-dev follow-up.

Parked hardening: none.

## Verification

- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  3 == 3 + diff-size).
- `tsc --noEmit` / `npm run lint` clean; `npm run build` succeeds; the demo
  matches the chips and renders the SaaS answers + real signals; no
  consumer/CFPB copy remains on the demo surface.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `DEMO_ISSUES` rewrite (6 items) | ~105 |
| `DEMO_CHIPS` + header comment | ~12 |
| `demo/page.tsx` copy | ~6 |
| `DeflectionDemo.tsx` placeholder (1 line) | ~2 |
| this plan doc | ~96 |
| **Total** | ~221 |

Under the 400-LOC soft cap.
