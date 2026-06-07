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

const teaserSource = await readFile(teaserComponentUrl, 'utf8');
const resultsSource = await readFile(resultsPageUrl, 'utf8');
const landingSource = await readFile(landingPageUrl, 'utf8');
const snapshotSource = await readFile(snapshotFixtureUrl, 'utf8');

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

assert.match(
  snapshotSource,
  /full_answer:\s*\{\s*rank:\s*1,\s*question:\s*'How do I cancel my subscription\?'/s,
  'The demo snapshot should model the current ATLAS rank-1 full teaser default.',
);
assert.match(
  snapshotSource,
  /previews:\s*\[\s*\{\s*rank:\s*2,/s,
  'The first demo teaser preview should start after the rank-1 full answer.',
);

console.log('Deflection teaser rank-copy guard passed.');
