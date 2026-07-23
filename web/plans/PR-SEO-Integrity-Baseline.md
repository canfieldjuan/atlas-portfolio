## Why this slice exists

The site's SEO foundations exist, but four integrity defects make their rendered output less trustworthy: route-specific breadcrumbs are emitted from ancestor layouts and therefore leak into descendants; obsolete `FAQPage` markup survived Google's May 2026 removal of FAQ rich results; the sitemap assigns build time as `lastModified` for static pages and omits the public `/security` route; and a JSX line break collapses the homepage text boundary from `into AI` to `intoAI` in the DOM.

Root cause: schema ownership, sitemap truth, and text-boundary invariants are not enforced together. The correct fix must move route-specific breadcrumb ownership to leaf/index surfaces, remove obsolete FAQ markup without removing visible FAQs, make sitemap dates evidence-based, restore the DOM whitespace, and add a deterministic regression test. This fixes the roots rather than suppressing rendered symptoms.

Problem-derived contract:

- Each public route emits at most one intended breadcrumb trail, owned by the route that trail describes.
- Production source emits no `FAQPage` markup or FAQ generator, while visible FAQ content stays unchanged.
- The sitemap contains each intended public URL once, includes `/security`, excludes private routes, and only supplies truthful resource publication dates.
- The homepage DOM preserves the existing visible words and layout while exposing the `into AI` text boundary.
- Existing metadata, canonicals, routes, pricing, CTAs, promises, noindex behavior, and visual layout do not change.

This is production hardening because the buyer-visible flows already exist; the slice repairs machine-readable integrity and guards it against regression.

The diff exceeds the 400-LOC soft cap because removing the obsolete schema requires deleting every FAQ payload while preserving each separately rendered FAQ section, and the breadcrumb root cause spans four ancestor layouts plus five owning routes. Splitting those mechanical removals would knowingly leave the same rendered integrity defect active between PRs.

## Scope (this PR)

Slice phase: Production hardening

1. Move breadcrumbs from four ancestor layouts to their matching index/leaf surfaces.
2. Remove obsolete FAQ JSON-LD while retaining all visible FAQ sections and copy.
3. Correct sitemap coverage and modification-date semantics.
4. Preserve the homepage text-node word boundary without changing layout.
5. Extend the existing JSON-LD test enrollment to cover the combined SEO integrity invariant.

### Files touched

- `.github/workflows/pre_push_audit.yml` — rename the enrolled test step to describe the broader integrity suite.
- `web/package.json` — run the SEO integrity test through the existing JSON-LD test command.
- `web/plans/PR-SEO-Integrity-Baseline.md` — define this slice and its verification contract.
- `web/src/app/HomeClient.tsx` — preserve whitespace after the existing line break.
- `web/src/app/ai-automation-consultant/page.tsx` — remove obsolete FAQ JSON-LD only.
- `web/src/app/resources/layout.tsx` — stop emitting a route-specific breadcrumb from the ancestor layout.
- `web/src/app/resources/page.tsx` — emit the resources index breadcrumb at its owning route.
- `web/src/app/services/page.tsx` — remove obsolete FAQ JSON-LD only.
- `web/src/app/sitemap.ts` — add `/security` and remove untruthful static modification dates.
- `web/src/app/systems/ai-content-ops/layout.tsx` — stop emitting a route-specific breadcrumb from the ancestor layout.
- `web/src/app/systems/ai-content-ops/ongoing-support/page.tsx` — remove obsolete FAQ JSON-LD only.
- `web/src/app/systems/ai-content-ops/page.tsx` — emit the AI Content Ops index breadcrumb at its owning route.
- `web/src/app/systems/atlas-llm-gateway/page.tsx` — remove obsolete FAQ JSON-LD only.
- `web/src/app/systems/layout.tsx` — stop emitting a route-specific breadcrumb from the ancestor layout.
- `web/src/app/systems/page.tsx` — emit the systems index breadcrumb at its owning route.
- `web/src/app/systems/support-ticket-deflection/landingConfig-v2.tsx` — replace FAQ schema with the owning route's breadcrumb.
- `web/src/app/systems/support-ticket-deflection/layout.tsx` — stop emitting a route-specific breadcrumb from the ancestor layout.
- `web/src/app/systems/support-ticket-deflection/partner/PartnerDeflectionLandingClient.tsx` — keep the private partner surface from inheriting public structured data.
- `web/src/app/systems/support-ticket-deflection/snapshot/page.tsx` — emit the snapshot leaf breadcrumb.
- `web/src/lib/deflection-public-reachability-smoke.test.mjs` — assert the partner surface omits structured data while keeping its visible FAQ.
- `web/src/lib/json-ld.test.ts` — reset the sink-count baseline after removing obsolete FAQ scripts.
- `web/src/lib/seo-integrity.test.ts` — enforce sitemap, schema ownership, obsolete FAQ, and text-boundary invariants.
- `web/src/lib/seo.ts` — remove the obsolete FAQ JSON-LD generator.

## Mechanism

Breadcrumb JSON-LD is removed from layouts that wrap descendants and added to the index or leaf component that owns each route. Existing child layouts with complete leaf trails remain unchanged. The support-ticket-deflection public config receives its own breadcrumb, while the noindex partner config explicitly supplies no structured data.

FAQ arrays and rendered FAQ sections stay in place; only `generateFaqJsonLd`, its imports, generated constants, and JSON-LD scripts are removed. Static sitemap entries omit `lastModified` because no authoritative content-update date exists; resource entries retain their published dates. A focused source-and-module test locks these decisions into the existing CI-enrolled JSON-LD command.

## Intentional

- No visible FAQ, headline, pricing, CTA, route, or positioning change is included.
- Existing sitemap `changeFrequency` and `priority` values remain even though Google ignores them; this slice only fixes factual integrity and coverage.
- Resource `lastModified` continues to use `publishedAt` because that is the repository's authoritative date.
- Existing leaf breadcrumb layouts are not refactored.
- No new test command or workflow is introduced; the existing JSON-LD enrollment is widened to avoid parallel test infrastructure.

## Deferred

- Search demand, ranking, traffic, Core Web Vitals field data, and content-strategy changes require Search Console, analytics, or separately approved product-shape work.
- Programmatic SEO pages remain out of scope unless defensible data, validated demand, unique page value, and operator consent exist.
- Existing `HARDENING.md` entry `DEFLECTION-SNAPSHOT-DEVSERVER-1` remains parked: webpack dev mode fails on the Snapshot route's pre-existing transitive `node:crypto` import, while the production build and server pass.

Parked hardening: none

## Verification

- `npm --prefix web run test:json-ld-escaping` — passed, 2 files / 8 tests.
- `npm --prefix web run test:deflection-public-reachability-smoke` — passed, 1 file / 18 tests.
- `npm --prefix web run lint` — passed.
- `npm --prefix web run build` — passed; 48 static/dynamic routes generated and TypeScript completed.
- Production-server browser audit — passed for all 27 sitemap URLs: each loaded with content, one H1, its canonical, parseable JSON-LD, zero `FAQPage`, no error overlay, and at most one `BreadcrumbList`.
- Representative browser checks — passed: five public FAQ surfaces retained visible FAQ text without FAQ schema; the noindex partner surface retained its FAQ with only root JSON-LD; the homepage H1 exposed the `into AI` word boundary.
- `git diff --check` — passed.
- `rg -n 'FAQPage|generateFaqJsonLd|const now = new Date\\(\\)' web/src --glob '!**/*.test.*'` — no production-source matches.
- `bash scripts/local_pr_review.sh` — passed: plan shape/files/diff-size, real-adapter audit, zero-finding dead-code baseline, 4 Snapshot smoke tests, ESLint, 48-route Next build/TypeScript, and whitespace.

## Estimated diff size

| Area | Estimated LOC |
|---|---:|
| Plan and test coverage | ~190 |
| Route/schema ownership corrections | ~310 |
| Sitemap and DOM integrity corrections | ~50 |
| Total | ~550 |

The slice exceeds the 400-LOC soft cap. Its multi-file footprint is mechanical because one rendered invariant spans every current FAQ and ancestor-breadcrumb emitter; the implementation adds no visible product behavior.
