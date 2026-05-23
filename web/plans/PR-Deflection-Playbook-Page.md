# Plan: Support Ticket Deflection playbook — ungated lead page (slice P1)

A new top-of-funnel content page: "10 questions every SaaS support team gets — the
docs-y article that creates a ticket, and the rewrite that deflects it." It reads
free (ungated), is built for SEO + sharing, and funnels into the interactive demo
(and from there the Snapshot intake). The email opt-in ("get all 10 as templates")
is a separate, deferred slice.

## Why this slice exists

- **New asset, not part of the demo-redesign arc.** This came out of a GTM
  conversation while slice 3c is blocked on the Atlas endpoint: a lead magnet that
  pulls the demo's audience (CX leaders Googling "help center deflection") and
  hands them to the demo. Flagging that explicitly so it isn't mistaken for a
  continuation of #63–#70.
- Hosting it as a **page** (not a gated PDF) is lower-friction, keeps the visitor
  on-site, is shareable + indexable, and ends at a CTA instead of a downloads
  folder. The operator chose: ungated to read, email earned on the upgrade.
- This slice ships the readable page + the onward funnel; it captures *buyers*
  via the demo's existing Snapshot CTA even before any email opt-in exists.

## Scope (this PR)

1. Add the playbook content as data: a `PlaybookEntry[]` of 10 entries.
2. Add the page at `/systems/support-ticket-deflection/playbook` (server-rendered,
   ungated) + a `layout.tsx` with metadata/breadcrumb JSON-LD.
3. Add the page URL to the sitemap.

### Files touched

- `web/plans/PR-Deflection-Playbook-Page.md` — this plan doc (new)
- `web/src/lib/deflection-playbook.ts` — `PlaybookEntry` type + the 10 entries (new)
- `web/src/app/systems/support-ticket-deflection/playbook/page.tsx` — the page (new)
- `web/src/app/systems/support-ticket-deflection/playbook/layout.tsx` — metadata + breadcrumb (new)
- `web/src/app/sitemap.ts` — add the playbook URL

## Mechanism

- **Data shape** (what reviewers actually review — the 10 prose entries live in the
  data file, not here):
  ```ts
  type PlaybookEntry = {
    question: string;       // in the customer's own words
    servedToday: string;    // the jargon-y article most help centers serve
    whyItFails: string;     // one line
    rewrite: { title: string; steps: string[] };
    move: string;           // the transferable principle
  };
  ```
- **Page** is a server component (no client state): hook header → `PLAYBOOK_ENTRIES.map`
  into a card per entry → a "see it live" link to the demo → a Snapshot CTA to the
  intake. Themed with the site tokens, matching the demo page's chrome.
- **Dedicated page, not a `/resources/[slug]` entry** — that route is a data-driven
  *article* template (`resourceArticles`); this is a custom lead layout that funnels
  into the demo, so it gets its own route, topically clustered with the wedge.
- **Self-explanatory top-of-fold** — a cold visitor (LinkedIn/Google) may land here
  without seeing the wedge first, so the hook + thesis stand alone; nothing assumes
  prior context.
- **Demo bridge is a link, not an embed** — a "see it on a real question →" link to
  `/systems/support-ticket-deflection/demo` (matching the wedge→demo pattern from
  #64). Embedding the client demo would double the bundle and complicate the
  static prerender.
- **Metadata** via `generatePageMetadata` with the swipe-file *hook* as the OG
  title/description (it's the share-worthy line); OG image falls back to the site
  default.

## Intentional

- **Ungated read; email earned on the upgrade is deferred (slice P2).** This page
  captures buyers via the demo's Snapshot CTA today; the email opt-in is additive.
- **Content-heavy by nature.** Most of the diff is prose-as-data (10 entries) with a
  thin `.map` render — the review burden is editorial, not logic, so it sits near
  but under the 400-LOC cap legitimately.
- **`deflection-playbook.ts` stays separate from `deflection-demo.ts`** — one is
  static marketing content, the other is the search seam wired to Atlas. No
  cross-import in either direction, so the 3c Atlas wiring never couples to a
  marketing page.
- **Generic-but-concrete copy** — examples are written to read as polished generic
  SaaS guidance (e.g. "Slack, HubSpot, etc."), not raw `[fill-in]` blanks.

## Deferred

- **Slice P2 (the opt-in):** an inline "get all 10 as copy-paste templates" email
  capture. It needs its **own** lightweight `POST /api/playbook-intake`
  (`{ email, ticketsBand? }`) that notifies via `audit-intake.ts`'s Resend helpers —
  **not** a reuse of `/api/gap-report-intake`, which requires name + company + a CSV
  file (it's the Snapshot/buyer intake, Vercel-blob backed).
- Vertical re-skins (ecom/fintech) if we expand beyond B2B SaaS.
- Parked hardening: none.

## Verification

- `npm --prefix web run lint` clean; `npm --prefix web run build` compiles — the
  playbook page prerenders static.
- `bash scripts/pre_push_audit.sh origin/main` green (plan shape + files-touched
  5 == 5 + diff-size).
- Browser spot-check: page reads top-to-bottom (hook → 10 entries → demo link →
  Snapshot CTA) with no email wall; the demo link resolves; the Snapshot CTA points
  at the intake.

## Estimated diff size

| Area | LOC (added + deleted) |
|---|---|
| `deflection-playbook.ts` (type + 10 entries) | ~168 |
| `playbook/page.tsx` | ~111 |
| `playbook/layout.tsx` | ~34 |
| `sitemap.ts` (one URL) | ~1 |
| this plan doc | ~113 |
| **Total** | ~427 |

Modestly **over** the 400-LOC soft cap (~427). Justified as one indivisible content
page: the overage is entirely prose-as-data (the 10 entries in the data file are
168 of those lines), an editorial review burden, not logic. Splitting a swipe file
into "page + 4 entries" / "the other 6" ships a worse product for no review benefit.
