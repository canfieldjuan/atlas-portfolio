import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const resultsPageUrl = new URL(
  '../src/components/landing/DeflectionResultsPage.tsx',
  import.meta.url,
);
const snapshotFixtureUrl = new URL('../src/lib/deflection-snapshot.ts', import.meta.url);

const resultsSource = await readFile(resultsPageUrl, 'utf8');
const snapshotSource = await readFile(snapshotFixtureUrl, 'utf8');

assert.equal(
  resultsSource.includes('Sample Drafted Answer'),
  false,
  'Deflection results teaser must not regress to the static pre-rank label.',
);
assert.match(
  resultsSource,
  /function\s+teaserAnswerLabel\s*\(\s*answer:\s*DeflectionSnapshotFullAnswer\s*\)/,
  'Deflection results page should keep the rank-aware teaser label helper.',
);
assert.match(
  resultsSource,
  /answer\.rank\s*===\s*1/,
  'The #1 most-asked teaser copy must be gated on answer.rank === 1.',
);
assert.match(
  resultsSource,
  /Sample answer for your #1 most-asked question/,
  'The rank-1 teaser label should remain explicit.',
);
assert.match(
  resultsSource,
  /Sample answer for ranked question #\$\{answer\.rank\}/,
  'The fall-through teaser label should render the real rank.',
);
assert.match(
  resultsSource,
  /\{teaserAnswerLabel\(answer\)\}/,
  'TeaserAnswer should render the helper output, not a static label.',
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
