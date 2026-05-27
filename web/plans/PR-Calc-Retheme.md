# Plan: Re-theme the Leaky Bucket calculator to the juancanfield.com aesthetic

The calculator (tracked in #106) shipped on its own dark amber/rose/emerald
theme. Re-skin it to the site's **light / blue** aesthetic so it reads like a page
of juancanfield.com — for sharing as a GTM asset and eventual on-site embedding.

## Why this slice exists

- It's a prospect-facing tool; on its own dark theme it looks off-brand next to the
  wedge pages. Matching the site palette makes it feel native.

## Scope (this PR)

Slice phase: Product polish

1. **Remap `:root` to the site palette** (from `web/src/app/globals.css`): bg
   `#f4f7f2` + the site's soft blue-tinted gradient; text `#17231f`; primary blue
   `#3c6f8f`; translucent-white glass surfaces + border + card-shadow. The three
   accent slots keep their names but hold site colors: `--amber`→primary blue,
   `--rose`→danger rust `#9f341b`, `--emerald`→success green `#2f6b42`.
2. **Fonts** Fraunces/Manrope/JetBrains Mono → **Geist / Geist Mono** (the site
   has no display serif, so `.font-display` becomes Geist with tight tracking).
3. **Body** → the site's light gradient (dropped the dark radial + grid overlay).
4. **Glass cards** (`.surface` gets blur + card-shadow like the site's `.glass`),
   **blue slider** (track fill + thumb), softened tooltip shadow.

### Files touched

- `web/plans/PR-Calc-Retheme.md` — this plan doc (new)
- `SEO-Ticket-Deflection-Template-Docs/leaky-bucket-calculator.html` — CSS re-theme

## Mechanism

- The calculator's inline Tailwind arbitrary-value classes all reference the named
  CSS vars (`text-[var(--text-dim)]`, `accent-amber`, `card-rose`, …), so remapping
  `:root` cascades the new palette everywhere; only fonts, body background, the
  `.surface` glass treatment, the slider, and a couple of hard-coded dark shadows
  needed direct edits. **No HTML structure, no JS, no math changes** — the engine
  and its `verifyMathEngine` self-test are byte-for-byte unchanged.

## Intentional

- **Kept the var names** (`--amber`/`--rose`/`--emerald`) holding site colors —
  minimal diff; documented in a `:root` comment so the misnomer isn't confusing.
- **Geist over Fraunces** — the site uses no serif; sans headings match the wedge.
- **Standalone HTML outside `web/`** → zero build/deploy impact (matches #106).

## Deferred

- Embedding the calculator on a real site route (Next page) — separate slice.

Parked hardening: none.

## Verification

- No stray dark-theme / old-font refs (`grep` clean); site palette present; `node
  --check` clean on the extracted script (JS engine untouched); diff scope is the
  calculator only.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  2 == 2 + diff-size).

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| calculator CSS re-theme | ~80 |
| this plan doc | ~60 |
| **Total** | ~140 |

Well under the 400-LOC soft cap.
