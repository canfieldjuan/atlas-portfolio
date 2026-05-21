# PR-Content-Ops-FAQ-1000-Row-Artifact

## Why this slice exists

PR-Content-Ops-Demo-Scale-Copy updated the landing page to mention the validated
1,000-row FAQ generator run, but the public page still only links the compact
46-row excerpt. The full fixed Markdown artifact is small enough to ship as a
static proof asset, so visitors can inspect the actual 1,000-row output shape
without trusting only summary copy.

## Scope (this PR)

1. Add the fixed 1,000-row FAQ Markdown artifact under the existing
   `public/systems/ai-content-ops/` demo path.
2. Link the full validation artifact from the FAQ sample card.
3. Link the full validation artifact from the compact Markdown demo.
4. Keep the on-page FAQ card compact and unchanged apart from links.

### Files touched

- `public/systems/ai-content-ops/public-support-ticket-faq-1000-row-validated.md`
- `public/systems/ai-content-ops/public-support-ticket-faq-demo.md`
- `src/app/systems/ai-content-ops/page.tsx`
- `plans/PR-Content-Ops-FAQ-1000-Row-Artifact.md`

## Mechanism

The artifact is copied from the fixed Atlas validation output:

```text
/home/juan-canfield/Desktop/Atlas/tmp/content_ops_faq_1000/cfpb_1000_faq_fixed.md
```

It is 25 KB and 255 lines, so it is cheap enough to keep in `public/` as a
static Markdown file. The landing page retains the readable 46-row excerpt, but
the proof/disclaimer line now offers both the compact excerpt and the full
1,000-row validation output.

## Intentional

- The full artifact is Markdown, not parsed at runtime. This keeps the portfolio
  site static and avoids introducing a report renderer.
- The compact on-page card remains the primary visual demo because the full
  1,000-row artifact is too long for a landing-page section.
- The artifact is public-dataset output with CFPB redaction tokens preserved.

## Deferred

- A future PR can add a styled report viewer if plain Markdown inspection is not
  enough.
- A future PR can add hosted throughput metrics if the production service later
  exposes repeatable benchmark data.

## Verification

- `git diff --check` - passed.
- `npm run lint` - passed.
- `npm run build` - passed. Next.js emitted the existing edge-runtime static
  generation warning.
- Local dev server check at `http://127.0.0.1:3100/systems/ai-content-ops` -
  verified the landing page includes the 1,000-row validation output link.
- Local dev server check for
  `/systems/ai-content-ops/public-support-ticket-faq-1000-row-validated.md` -
  returned `200 OK` and the artifact begins with
  `Source rows analyzed: 1000. Ticket sources used: 1000.`

## Estimated diff size

4 files, +335 / -1 lines. This is under the 400 LOC soft cap.
