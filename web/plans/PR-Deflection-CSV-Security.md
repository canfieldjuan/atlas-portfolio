## Why this slice exists

To keep customer data safer and keep customers at ease when we ask for their Zendesk ticket CSV, we need to clarify the security processes of the Deflection Report CSV intake. This involves adding truthful security detail to the main Security page, linking to it directly from the CSV intake page, and implementing best-effort client-side scrubbing for common contact identifiers in the CSV body before upload.

## Scope (this PR)

Slice phase: Product polish

1. Update the `/security` page with a dedicated section about Deflection Report CSV processing, detailing the browser-to-blob upload, scoped 30-day cleanup for CSV/submission records, deterministic clustering, best-effort CSV body minimization, and managed storage controls without absolute privacy guarantees.
2. Implement client-side PII scrubbing in the CSV upload component for common emails, formatted phone numbers, and IP addresses before the CSV is uploaded to Vercel Blob.
3. Update the CSV intake page to include links pointing to the `/security` page next to the file input and in the privacy disclosure.
4. Fail closed if the CSV cannot be safely decoded and scrubbed, and use a generic upload filename so contact identifiers in the local filename are not sent as metadata/path text.
5. Extend the existing CSV privacy contract test to lock the fail-closed path, generic filename, and narrowed public claims.

### Files touched

- `web/plans/PR-Deflection-CSV-Security.md` — plan contract for this slice.
- `web/src/app/security/page.tsx` — Add a dedicated Deflection Report CSV security section.
- `web/src/components/landing/SupportTicketCsvIntakePage.tsx` — Add links to security details, client-side scrubbing logic, and UI explanations.
- `web/scripts/test-deflection-csv-privacy-contract.mjs` — Lock scoped public claims and fail-closed scrub behavior.

## Mechanism

- In `web/src/app/security/page.tsx`, we will append a new section after the primary options grid. This section will outline direct client-to-blob uploads (`access: 'private'`), scoped cleanup for uploaded CSVs/submission records, deterministic processing, best-effort local contact-identifier scrubbing, and managed storage controls without claiming all PII is removed or all generated report data is deleted by this repo.
- In `web/src/components/landing/SupportTicketCsvIntakePage.tsx`, we will:
  - Implement a `scrubPii` helper function that matches common emails, formatted phone numbers, and IPv4/IPv6 addresses using regular expressions.
  - Intercept the upload flow to decode UTF-8 CSV bytes with a fatal decoder, reject likely UTF-16 exports, run the scrubbing function, and generate a new `File` / `Blob` with a generic filename before sending it to `@vercel/blob`.
  - Stop the submission with a visible error if decoding or scrubbing fails, rather than uploading the raw file.
  - Add a link to `/security` to the CSV upload helper description (`csv-hint` and the bottom disclosure text).
  - Add a dedicated info block for "Local PII Scrubbing" alongside the "100% Deterministic Engine" card.
- In `web/scripts/test-deflection-csv-privacy-contract.mjs`, we will add source-contract assertions for fail-closed scrub handling, UTF-8 decode gating, generic filenames, and removal of absolute public claims.

## Intentional

- **Best-Effort Scrubbing**: Regex scrubbing is a defense-in-depth layer for common contact identifiers in the CSV body. It does not claim to remove all names, account numbers, addresses, or free-text identifiers.
- **Fail-Closed Upload**: If reading or scrubbing the file throws an error, the pipeline blocks the upload and tells the user to export a UTF-8 CSV. This is intentionally stricter than preserving submissions at all costs.
- **Encoding Boundary**: UTF-16 and non-UTF-8 exports are rejected instead of rewritten, because rewriting unknown encodings would risk corrupting the ticket text used for deterministic analysis.
- **No New Backend Logic**: We keep the backend API logic intact, ensuring high stability.

## Deferred

Parked hardening: none

## Verification

1. `npm --prefix web run test:deflection-csv-privacy` — verify the CSV privacy contract, scoped security claims, UTF-8 scrub gate, generic filename, and fail-closed handling.
2. `rg -n "No PII ever leaves your browser|automatically and completely deleted|AES-256|zero training data leaks|using raw file" web/src web/scripts web/plans` — confirm stale absolute claims and fail-open copy are absent from runtime source; remaining hits are the guard assertions in the privacy contract test and this verification command.
3. `npm --prefix web run lint` — verify no eslint errors.
4. `npm --prefix web run build` — verify successful next compilation.
5. `bash scripts/local_pr_review.sh` — run full PR review suite.

## Estimated diff size

| Section | Size |
|---|---|
| web/plans/PR-Deflection-CSV-Security.md | ~70 |
| web/src/app/security/page.tsx | ~50 |
| web/src/components/landing/SupportTicketCsvIntakePage.tsx | ~110 |
| web/scripts/test-deflection-csv-privacy-contract.mjs | ~35 |
| Total | ~265 |
