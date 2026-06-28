import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { DEMO_DEFLECTION_SNAPSHOT } from './deflection-demo-example';

describe('deflection teaser rank-copy guard', () => {
  it('keeps shared teaser copy rank-aware across Snapshot surfaces', async () => {
    const [
      teaserSource,
      resultsSource,
      landingSource,
      snapshotSource,
    ] = await Promise.all([
      readFile(new URL('../components/landing/DeflectionSnapshotTeaser.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../components/landing/DeflectionResultsPage.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../components/landing/DeflectionSnapshotLandingPage.tsx', import.meta.url), 'utf8'),
      readFile(new URL('./deflection-snapshot.ts', import.meta.url), 'utf8'),
    ]);

    expect(teaserSource).not.toContain('Sample Drafted Answer');
    expect(teaserSource).toMatch(
      /function\s+teaserAnswerLabel\s*\(\s*answer:\s*DeflectionSnapshotFullAnswer\s*\)/,
    );
    expect(teaserSource).toMatch(/answer\.rank\s*===\s*1/);
    expect(teaserSource).toMatch(/Sample answer for your #1 most-asked question/);
    expect(teaserSource).toMatch(/Sample answer for ranked question #\$\{answer\.rank\}/);
    expect(teaserSource).toMatch(/\{teaserAnswerLabel\(answer\)\}/);

    expect(resultsSource).toMatch(/<DeflectionTeaserAnswer\s+answer=\{fullTeaser\}/);
    expect(landingSource).toMatch(/<DeflectionTeaserAnswer\s+answer=\{teaser\.full_answer\}/);
    expect(landingSource).toMatch(
      /<DeflectionTeaserPreviewCard\s+key=\{preview\.rank\}\s+preview=\{preview\}/,
    );
    expect(landingSource).not.toMatch(/function\s+AnswerTeaser|function\s+PreviewPill/);

    expect(snapshotSource).toContain("from './deflection-demo-example'");
    expect(DEMO_DEFLECTION_SNAPSHOT.teaser.full_answer?.rank).toBe(1);
    expect(DEMO_DEFLECTION_SNAPSHOT.teaser.previews[0].rank).toBeGreaterThan(
      DEMO_DEFLECTION_SNAPSHOT.teaser.full_answer?.rank ?? 0,
    );
  });
});
