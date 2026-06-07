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
  landingSource,
  /<DeflectionTopQuestionRows\s+questions=\{top_questions\}\s+assistedContactCost=\{assistedContactCost\}\s+\/>/,
  'Snapshot landing page should render all fixture top questions through the shared row component and shared cost state.',
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

console.log('Deflection row renderer sharing guard passed.');
