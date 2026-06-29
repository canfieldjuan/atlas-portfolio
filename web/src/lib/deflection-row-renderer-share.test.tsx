import { readFile } from 'node:fs/promises';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  DeflectionBlindSpotRows,
  DeflectionLockedQuestionRows,
  DeflectionTopQuestionRows,
} from '../components/landing/DeflectionSnapshotRows';
import type {
  DeflectionSnapshotBlindSpot,
  DeflectionSnapshotLockedQuestion,
  DeflectionSnapshotQuestion,
} from './deflection-snapshot';

function assertIncludes(haystack: string, needle: string, context: string) {
  expect(haystack, `${context}: expected ${needle}`).toContain(needle);
}

function assertNotIncludes(haystack: string, needle: string, context: string) {
  expect(haystack, `${context}: unexpected ${needle}`).not.toContain(needle);
}

function occurrences(haystack: string, needle: string) {
  return haystack.split(needle).length - 1;
}

const topQuestions: DeflectionSnapshotQuestion[] = [
  {
    action_label: 'Publish answer',
    customer_wording: ' export reports ',
    estimated_support_cost: 200,
    owner_lane: 'Reporting',
    question: 'How do I export attribution reports?',
    rank: 1,
    ticket_count: 10,
    weighted_frequency: 10,
  },
  {
    action_label: 'Write answer',
    customer_wording: '   ',
    estimated_support_cost: 67.5,
    owner_lane: 'Support Enablement',
    question: 'How do I add an invoice recipient?',
    rank: 2,
    ticket_count: 5,
    weighted_frequency: 5,
  },
];

const lockedQuestions: DeflectionSnapshotLockedQuestion[] = [
  { rank: 3, ticket_count: 4 },
];

const blindSpots: DeflectionSnapshotBlindSpot[] = [
  {
    action_label: 'Investigate gap',
    estimated_support_cost: 325,
    owner_lane: 'Product Ops',
    question: 'Why do saved search alerts keep firing?',
    rank: 4,
    ticket_count: 20,
  },
];

describe('deflection row renderer sharing guard', () => {
  it('renders shared Snapshot row components with production labels and adjusted costs', () => {
    const topMarkup = renderToStaticMarkup(
      <DeflectionTopQuestionRows questions={topQuestions} assistedContactCost={27} />,
    );
    assertIncludes(topMarkup, '#1', 'top row rank');
    assertIncludes(topMarkup, 'How do I export attribution reports?', 'top row question');
    assertIncludes(
      topMarkup,
      'target phrase from your tickets:',
      'top row target-phrase label',
    );
    assertIncludes(topMarkup, '“export reports”', 'top row trimmed customer wording');
    assertNotIncludes(topMarkup, '“ export reports ”', 'top row padded customer wording');
    expect(occurrences(topMarkup, 'target phrase from your tickets:')).toBe(1);
    assertIncludes(topMarkup, 'Reporting', 'top row owner lane');
    assertIncludes(topMarkup, 'Publish answer', 'top row action label');
    assertIncludes(topMarkup, '$400', 'top row slider-adjusted support cost');
    assertIncludes(topMarkup, 'at $27 per assisted contact', 'top row assisted-contact cost label');
    assertNotIncludes(topMarkup, 'priority score', 'top row copy');
    assertNotIncludes(topMarkup, '   ', 'empty customer wording');

    const limitedMarkup = renderToStaticMarkup(
      <DeflectionTopQuestionRows
        questions={topQuestions}
        assistedContactCost={13.5}
        limit={1}
      />,
    );
    assertNotIncludes(limitedMarkup, 'How do I add an invoice recipient?', 'limit prop');

    const lockedMarkup = renderToStaticMarkup(
      <DeflectionLockedQuestionRows
        questions={lockedQuestions}
        assistedContactCost={27}
        showFade
      />,
    );
    assertIncludes(lockedMarkup, 'Question text withheld', 'locked row withheld label');
    expect(lockedMarkup).toMatch(/>4<\/strong>\s*repeat tickets/);
    assertIncludes(lockedMarkup, '$108', 'locked row cost');
    assertIncludes(lockedMarkup, 'from-background to-transparent', 'locked fade');

    const blindSpotMarkup = renderToStaticMarkup(
      <DeflectionBlindSpotRows blindSpots={blindSpots} assistedContactCost={27} />,
    );
    assertIncludes(blindSpotMarkup, 'Why do saved search alerts keep firing?', 'blind spot question');
    assertIncludes(blindSpotMarkup, 'Product Ops', 'blind spot owner lane');
    assertIncludes(blindSpotMarkup, 'Investigate gap', 'blind spot action label');
    assertIncludes(blindSpotMarkup, 'no proven answer found yet', 'blind spot gap framing');
    assertIncludes(blindSpotMarkup, '$650', 'blind spot slider-adjusted support cost');
  });

  it('keeps results and landing pages delegated to the shared row renderers', async () => {
    const [rowSource, resultsSource, landingSource] = await Promise.all([
      readFile(new URL('../components/landing/DeflectionSnapshotRows.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../components/landing/DeflectionResultsPage.tsx', import.meta.url), 'utf8'),
      readFile(
        new URL('../components/landing/DeflectionSnapshotLandingPage.tsx', import.meta.url),
        'utf8',
      ),
    ]);

    expect(rowSource).toMatch(/export function DeflectionTopQuestionRows/);
    expect(rowSource).toMatch(/export function DeflectionLockedQuestionRows/);
    expect(rowSource).toMatch(/export function DeflectionBlindSpotRows/);
    expect(rowSource).toMatch(/Intl\.NumberFormat\('en-US'/);
    expect(rowSource).not.toContain('toLocaleString()');
    expect(rowSource).not.toContain('priority score');

    expect(resultsSource).toMatch(
      /<DeflectionTopQuestionRows\s+questions=\{top_questions\}\s+assistedContactCost=\{assistedContactCost\}/,
    );
    expect(resultsSource).toMatch(
      /<DeflectionLockedQuestionRows\s+questions=\{locked_questions\}\s+assistedContactCost=\{assistedContactCost\}\s+showFade/,
    );
    expect(resultsSource).toMatch(
      /<DeflectionBlindSpotRows\s+blindSpots=\{top_blind_spots\}\s+assistedContactCost=\{assistedContactCost\}/,
    );
    expect(resultsSource).toMatch(/top_blind_spots = \[\]/);
    expect(resultsSource).toMatch(
      /const lockedRanks = locked_questions\.map\(\(question\) => question\.rank\);/,
    );
    expect(resultsSource).toMatch(/Math\.min\(\.\.\.lockedRanks\)/);
    expect(resultsSource).toMatch(/Math\.max\(\.\.\.lockedRanks\)/);
    expect(resultsSource).not.toContain('top_questions.length + 1');
    expect(resultsSource).toMatch(/firstLockedRank <= lastLockedRank/);

    expect(landingSource).toMatch(
      /<DeflectionTopQuestionRows\s+questions=\{provenQuestions\}\s+assistedContactCost=\{assistedContactCost\}\s+\/>/,
    );
    expect(landingSource).toMatch(/function provenQuestionRanks\(snapshot: DeflectionSnapshot\)/);
    expect(landingSource).not.toContain('limit={3}');
    expect(landingSource).toMatch(
      /<DeflectionLockedQuestionRows\s+questions=\{locked_questions\}\s+assistedContactCost=\{assistedContactCost\}/,
    );
    expect(landingSource).toMatch(/top_blind_spots = \[\]/);
    expect(landingSource).toMatch(
      /<DeflectionBlindSpotRows\s+blindSpots=\{top_blind_spots\}\s+assistedContactCost=\{assistedContactCost\}/,
    );
    expect(landingSource).toMatch(/They are not drafted answers/);
    expect(landingSource).not.toMatch(/function\s+SnapshotQuestionRows|function\s+LockedQuestionFomoRows/);
    expect(landingSource).not.toContain('priority score');
    expect(landingSource).toMatch(/firstLockedRank <= lastLockedRank/);
  });
});
