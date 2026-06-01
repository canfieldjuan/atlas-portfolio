# Deflection browser upload live validation

Use this runbook when validating the production support-ticket deflection intake
form in a real browser. It complements the Node smoke:

```bash
npm --prefix web run smoke:deflection-browser-upload -- --verify-results ...
```

The Node smoke proves the route contract. This browser run proves the actual
customer path: form state, file input, browser-to-Blob upload, CORS, record
submission, and redirect.

## Inputs

- URL: `https://juancanfield.com/systems/support-ticket-deflection/intake`
- CSV fixture: `/home/juan-canfield/Desktop/deflection-test-upload.csv`
- Lead fields:
  - name: `Deflection Browser Smoke`
  - email: `ops@example.com`
  - company: `Effingham Office Maids`
  - platform: `HelpScout`

The fixture is synthetic. Do not use a customer CSV for this validation.

## Browser setup

Some Linux agent environments require Chromium's sandbox to be disabled:

```bash
agent-browser close --all >/dev/null 2>&1 || true
agent-browser --args "--no-sandbox" open https://juancanfield.com/systems/support-ticket-deflection/intake
agent-browser wait --load networkidle
agent-browser snapshot -i
```

## Fill the form

Use the refs from `snapshot -i`; the exact numbers can change between page
loads.

```bash
agent-browser fill @name_ref "Deflection Browser Smoke"
agent-browser fill @email_ref "ops@example.com"
agent-browser fill @company_ref "Effingham Office Maids"
agent-browser select @platform_ref helpscout
agent-browser upload @csv_ref /home/juan-canfield/Desktop/deflection-test-upload.csv
agent-browser snapshot -i
```

Before submitting, the snapshot should show:

- `Deflection Browser Smoke`
- `ops@example.com`
- `Effingham Office Maids`
- `HelpScout`
- `deflection-test-upload.csv`

## Submit

First try the visible submit button:

```bash
agent-browser click @submit_ref
agent-browser wait 10000
```

If automation stays on the intake page and `agent-browser network requests
--filter gap-report-intake` shows no requests, use the native form submit path:

```bash
agent-browser eval --stdin <<'EOF'
const select = document.querySelector('#supportPlatform');
select.value = 'helpscout';
select.dispatchEvent(new Event('input', { bubbles: true }));
select.dispatchEvent(new Event('change', { bubbles: true }));
document.querySelector('form').requestSubmit();
EOF
agent-browser wait 15000
```

That fallback is for automation only. A manual customer click remains the
product path.

## Pass checks

Run:

```bash
agent-browser get url
agent-browser get text body
agent-browser errors
agent-browser console
agent-browser network requests --filter gap-report-intake
```

Pass requires:

- URL matches
  `https://juancanfield.com/systems/support-ticket-deflection/results/<content-ops-request-id>`.
- Network shows:
  - `POST https://juancanfield.com/api/gap-report-intake/upload` -> `200`
  - `POST https://juancanfield.com/api/gap-report-intake/record` -> `200`
- Page text includes:
  - `YOUR DEFLECTION SNAPSHOT`
  - `We found`
  - `Unlock your full Backlog Report`
- `agent-browser errors` returns empty output.
- `agent-browser console` returns no CORS, Blob, or application errors.

## Latest validation

Production validation passed on June 1, 2026:

- Redirect:
  `https://juancanfield.com/systems/support-ticket-deflection/results/content-ops-42af1d7eb1e14897bfb7f543c66464c5`
- Network:
  - `/api/gap-report-intake/upload` -> `200`
  - `/api/gap-report-intake/record` -> `200`
- Render:
  - locked snapshot page loaded
  - `YOUR DEFLECTION SNAPSHOT` present
  - `We found 7 repeat questions hiding in your queue.` present
  - `Unlock your full Backlog Report` present
- Browser errors: none.
- Console errors: none.

## Cleanup

```bash
agent-browser close --all
```
