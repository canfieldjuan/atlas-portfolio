# PR-Macro-Writeback-Upsell

## Why this slice exists

The Deflection Report intake flow successfully captures CSVs, but currently ends at a simple "CSV received" confirmation screen. We are leaving revenue on the table by not offering the logical next step: Macro-writeback (publishing the generated FAQ answers directly back into the user's support tool). We need to present this upsell at the moment of highest intent (immediately post-upload) without adding friction to the core free-report conversion.

## Scope (this PR)

Slice phase: Product polish

1. Modify the success state of the CSV intake form to include an "Optional Add-on" card offering Macro-writeback.
2. Dynamically inject the user's selected support platform (e.g., Zendesk, Intercom) from the form state into the upsell copy to increase relevance.
3. Add a CTA button for the $499 setup offer.

### Files touched

- `web/src/components/landing/SupportTicketCsvIntakePage.tsx`
- `web/plans/PR-Macro-Writeback-Upsell.md`

## Mechanism

- In `SupportTicketCsvIntakePage.tsx`, within the `if (submission.phase === 'success')` block, append a new `div` below the existing confirmation message.
- The card will read the existing `supportPlatform` state variable (which holds values like `zendesk`, `intercom`, etc.) and conditionally render the headline (e.g., `Push answers back to Zendesk as Macros` vs `Intercom as Saved Replies`).
- The copy explains that Macro-writeback "closes the loop" by turning generated FAQs into ready-to-use agent macros.

## Intentional

- **Post-submission placement:** The upsell is placed *after* the CSV upload succeeds. This ensures the core conversion (getting the CSV for the deflection report) is never jeopardized by premature sales friction.
- **Same-page reveal:** The upsell is revealed on the same page rather than redirecting to a new route. This avoids a page-load hop, keeps the experience seamless, and allows us to easily use the `supportPlatform` state that is already in memory.

## Deferred

- Live commerce integration: The CTA will initially be a placeholder (e.g., an email trigger or simple interest capture) until the Stripe payment link is ready.
- A standalone Macro-writeback landing page (we can send direct checkout links in follow-up emails instead of building a whole separate sales page).

Parked hardening: none

## Verification

```bash
npm --prefix web run build
npm --prefix web run lint
```

Visual check: 
1. Navigate to the local dev server intake route.
2. Select "Zendesk" from the support platform dropdown.
3. Upload a test CSV and submit.
4. Verify the success screen renders the new add-on card and correctly says "Zendesk as Macros".

## Estimated diff size

| File | ~LOC |
|---|---|
| `web/src/components/landing/SupportTicketCsvIntakePage.tsx` | ~45 |
| `web/plans/PR-Macro-Writeback-Upsell.md` | ~55 |
| **Total** | ~100 |
