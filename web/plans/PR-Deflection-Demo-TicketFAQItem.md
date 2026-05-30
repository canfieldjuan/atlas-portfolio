## Why this slice exists

The Support Ticket Deflection demo visually resembled the productized FAQ report,
but it rendered a local `DeflectionIssue` projection instead of the canonical
`TicketFAQItem` shape. That left the most important buyer comparison — customer
language versus documentation language — flattened into prose instead of showing
the `term_mappings` data the paid report actually returns.

The canonical source of truth is the merged ATLAS document
`docs/frontend/content_ops_faq_report_contract.md` in `canfieldjuan/ATLAS`. This
repo should point to that contract and render the demo from the same item shape,
without copying the contract doc here and creating drift.

## Scope (this PR)

Slice phase: Product polish

1. Replace the demo's hand-rolled rendered issue model with local
   `TicketFAQItem` / `FAQTermMapping` types that point back to the ATLAS contract.
2. Keep the local interactive matcher, but make it return a `TicketFAQItem` so
   the left finding card and right draft card render the paid report item shape.
3. Render `term_mappings` as the explicit customer-term versus documentation-term
   comparison beside the drafted answer.
4. Stop treating the compact Atlas search projection as a full demo report item;
   live artifact hydration remains deferred until the full artifact endpoint is
   wired.
5. Update the standalone demo page copy so it no longer claims the card is a
   finished published answer when the product delivers reviewed drafts.

### Files touched

- `web/plans/PR-Deflection-Demo-TicketFAQItem.md` — plan for this slice.
- `web/src/lib/deflection-demo.ts` — local demo data/types now use the
  `TicketFAQItem` shape.
- `web/src/components/deflection-demo/DeflectionDemo.tsx` — render finding,
  term mappings, evidence, and draft FAQ from `TicketFAQItem`.
- `web/src/app/api/demo/deflection-search/route.ts` — keep the demo endpoint
  contract-true by serving the local `TicketFAQItem` fixture only until full
  artifact hydration is wired.
- `web/src/app/systems/support-ticket-deflection/demo/page.tsx` — align demo-page
  explanatory copy with reviewed FAQ drafts.

## Mechanism

`deflection-demo.ts` defines the subset of the ATLAS `TicketFAQItem` contract the
demo consumes, with a comment pointing to the canonical ATLAS doc. The local
fixture keeps phrase metadata only for matching, strips that metadata before
returning API results, and preserves the product fields the UI renders:
`topic`, `question`, counts, `answer_evidence_status`, `answer`, `steps`,
`action_items`, `when_to_contact_support`, `source_ids`, `source_labels`,
`evidence_quotes`, and `term_mappings`.

`DeflectionDemo.tsx` stops reading `intent`, `documentationGap`, and
`improved.*`. The finding card now renders counts and evidence from the item, the
language-gap section renders `term_mappings[]` directly, and the draft card
renders `answer`, `steps[]`, `action_items[]`, and `when_to_contact_support`.

The API route remains the same same-origin endpoint for the client, but no longer
adapts the compact Atlas search row into a fake full item. The ATLAS contract says
compact search is a ranked preview and full detail comes from report/artifact
hydration, so the live full-report path is deferred instead of guessed.

## Intentional

- The free snapshot page is unchanged because it already matches
  `DeflectionSnapshot`.
- The demo keeps a local sample dataset so the landing page works without ATLAS
  credentials.
- The demo data includes matching phrases as local-only metadata; those phrases
  are stripped from the response and are not part of the rendered report item.
- The compact search proxy is not used as a full report source in this slice.
  That is deliberate because the canonical contract says compact search is not
  the artifact/detail shape.

## Deferred

- Live `/artifact` hydration for the paid report is not wired here; that needs
  the deployed ATLAS host, auth scope, and the full `FAQDeflectionReportArtifact`
  endpoint.
- Top-level report markdown rendering is not added to the landing demo; this
  slice only aligns the drill-down card.
- No visual redesign of the demo section beyond the structural data mapping.

Parked hardening: none.

## Verification

- `rg -n "DeflectionIssue|documentationGap|improved|answer_summary|DEFLECTION_SEARCH_ATLAS|term_mappings|TicketFAQItem" web/src/lib/deflection-demo.ts web/src/components/deflection-demo/DeflectionDemo.tsx web/src/app/api/demo/deflection-search/route.ts web/src/app/systems/support-ticket-deflection/demo/page.tsx` — no stale `DeflectionIssue`, `documentationGap`, `improved`, `answer_summary`, or `DEFLECTION_SEARCH_ATLAS` references remain; only expected `term_mappings` / `TicketFAQItem` references remain.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed.
- Desktop browser check at `http://127.0.0.1:3003/systems/support-ticket-deflection/demo` — page loaded, no framework overlay, content rendered, searching `edit workflows without admin access` returned the contract-shaped card with source evidence and `when_to_contact_support`.
- Mobile browser check at 390px — page loaded, no framework overlay, contract-shaped card rendered, and no horizontal overflow (`scrollWidth: 375`, `innerWidth: 390`).
- `git diff --check` — passed.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| Plan doc | ~108 |
| Demo data contract | ~636 |
| Demo renderer | ~144 |
| Demo API route | ~149 |
| Demo page copy | ~14 |
| Total | ~1051 |

The slice may exceed the 400-LOC soft cap because the local demo fixture needs
to carry the full product item shape instead of a flattened projection. Keeping
the fixture and renderer together is the indivisible part: otherwise the page
continues to imply a shape it does not actually render.
