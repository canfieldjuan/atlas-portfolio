# Plan: Deflection FAQ accordion

Make the Support Ticket Deflection FAQ easier to scan at the bottom of the
landing page, especially on mobile, without rewriting the FAQ copy or changing
the structured data.

## Why this slice exists

- The current FAQ renders every answer expanded, which makes the bottom of the
  page feel like a long document after pricing.
- The buyer needs to scan objections quickly; an accordion lets them choose the
  question they care about instead of reading every answer in sequence.
- Mobile benefits most because each expanded FAQ card consumes substantial
  vertical space.

## Scope (this PR)

Slice phase: Product polish

1. Convert the Support Ticket Deflection FAQ list from always-expanded cards to
   an accordion interaction.
2. Keep the first FAQ open by default so the section still shows answer content
   on initial view.
3. Preserve the existing FAQ copy and FAQ JSON-LD generation.
4. Add accessible button semantics with `aria-expanded`, `aria-controls`, and
   stable panel ids.
5. Keep the change local to the shared deflection landing page component.

### Files touched

- `web/plans/PR-Deflection-FAQ-Accordion.md` — this plan doc (new)
- `web/src/components/landing/DeflectionLandingPage.tsx` — render FAQ items as an accordion

## Mechanism

- Add local FAQ accordion state to `DeflectionLandingPage`, initialized to the
  first FAQ item.
- Replace the always-expanded FAQ card body with a full-width question button
  and a conditionally rendered answer panel.
- Use stable ids derived from the FAQ item index for `aria-controls` and panel
  `id` attributes.
- Add a chevron icon that rotates when its FAQ item is open.
- Leave `config.faq.items`, `pricingFaqs`, and `config.structuredData`
  untouched.

## Intentional

- **No FAQ copy rewrite** — this slice changes presentation only.
- **Single-open accordion** — opening one answer closes the previous answer to
  keep the bottom of the page compact.
- **First item open by default** — the section still demonstrates answer depth
  without forcing every answer open.
- **No global accordion primitive** — this is a focused landing-page polish pass,
  not a design-system extraction.

## Deferred

- Rewriting FAQ questions into sharper buyer objections.
- Changing FAQ order or reducing the number of FAQ items.
- Promoting a reusable accordion component if another page needs the same
  pattern.
- Parked hardening considered but out of scope: DEFLECTION-INTAKE-PII-1.

Parked hardening: none.

## Verification

- `npm --prefix web run lint` — passed.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection`
  with `agent-browser` — page loaded, content rendered, and no framework error
  overlay was present.
- FAQ interaction check — first FAQ starts open with `aria-expanded="true"`;
  opening the second FAQ changes it to `aria-expanded="true"` and collapses the
  first FAQ.
- Mobile viewport check at 390px — FAQ remains a compact accordion and no
  framework error overlay was present.
- `git diff --check` — passed.
- `npm --prefix web run build` — first attempt failed because the sandbox
  blocked Google Fonts fetches for `Geist` and `Geist Mono`; rerun with approved
  network access passed.
- Stale-copy grep: not applicable; this slice changes FAQ presentation only and
  does not change recurring copy strings, labels, routes, or values.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `DeflectionLandingPage.tsx` FAQ accordion state/rendering | ~50 |
| this plan doc | ~80 |
| **Total** | ~130 |

Under the 400-LOC soft cap.
