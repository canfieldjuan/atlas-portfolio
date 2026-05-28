# Plan: Tighten deflection landing-page structure

Improve the Support Ticket Deflection landing page's reading order and scan
rhythm without doing the later headline/copy rewrite. The page should move from
problem to mechanism to concrete report contents faster, and the mobile
comparison should keep each before/after contrast together.

## Why this slice exists

- The current page is directionally coherent, but it reads like a long memo:
  problem/cost, alternatives, mechanism, SEO upside, proof, and only then the
  concrete report contents.
- The "what you get" section appears too late in the page, so the reader has to
  absorb several arguments before seeing the actual deliverable.
- The current comparison grid scans well enough on desktop but stacks poorly on
  mobile because each "current way" row separates from its matching "better way"
  row.
- Browser verification surfaced a React key warning in `ComparisonGrid`, which
  should be fixed in the same structural slice.

## Scope (this PR)

Slice phase: Product polish

1. Split the oversized first problem section into a smaller broken-loop section
   and a follow-up cost section.
2. Move the report/offering section immediately after the mechanism, before
   SEO/search visibility and proof.
3. Keep the existing mechanism section and pipeline intact.
4. Rework the comparison grid so mobile shows paired before/after cards while
   desktop keeps the table-like side-by-side scan.
5. Fix the React key warning in the comparison mapping.

### Files touched

- `web/plans/PR-Deflection-Structure-Tighten.md` — this plan doc (new)
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — split content and mobile comparison structure
- `web/src/app/systems/support-ticket-deflection/partner/page.tsx` — preserve partner no-calculator behavior after the split
- `web/src/components/landing/DeflectionLandingPage.tsx` — reorder sections and add the second problem-cost slot

## Mechanism

- Extend `DeflectionLandingPageConfig` with a `problemCost` slot using the same
  label/title/content shape as `problemAgitation`.
- Render order becomes: hero → broken loop → cost → current way vs this way →
  mechanism → what you get → search visibility → proof → risk reversal →
  mid-page CTA → pricing → FAQ → footer CTA.
- Move existing JSX content between the two problem slots rather than rewriting
  the offer.
- Add a mobile-only paired comparison layout and keep a desktop-only table
  layout; each mapped row gets a stable keyed container/fragment.

## Intentional

- **Structure only** — no headline rewrite, no new offer claim, no pricing
  change, and no intake/privacy change.
- **No global spacing change** — the page feels spacious, but changing
  `.section-band` would affect other pages. This slice tightens reading order
  first.
- **Mid-page CTA remains before pricing** — it is still useful as an early
  action point, but this slice treats it as an interstitial CTA, not the final
  close.

## Deferred

- Headline, hero promise, and copy-level persuasion rewrite.
- FAQ accordion/tighter FAQ presentation if the bottom remains too long after
  the structure pass.
- Global or route-specific section spacing changes.
- Parked hardening considered but out of scope: DEFLECTION-INTAKE-PII-1.

Parked hardening: none.

## Verification

- `npm --prefix web run lint` — passed.
- `git diff --check` — passed.
- `npm --prefix web run build` — first attempt failed because the sandbox
  blocked Google Fonts fetches for `Geist` and `Geist Mono`; rerun with approved
  network access passed.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection` —
  verified the section order is hero → broken loop → cost → comparison →
  mechanism → report contents → SEO/search visibility → proof → risk reversal →
  CTA → pricing → FAQ → footer CTA.
- Browser/mobile check — verified each comparison item keeps the current-way and
  better-way copy paired together on the mobile layout.
- Dev-server log check — the React key warning from `ComparisonGrid` no longer
  appears after loading the page.
- `rg -n "THE COST OF STAYING HERE|Repeat tickets are not a small inefficiency\. They are an operating cost line\." web/src web/docs`
  — no stale instances remain.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `landingConfig-v2.tsx` structure/content movement | ~90 |
| `DeflectionLandingPage.tsx` section order/type slot | ~45 |
| `partner/page.tsx` no-calculator override | ~10 |
| this plan doc | ~90 |
| **Total** | ~235 |

Under the 400-LOC soft cap.
