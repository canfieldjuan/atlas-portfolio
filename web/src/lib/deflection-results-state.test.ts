import { describe, expect, it } from 'vitest';
import type { SnapshotFetchResult } from '@/lib/atlas-deflection-client';
import { DEMO_DEFLECTION_SNAPSHOT } from '@/lib/deflection-snapshot';
import { resolveDeflectionSnapshotRouteState } from '@/lib/deflection-results-state';

const atlasSnapshot = {
  ...DEMO_DEFLECTION_SNAPSHOT,
  summary: {
    ...DEMO_DEFLECTION_SNAPSHOT.summary,
    generated: 2,
    drafted_answer_count: 1,
    no_proven_answer_count: 1,
    repeat_ticket_count: 24,
    non_repeat_ticket_count: 6,
  },
};

describe('resolveDeflectionSnapshotRouteState', () => {
  it('returns an Atlas snapshot when the fetch succeeds', () => {
    const result = { ok: true, snapshot: atlasSnapshot } satisfies SnapshotFetchResult;

    expect(resolveDeflectionSnapshotRouteState(result, 'production')).toEqual({
      kind: 'snapshot',
      snapshot: atlasSnapshot,
      source: 'atlas',
    });
  });

  it('returns not_found when ATLAS reports the snapshot is missing', () => {
    const result = { ok: false, reason: 'not_found' } satisfies SnapshotFetchResult;

    expect(resolveDeflectionSnapshotRouteState(result, 'production')).toEqual({
      kind: 'not_found',
    });
  });

  it.each(['development', 'test'])(
    'falls back to the real demo snapshot in %s when ATLAS is not configured',
    (environment) => {
      const result = { ok: false, reason: 'not_configured' } satisfies SnapshotFetchResult;

      expect(resolveDeflectionSnapshotRouteState(result, environment)).toEqual({
        kind: 'snapshot',
        snapshot: DEMO_DEFLECTION_SNAPSHOT,
        source: 'demo',
      });
    },
  );

  it('does not fall back to the demo snapshot in production when ATLAS is not configured', () => {
    const result = { ok: false, reason: 'not_configured' } satisfies SnapshotFetchResult;

    expect(resolveDeflectionSnapshotRouteState(result, 'production')).toEqual({
      kind: 'unavailable',
      reason: 'not_configured',
    });
  });

  it('returns unavailable when the Atlas snapshot fetch errors', () => {
    const result = { ok: false, reason: 'error' } satisfies SnapshotFetchResult;

    expect(resolveDeflectionSnapshotRouteState(result, 'production')).toEqual({
      kind: 'unavailable',
      reason: 'error',
    });
  });
});
