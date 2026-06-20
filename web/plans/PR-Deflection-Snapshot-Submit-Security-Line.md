# PR-Deflection-Snapshot-Submit-Security-Line

## Why this slice exists

The support-platform helper text under the dropdown implies that choosing a
provider keeps the report path compatible with the export format. The platform
value is real metadata and is forwarded downstream, but that helper text
overstates what the field does and adds visual noise. The user also wants a
small security reassurance visible near the submit action, above the fold on
desktop, without removing required intake fields.

## Scope (this PR)

Slice phase: Product polish

1. Remove the support-platform helper sentence under the provider dropdown.
2. Add a compact deterministic/security reassurance directly below the submit
   button in the intake card.
3. Keep company name and support platform fields required.
4. Preserve form validation, upload behavior, smoke markers, and the existing
   trust panel below the form.

### Files touched

- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` - remove provider helper copy and add submit-adjacent security line.
- `web/plans/PR-Deflection-Snapshot-Submit-Security-Line.md` - plan contract for this slice.

## Mechanism

The support-platform select keeps its label, options, required validation, and
error aria target, but no longer points at the removed helper paragraph. The
submit block gains a small icon-and-mono reassurance line using claims grounded
in the current intake path: deterministic processing, private upload storage,
and no generative AI analysis.

## Intentional

- Company name and support platform remain in place because both are still used
  by the intake record and downstream submit path.
- The new line avoids unverified infrastructure claims such as VPC isolation.
- No backend, upload, validation, or data-handling changes.

## Deferred

PII/backend scrubbing, stronger storage claims, field-count reductions, and
copy rewrites remain deferred to their dedicated lanes.

Parked hardening: none.

## Verification

- `npm --prefix web ci` - passed; npm reported 6 existing audit
  vulnerabilities.
- `npm --prefix web run test:deflection-snapshot-landing-smoke` - passed.
- `npm --prefix web run lint` - passed.
- `npm --prefix web run smoke:deflection-snapshot-landing -- --base-url http://127.0.0.1:3135`
  - passed against the local Snapshot route.
- `npm --prefix web run build` - passed.
- Browser check at
  `http://127.0.0.1:3135/systems/support-ticket-deflection/snapshot` - passed:
  desktop screenshot `/tmp/deflection-submit-security-line-desktop-tight.png`
  and mobile screenshot `/tmp/deflection-submit-security-line-mobile-tight.png`
  both had no horizontal overflow, the old provider helper was absent, and the
  new submit-adjacent security line was present.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | LOC |
|---|---:|
| **Total** | **~82** |
