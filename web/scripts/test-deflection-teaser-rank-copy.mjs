import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const teaserComponentUrl = new URL(
  '../src/components/landing/DeflectionSnapshotTeaser.tsx',
  import.meta.url,
);
const resultsPageUrl = new URL('../src/components/landing/DeflectionResultsPage.tsx', import.meta.url);
const landingPageUrl = new URL(
  '../src/components/landing/DeflectionSnapshotLandingPage.tsx',
  import.meta.url,
);
const snapshotFixtureUrl = new URL('../src/lib/deflection-snapshot.ts', import.meta.url);
const generatedDemoUrl = new URL('../src/lib/deflection-demo-example.ts', import.meta.url);

const teaserSource = await readFile(teaserComponentUrl, 'utf8');
const resultsSource = await readFile(resultsPageUrl, 'utf8');
const landingSource = await readFile(landingPageUrl, 'utf8');
const snapshotSource = await readFile(snapshotFixtureUrl, 'utf8');
const generatedDemoSource = await readFile(generatedDemoUrl, 'utf8');
const demoSnapshot = parseGeneratedJsonExport(generatedDemoSource, 'DEMO_DEFLECTION_SNAPSHOT');

assert.equal(
  teaserSource.includes('Sample Drafted Answer'),
  false,
  'Deflection shared teaser must not regress to the static pre-rank label.',
);
assert.match(
  teaserSource,
  /function\s+teaserAnswerLabel\s*\(\s*answer:\s*DeflectionSnapshotFullAnswer\s*\)/,
  'Deflection shared teaser should keep the rank-aware teaser label helper.',
);
assert.match(
  teaserSource,
  /answer\.rank\s*===\s*1/,
  'The #1 most-asked teaser copy must be gated on answer.rank === 1.',
);
assert.match(
  teaserSource,
  /Sample answer for your #1 most-asked question/,
  'The rank-1 teaser label should remain explicit.',
);
assert.match(
  teaserSource,
  /Sample answer for ranked question #\$\{answer\.rank\}/,
  'The fall-through teaser label should render the real rank.',
);
assert.match(
  teaserSource,
  /\{teaserAnswerLabel\(answer\)\}/,
  'DeflectionTeaserAnswer should render the helper output, not a static label.',
);
assert.match(
  resultsSource,
  /<DeflectionTeaserAnswer\s+answer=\{fullTeaser\}/,
  'Deflection results page should render the shared teaser answer component.',
);
assert.match(
  landingSource,
  /<DeflectionTeaserAnswer\s+answer=\{teaser\.full_answer\}/,
  'Snapshot landing page should render the shared teaser answer component.',
);
assert.match(
  landingSource,
  /<DeflectionTeaserPreviewCard\s+key=\{preview\.rank\}\s+preview=\{preview\}/,
  'Snapshot landing page should render the shared teaser preview card.',
);
assert.equal(
  /function\s+AnswerTeaser|function\s+PreviewPill/.test(landingSource),
  false,
  'Snapshot landing page should not reintroduce bespoke teaser renderers.',
);

assert.ok(
  snapshotSource.includes("from './deflection-demo-example'"),
  'The demo snapshot should come from the generated ATLAS example.',
);
assert.equal(
  demoSnapshot.teaser.full_answer.rank,
  1,
  'The generated demo snapshot should keep rank 1 as the full teaser answer.',
);
assert.ok(
  demoSnapshot.teaser.previews[0].rank > demoSnapshot.teaser.full_answer.rank,
  'The first demo teaser preview should start after the rank-1 full answer.',
);

console.log('Deflection teaser rank-copy guard passed.');

function parseGeneratedJsonExport(source, name) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^export const ${escapedName} = JSON\\.parse\\((.*)\\) as `, 'm');
  const match = source.match(pattern);
  assert(match, `${name} should be exported as generated JSON.parse payload.`);
  return JSON.parse(JSON.parse(match[1]));
}
