import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const rowComponentUrl = new URL(
  '../src/components/landing/DeflectionSnapshotRows.tsx',
  import.meta.url,
);
const resultsPageUrl = new URL('../src/components/landing/DeflectionResultsPage.tsx', import.meta.url);
const landingPageUrl = new URL(
  '../src/components/landing/DeflectionSnapshotLandingPage.tsx',
  import.meta.url,
);

const rowSource = await readFile(rowComponentUrl, 'utf8');
const resultsSource = await readFile(resultsPageUrl, 'utf8');
const landingSource = await readFile(landingPageUrl, 'utf8');

assert.match(
  rowSource,
  /export function DeflectionTopQuestionRows/,
  'Shared row component should export the top-question row renderer.',
);
assert.match(
  rowSource,
  /export function DeflectionLockedQuestionRows/,
  'Shared row component should export the locked-question row renderer.',
);
assert.match(
  rowSource,
  /export function DeflectionBlindSpotRows/,
  'Shared row component should export the blind-spot row renderer.',
);
assert.match(
  rowSource,
  /target phrase from your tickets/,
  'Shared top-question rows should keep the production target-phrase label.',
);
assert.match(
  rowSource,
  /const customerWording = question\.customer_wording\.trim\(\);/,
  'Shared top-question rows should trim customer wording before rendering the target phrase.',
);
assert.match(
  rowSource,
  /\{customerWording && \(/,
  'Shared top-question rows should not render empty target-phrase quotes.',
);
assert.match(
  rowSource,
  /Question text withheld/,
  'Shared locked-question rows should keep the production withheld-text label.',
);
assert.match(
  rowSource,
  /no proven answer found yet/,
  'Shared blind-spot rows should frame rows as unresolved support gaps.',
);
assert.match(
  rowSource,
  /Intl\.NumberFormat\('en-US'/,
  'Shared rows should pin number and currency formatting to en-US.',
);
assert.equal(
  rowSource.includes('toLocaleString()'),
  false,
  'Shared rows should not use visitor/default locale formatting.',
);
assert.equal(
  rowSource.includes('priority score'),
  false,
  'Shared rows should not expose weighted-frequency priority-score copy.',
);

assert.match(
  resultsSource,
  /<DeflectionTopQuestionRows\s+questions=\{top_questions\}\s+assistedContactCost=\{assistedContactCost\}/,
  'Results page should render top questions through the shared row component.',
);
assert.match(
  resultsSource,
  /<DeflectionLockedQuestionRows\s+questions=\{locked_questions\}\s+assistedContactCost=\{assistedContactCost\}\s+showFade/,
  'Results page should render locked questions through the shared row component.',
);
assert.match(
  resultsSource,
  /<DeflectionBlindSpotRows\s+blindSpots=\{top_blind_spots\}\s+assistedContactCost=\{assistedContactCost\}/,
  'Results page should render blind spots through the shared row component.',
);
assert.match(
  resultsSource,
  /top_blind_spots = \[\]/,
  'Results page should keep snapshots without optional blind-spot rows compatible.',
);
assert.match(
  resultsSource,
  /const lockedRanks = locked_questions\.map\(\(question\) => question\.rank\);/,
  'Results page should derive locked-rank labels from actual locked question ranks.',
);
assert.match(
  resultsSource,
  /Math\.min\(\.\.\.lockedRanks\)/,
  'Results page should use the first actual locked rank when locked rows exist.',
);
assert.match(
  resultsSource,
  /Math\.max\(\.\.\.lockedRanks\)/,
  'Results page should use the last actual locked rank when locked rows exist.',
);
assert.equal(
  resultsSource.includes('top_questions.length + 1'),
  false,
  'Results page should not assume visible row count equals the first locked rank.',
);
assert.match(
  resultsSource,
  /firstLockedRank <= lastLockedRank/,
  'Results page should gate the locked-rank range so a sparse no-locked fallback cannot render a backwards range.',
);
assert.match(
  landingSource,
  /<DeflectionTopQuestionRows\s+questions=\{provenQuestions\}\s+assistedContactCost=\{assistedContactCost\}\s+\/>/,
  'Snapshot landing page should render teaser-proven top questions through the shared row component and shared cost state.',
);
assert.match(
  landingSource,
  /function provenQuestionRanks\(snapshot: DeflectionSnapshot\)/,
  'Snapshot landing page should derive proven rows from Snapshot teaser ranks instead of raw top-question position.',
);
assert.equal(
  landingSource.includes('limit={3}'),
  false,
  'Snapshot landing page should not mask ranks 4-5 by limiting the shared top-question rows to three.',
);
assert.match(
  landingSource,
  /<DeflectionLockedQuestionRows\s+questions=\{locked_questions\}\s+assistedContactCost=\{assistedContactCost\}/,
  'Snapshot landing page should render locked questions through the shared row component and shared cost state.',
);
assert.match(
  landingSource,
  /top_blind_spots = \[\]/,
  'Snapshot landing page should keep snapshots without optional blind-spot rows compatible.',
);
assert.match(
  landingSource,
  /<DeflectionBlindSpotRows\s+blindSpots=\{top_blind_spots\}\s+assistedContactCost=\{assistedContactCost\}/,
  'Snapshot landing page should render blind spots through the shared row component and shared cost state.',
);
assert.match(
  landingSource,
  /They are not drafted answers/,
  'Snapshot landing page should distinguish unresolved blind spots from drafted answers.',
);
assert.equal(
  /function\s+SnapshotQuestionRows|function\s+LockedQuestionFomoRows/.test(landingSource),
  false,
  'Snapshot landing page should not reintroduce bespoke row renderers.',
);
assert.equal(
  landingSource.includes('priority score'),
  false,
  'Snapshot landing page should not reintroduce priority-score copy.',
);

assert.match(
  landingSource,
  /firstLockedRank <= lastLockedRank/,
  'Snapshot landing page should keep gating the locked-rank range against a backwards sparse fallback.',
);

console.log('Deflection row renderer sharing guard passed.');
