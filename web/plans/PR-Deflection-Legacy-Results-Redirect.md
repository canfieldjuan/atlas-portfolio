# PR-Deflection-Legacy-Results-Redirect

## Why this slice exists

The #1440 live proof found two portfolio-side result URL failures. PR
`PR-Deflection-Results-Unavailable-State` closed the canonical
`/systems/support-ticket-deflection/results/{request_id}` raw-500 failure. The
remaining portfolio-side URL issue is the stale
`/services/faq-deflection/results/{request_id}` path, which still returns 404
for old probes/bookmarks.

The root is URL compatibility after the FAQ Report was rebranded to Support
Ticket Deflection. This is a known URL-structure change, so the upstream fix is
a config-level redirect that runs before rendering, not a duplicate App Router
page.

## Scope (this PR)

Slice phase: Production hardening

1. Redirect legacy FAQ-deflection result URLs to the canonical Support Ticket
   Deflection result route.
2. Keep request IDs in the path; the canonical route continues to own validation
   and unavailable/snapshot rendering.
3. Add a CI-enrolled config contract test that loads the real Next config and
   proves the redirect entry exists.

### Files touched

- `web/plans/PR-Deflection-Legacy-Results-Redirect.md` - plan doc.
- `web/next.config.ts` - legacy result URL redirect.
- `web/scripts/test-deflection-legacy-results-redirect.mjs` - config contract test.
- `web/package.json` - test script enrollment.
- `.github/workflows/pre_push_audit.yml` - CI enrollment for the new test script.

## Mechanism

`next.config.ts` already owns legacy URL redirects for retired/rebranded
deflection paths. This PR adds:

```ts
{
  source: '/services/faq-deflection/results/:requestId',
  destination: '/systems/support-ticket-deflection/results/:requestId',
  permanent: true,
}
```

Next applies config redirects before the route renders, so the stale path never
hits a 404 page. The request ID is passed through unchanged and the canonical
route remains the single render/fetch path.

## Intentional

- This is a permanent redirect because the FAQ-deflection result URL is retired,
  not an alternate live route.
- No new `/services/faq-deflection/results/[requestId]` App Router page. A page
  would duplicate compatibility logic downstream of the request-routing layer.
- This PR does not change canonical result rendering, snapshot fetching, paid
  unlock, or the hosted results smoke markers.

## Deferred

- Live hosted proof after deploy: request the stale URL and confirm it redirects
  to the canonical route, then update #1440 with the observed hosted status.
- Parked hardening: none.

## Verification

- `npm --prefix web run test:deflection-legacy-results-redirect` - passed.
- `node web/scripts/audit-test-enrollment.mjs` - passed; all 28 `test:*`
  scripts enrolled in `.github/workflows/pre_push_audit.yml`.
- `npm --prefix web run lint -- next.config.ts scripts/test-deflection-legacy-results-redirect.mjs` - passed.
- `npm --prefix web run build` - passed.
- `npm --prefix web run start -- -p 4317` +
  `curl -sS -D - -o /tmp/atlas-portfolio-legacy-redirect-body.txt 'http://localhost:4317/services/faq-deflection/results/content-ops-unit-123?checkout=success&priceVariant=partner'` -
  passed; observed `HTTP/1.1 308 Permanent Redirect` with `location:
  /systems/support-ticket-deflection/results/content-ops-unit-123?checkout=success&priceVariant=partner`.
- `bash scripts/local_pr_review.sh` - passed.

## Estimated diff size

| File | Estimate |
|---|---:|
| `web/plans/PR-Deflection-Legacy-Results-Redirect.md` | ~75 |
| `web/next.config.ts` | ~10 |
| `web/scripts/test-deflection-legacy-results-redirect.mjs` | ~80 |
| `web/package.json` | ~1 |
| `.github/workflows/pre_push_audit.yml` | ~3 |
| Total | ~169 |
