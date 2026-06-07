# Deflection Snapshot landing monitor

Use this runbook when the scheduled production Snapshot landing monitor opens or
updates the GitHub issue titled `Deflection Snapshot landing monitor failing`.

The monitor workflow is `.github/workflows/deflection_snapshot_landing_monitor.yml`.
It fetches the public Snapshot page only:

```text
https://juancanfield.com/systems/support-ticket-deflection/snapshot
```

It does not call ATLAS, Stripe, Vercel Blob, or private APIs.

## What the issue means

The monitor issue means the production page failed one of these checks:

- the page did not return a successful HTTP response;
- the page rendered a Next.js error or 404 marker;
- one of the Snapshot offer markers was missing;
- a paid-report-first regression marker appeared.

The workflow adds this hidden marker to the issue body or comment:

```text
<!-- deflection-snapshot-landing-monitor -->
```

It also includes the workflow name, run URL, base URL, and commit SHA for the
failed run.

## First response

1. Open the linked Actions run from the issue.
2. Download the `deflection-snapshot-landing-smoke` artifact.
3. Read `deflection-snapshot-landing-smoke.json`.
4. Identify the failure stage:
   - `fetch` means the page did not return a usable HTTP response.
   - `render` means the page returned HTML but failed marker validation.
5. Check whether the failure was on the scheduled production run or a manual
   `workflow_dispatch` run against another base URL.

For `render` failures, inspect the `missing` and `forbidden` arrays in the JSON
artifact before changing code. The arrays are the contract that failed.

## Manual rerun

After checking the route or applying a fix, rerun the monitor manually:

```bash
gh workflow run deflection_snapshot_landing_monitor.yml \
  -f base_url=https://juancanfield.com
```

Then watch the latest run:

```bash
gh run list --workflow deflection_snapshot_landing_monitor.yml --limit 5
```

If you need to test a production-like host before DNS or deployment promotion,
override the base URL:

```bash
gh workflow run deflection_snapshot_landing_monitor.yml \
  -f base_url=https://atlas-portfolio.example.vercel.app
```

Use HTTPS for public hosts. Local override URLs may use `http://localhost` or
`http://127.0.0.1`; the smoke rejects non-HTTPS protocols for non-local hosts.

## Manual page check

Before closing the issue, inspect the production route directly:

```bash
curl -fsS https://juancanfield.com/systems/support-ticket-deflection/snapshot >/tmp/deflection-snapshot-page.html
```

Confirm the page still sells the free Deflection Snapshot first and links to:

```text
/systems/support-ticket-deflection/intake
```

This route is a landing page. Do not submit a CSV, start Checkout, or call ATLAS
as part of this monitor runbook.

## Duplicate issues

The workflow searches GitHub issues before creating a new one, but GitHub search
indexing can lag. If two failures happen close together, duplicate issues can
appear.

When that happens:

1. Keep the issue with the most complete failure history.
2. Copy any unique run links from the duplicate into the kept issue.
3. Close the duplicate as superseded.

## Close criteria

Close the issue only after all of these are true:

- the latest scheduled or manual monitor run is green;
- the production Snapshot route has been manually inspected;
- the failure cause is understood or documented in the issue;
- any duplicate failure issues have been consolidated.

Do not auto-close on the first green run if the page has not been inspected. A
green marker smoke proves the route contract; it does not replace judgment about
whether the page still presents the offer correctly.

## Escalation

If the route is returning 5xx, investigate Vercel deployment health first. If the
route is returning valid HTML with missing markers, inspect recent landing-page
copy or component changes before changing the smoke contract.

External alerting beyond GitHub issues remains a separate operations follow-up.
