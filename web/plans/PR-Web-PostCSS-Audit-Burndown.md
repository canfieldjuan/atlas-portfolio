## Why this slice exists

#313 still has one parked dependency-security gap after the high-severity npm
audit burndown: `npm --prefix web audit --audit-level=moderate` reports the
vendored `next -> postcss@8.4.31` advisory (`GHSA-qx2v-qp2m-jg93`). The current
latest `next@16.2.9` still depends on `postcss@8.4.31`, and npm's suggested
auto-fix is a breaking downgrade to `next@9.3.3`, so a Next version bump is not
available for this slice.

This slice closes the parked finding with an npm PostCSS override to the patched
line and proves the existing Next build still works.

## Scope (this PR)

Slice phase: Production hardening

1. Add an npm override so every transitive `postcss` dependency resolves to the
   already-present patched `8.5.12` line.
2. Refresh `web/package-lock.json` so installs are deterministic.
3. Mark `NPM-AUDIT-WEB-1` resolved in `HARDENING.md` only if the moderate audit
   passes.

### Files touched

- `HARDENING.md` — mark the parked dependency-audit finding resolved.
- `web/package-lock.json` — lock the patched transitive PostCSS resolution.
- `web/package.json` — add the targeted npm override.
- `web/plans/PR-Web-PostCSS-Audit-Burndown.md` — plan for this slice.

## Mechanism

`web/package.json` gets an `overrides.postcss` entry. `npm install` refreshes
the lockfile so Next no longer installs a nested vulnerable
`node_modules/next/node_modules/postcss`; it dedupes to the top-level patched
`postcss@8.5.12` already compatible with Tailwind's PostCSS adapter.

The slice does not change application code. Verification must prove both the
security target and runtime compatibility: `npm audit --audit-level=moderate`
must pass, `npm ls next postcss` must show the override in effect, and the
existing local review gate must still build the Next app.

## Intentional

- This uses `overrides` instead of changing `next`, because the current latest
  Next release still declares the vulnerable PostCSS version and npm's suggested
  fix is a breaking downgrade.
- The override is global for PostCSS because the nested `next` override form
  still left the stale package installed locally. The app already had
  `postcss@8.5.12` through `@tailwindcss/postcss`, so this dedupes to the same
  patched line.

## Deferred

- Remove the override once Next ships a stable release that directly depends on
  patched PostCSS.
- Parked hardening: none.

## Verification

```bash
npm --prefix web audit --audit-level=moderate # PASS
npm --prefix web ls next postcss --depth=3 # PASS — Next dedupes to postcss@8.5.12
npm --prefix web run lint # PASS
bash scripts/local_pr_review.sh # PASS
```

## Estimated diff size

| Area | Estimated LOC |
| --- | ---: |
| Plan doc | ~65 |
| package.json / lockfile | ~25 |
| HARDENING.md | ~10 |
| Total | ~100 |
