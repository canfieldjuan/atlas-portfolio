# PR-Deflection-Intake-Deterministic-Badge-1367

## Why this slice exists

Issue #1367 requests the support-ticket deflection intake form copy to align
with deterministic messaging and to include a visible trust badge. The live
intake page still used earlier "upload your CSV" framing and only buried the
deterministic claim in helper text. This slice makes the deterministic promise
explicit at the hero and upload section while preserving the existing upload,
recording, and redirect mechanics.

## Scope (this PR)

Slice phase: Product polish

1. Reframe the intake eyebrow/headline/body copy toward deterministic FAQ
   deflection messaging.
2. Add the exact "100% Deterministic Engine" trust badge block inside the CSV
   intake section.
3. Update intake metadata title/description to match the deterministic framing.
4. Update public reachability smoke markers/tests to enforce the new intake
   copy and badge.
5. Keep form fields, submit CTA text, upload behavior, record API behavior,
   and results routing unchanged.

### Files touched

- `web/plans/PR-Deflection-Intake-Deterministic-Badge-1367.md` - plan contract
  for this slice.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` - intake hero
  copy + deterministic trust badge block.
- `web/src/app/systems/support-ticket-deflection/intake/layout.tsx` - intake
  metadata title/description alignment.
- `web/scripts/smoke-deflection-public-reachability.mjs` - reachability marker
  contract update for intake headline/badge.
- `web/scripts/test-deflection-public-reachability-smoke.mjs` - fixture and
  assertions aligned to the updated intake headline/badge markers.

## Mechanism

The update is intentionally copy-only plus smoke-contract alignment:

- The intake component keeps its existing state machine, validation, Blob
  upload, `/api/gap-report-intake/record` submit path, and post-submit behavior.
- Hero framing changes from generic upload language to deterministic FAQ-audit
  language.
- A trust badge block is added immediately under the CSV helper copy so the
  deterministic/no-LLM claim is explicit at upload-time.
- Reachability smoke markers and tests are updated so CI fails if the new hero
  or badge copy disappears.

## Intentional

- The submit CTA remains `Upload CSV, get your free Deflection Snapshot` to
  avoid changing funnel tracking labels in this slice.
- No API, analytics payload, or pricing variant logic changes are included.
- No partner-page or snapshot-page copy changes are included; this is intake
  route scope only.

## Deferred

- Any follow-on CTA/analytics label unification (if desired) is deferred to a
  separate slice so this issue stays copy-trust scoped.

Parked hardening: none.

## Verification

- `cd /home/juan-canfield/Desktop/atlas-portfolio/web && node scripts/test-deflection-public-reachability-smoke.mjs` - passed.
- `cd /home/juan-canfield/Desktop/atlas-portfolio && rg -n "Upload your tickets\\. Get the repeat-question snapshot in seconds\\.|UPLOAD YOUR CSV|analysis is 100% deterministic, no AI\\." web || true` - no matches in active `web/` code.
- `cd /home/juan-canfield/Desktop/atlas-portfolio/web && rg -n "FAQ DEFLECTION INTAKE|Start a deterministic FAQ gap audit\\.|100% Deterministic Engine" src scripts` - confirmed expected new marker strings are present in source and smoke tests.

## Estimated diff size

| File | LOC |
|---|---:|
| `web/plans/PR-Deflection-Intake-Deterministic-Badge-1367.md` | ~86 |
| `web/src/components/landing/SupportTicketCsvIntakePage.tsx` | ~18 |
| `web/src/app/systems/support-ticket-deflection/intake/layout.tsx` | ~4 |
| `web/scripts/smoke-deflection-public-reachability.mjs` | ~3 |
| `web/scripts/test-deflection-public-reachability-smoke.mjs` | ~9 |
| Total | ~120 |
