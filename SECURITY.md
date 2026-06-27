# Security Policy

## Supported Scope

Please report security issues that affect this repository or the deployed
website at `juancanfield.com`, including:

- Public website and server-rendered routes.
- API routes under `web/src/app/api/**`.
- Stripe checkout, paid report unlock, and payment-related flows.
- Admin intake surfaces.
- Support-ticket CSV upload, storage, report, and cleanup paths.

The separate ATLAS backend has its own implementation surface, but many
customer-data and payment flows cross both repositories. If you are not sure
which repo owns a finding, report it here and include enough context to route
it safely.

## Reporting a Vulnerability

Email vulnerability reports to `juan@juancanfield.com`.

Please include:

- A short description of the issue and affected URL, route, or file.
- Reproduction steps using non-sensitive test data.
- The impact you believe the issue creates.
- Any relevant screenshots or logs with secrets, customer data, and tokens
  removed.

Do not open a public GitHub issue for a vulnerability before there has been a
chance to review and fix it.

## Safe Testing

Please avoid:

- Accessing or downloading data that is not yours.
- Testing with real customer CSVs, payment cards, private keys, or credentials.
- Disruptive scanning, denial-of-service testing, or persistence.
- Social engineering or attempts to access accounts you do not control.

If a proof of concept needs a paid/report flow, describe the suspected issue in
the email first so we can coordinate a safe test path.

## Response Expectations

This project does not currently operate a paid bug bounty program or guarantee
a fixed response SLA. Reports are reviewed in good faith and prioritized by
severity, exploitability, and customer-data/payment impact.
