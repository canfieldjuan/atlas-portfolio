import {
  DEMO_DEFLECTION_SNAPSHOT,
  type DeflectionSnapshot,
} from '@/lib/deflection-snapshot';
import type { SnapshotFetchResult } from '@/lib/atlas-deflection-client';

export type DeflectionSnapshotRouteState =
  | { kind: 'snapshot'; snapshot: DeflectionSnapshot; source: 'atlas' | 'demo' }
  | { kind: 'not_found' }
  | { kind: 'unavailable'; reason: 'not_configured' | 'error' };

export function resolveDeflectionSnapshotRouteState(
  result: SnapshotFetchResult,
  environment = process.env.NODE_ENV,
): DeflectionSnapshotRouteState {
  if (result.ok) {
    return { kind: 'snapshot', snapshot: result.snapshot, source: 'atlas' };
  }

  if (result.reason === 'not_found') {
    return { kind: 'not_found' };
  }

  if (result.reason === 'not_configured' && environment !== 'production') {
    return {
      kind: 'snapshot',
      snapshot: DEMO_DEFLECTION_SNAPSHOT,
      source: 'demo',
    };
  }

  return { kind: 'unavailable', reason: result.reason };
}
