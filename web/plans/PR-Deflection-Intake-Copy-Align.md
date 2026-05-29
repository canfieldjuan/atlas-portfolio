# Plan: Deflection intake copy align

## Why this slice exists

The support-ticket-deflection landing page now promises ranked repeat questions,
missing customer wording, and review-ready FAQ drafts built from resolved
replies. The intake page still uses older snapshot copy around "one file, five
fields" and "one sample self-service answer." After a visitor clicks the hero
CTA, the intake page should repeat the same offer shape without changing the
upload workflow.

## Scope (this PR)

Slice phase: Product polish

1. Align the intake page headline and intro with the current landing-page
   promise.
2. Align the intake page metadata title/description with the same promise.
3. Remove the now-unused sample-output copy prop from the intake page wiring.
4. Leave form fields, upload behavior, submit label, privacy/storage copy, and
   API behavior unchanged.

### Files touched

- `web/plans/PR-Deflection-Intake-Copy-Align.md` — plan contract for this slice.
- `web/src/app/systems/support-ticket-deflection/intake/layout.tsx` — intake metadata copy.
- `web/src/app/systems/support-ticket-deflection/intake/page.tsx` — remove now-unused sample-output copy prop.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` — intake headline and intro copy only.

## Mechanism

Update the static intake metadata and the visible hero copy inside the existing
`SupportTicketCsvIntakePage` component. The component is only used by
`/systems/support-ticket-deflection/intake`, so no new copy prop is needed. Since
the intro no longer interpolates the old sample-output label, remove that field
from the local copy type and page wiring.

## Intentional

The intake intro uses "a review-ready FAQ draft" in the singular because the free
snapshot offer still includes one sample draft, not the full paid report's full
draft set.

No privacy/storage claim changes are included. The parked
`DEFLECTION-INTAKE-PII-1` hardening item was considered, and this slice avoids
strengthening the private-data promise.

## Deferred

Adding the demo to the landing page, calculator alignment, calculator CTA,
navigation/footer distraction removal, form-field changes, submit-label changes,
and upload/privacy implementation remain out of scope.

Parked hardening: none.

## Verification

- `npm run lint` from `web` — passed.
- `npm run build` from `web` — passed; Next.js built all routes successfully.
- `git diff --check` — passed.
- `rg "One file\\. Five fields\\. 24 hours|Upload Your CSV — Deflection Snapshot Intake|Upload a CSV export of your last 3–6 months of closed support tickets|sampleOutputLabel|one sample self-service answer" web/src/app/systems/support-ticket-deflection/intake web/src/components/landing/SupportTicketCsvIntakePage.tsx web/plans/PR-Deflection-Intake-Copy-Align.md` — confirmed old intake copy and the removed copy prop are gone from active intake code; the old sample phrase remains only in this plan's rationale.
- Browser check at `http://localhost:3000/systems/support-ticket-deflection/intake` on the existing local dev server — page loaded, framework error overlay check returned `OK`, the new headline and review-ready draft intro are present, the old headline is absent, and `agent-browser errors` returned no page errors.
- Mobile browser check at 390px width — the intake page renders without horizontal overflow; `agent-browser errors` returned no page errors.
- `bash scripts/local_pr_review.sh` — passed.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan doc | ~74 |
| Intake metadata copy | ~4 |
| Intake page wiring | ~1 |
| Intake visible copy | ~9 |
| Total | ~88 |
