## Why this slice exists

To reduce friction and increase conversions for the Deflection Snapshot, we are moving the intake form directly onto the landing page so users don't have to click through to a separate intake route. By shrinking the form to only require Name, Company, and Email alongside the CSV upload, we lower the barrier to entry while maintaining our strong security messaging. We are also shifting the messaging from pure "deflection" to "resolving tickets", emphasizing that true deflection comes from resolution.

## Scope (this PR)

Slice phase: Product polish

1. Update the hero copy in `DeflectionSnapshotLandingPage`:
   - Change the eyebrow text to "Ticket Resolution Report".
   - Change the H1 heading to "Deflect tickets by actually resolving them."
2. Replace the `HeroProofPanel` ("What the audit finds") on the landing page with an inline version of the CSV intake form.
3. Remove the `<HeroUploadTrust />` ("How your upload is handled") component from under the CTA in the left column, and fold its security points directly into the new inline intake form.
4. Extract the intake form logic into a reusable `SupportTicketCsvIntakeForm` component that removes the "Support platform" dropdown from the UI (defaulting to `'other'` in the API payload) while retaining the Name, Company, Email, and CSV upload fields.
5. Revise the `<SnapshotArtifact />` card and surrounding copy across the page to pivot from pure "deflection" to "ticket resolutions."
6. **Evolve the Snapshot Contract**: Update `deflection-snapshot.ts` to include `top_blind_spots` (questions without resolution evidence) alongside `top_questions`.
7. **Surface Blind Spots**: Add a new UI block to the Snapshot artifact to display these unresolved, high-volume questions so users see the gaps their team cannot currently resolve.

### Files touched

- `web/plans/PR-Snapshot-Inline-Intake.md` — plan contract for this slice.
- `web/src/lib/deflection-snapshot.ts` — evolve the `DeflectionSnapshot` type to include `top_blind_spots` and rename the summary keys to `resolved_topic_count` / `unresolved_topic_count`.
- `web/src/components/landing/DeflectionSnapshotLandingPage.tsx` — update hero copy, replace the proof panel with the inline form, and revise artifact copy for the "resolution" pivot.
- `web/src/components/landing/DeflectionSnapshotRows.tsx` — (New/Updated) Add the `TopBlindSpots` UI component to render unresolved tickets alongside the drafted answers.
- `web/src/components/landing/DeflectionResultsPage.tsx` — Update type consumption to the new Snapshot contract, surface Top Blind Spots.
- `web/src/lib/deflection-snapshot-pdf.ts` — Update PDF generator to consume renamed schema variables.
- `web/src/lib/atlas-deflection-client.ts` — Update client fetcher mapper for the new snapshot fields.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` — extract the form logic into a reusable component.
- `web/src/components/landing/SupportTicketCsvIntakeForm.tsx` — (New) reusable form component with the 3 text fields, CSV upload, and folded-in security trust messaging.

## Mechanism

- In `web/src/components/landing/DeflectionSnapshotLandingPage.tsx`, modify the `Eyebrow` text and `h1` tag inside the hero section. Remove the `<HeroUploadTrust />` and `<PrimarySnapshotCta />` components in the hero, as the form itself is now the primary action in the right column.
- Remove the `<HeroProofPanel />` implementation from the hero layout and insert `<SupportTicketCsvIntakeForm />` in its place.
- In `DeflectionSnapshotLandingPage.tsx` and the `SnapshotArtifact`, rewrite the copy to focus on "ticket resolutions" (e.g. changing "Representative Deflection Snapshot" to "Representative Ticket Resolution Report").
- In the new `SupportTicketCsvIntakeForm` component (extracted from `SupportTicketCsvIntakePage.tsx`), remove the `supportPlatform` state and UI dropdown, hardcode `supportPlatform: 'other'` in the `handleSubmit` metadata payload, and add the private upload / no training / 30-day deletion trust points visually inside the form layout.

## Intentional

- **Defaulting Support Platform**: By removing the platform dropdown to shrink the form, we default the payload to `'other'` to satisfy the existing backend API contract without requiring a backend change.
- **Form-Integrated Trust**: Moving the trust points inside the form layout ensures users see the privacy guarantees exactly when they are asked to upload their data, preventing them from missing the context.

## Deferred

Parked hardening: none

## Verification

1. Check that the hero copy reflects the new messaging.
2. Verify that the form renders in the right column of the hero, the left column no longer has the standalone trust block, and the trust block is inside the form.
3. Submit a test CSV to ensure the PII scrubber and Vercel Blob upload work correctly with the hardcoded `'other'` support platform.
4. `npm --prefix web run lint`
5. `npm --prefix web run build`
6. `bash scripts/local_pr_review.sh`

## Estimated diff size

| Section | Size |
|---|---|
| web/plans/PR-Snapshot-Inline-Intake.md | ~70 |
| web/src/components/landing/DeflectionSnapshotLandingPage.tsx | ~80 |
| web/src/components/landing/SupportTicketCsvIntakePage.tsx | ~-350 |
| web/src/components/landing/SupportTicketCsvIntakeForm.tsx | ~430 |
| Total | ~930 |
