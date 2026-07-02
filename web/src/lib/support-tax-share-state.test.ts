import { describe, expect, it } from 'vitest';

import {
  buildSupportTaxShareQuery,
  mergeSupportTaxShareQuery,
  parseSupportTaxShareState,
  stripSupportTaxShareParams,
  SUPPORT_TAX_INPUTS,
  SUPPORT_TAX_ROUTE,
} from '@/lib/support-tax-share-state';

const DEFAULT_STATE = {
  monthlyTickets: SUPPORT_TAX_INPUTS.monthlyTickets.default,
  costPerTicket: SUPPORT_TAX_INPUTS.costPerTicket.default,
  repeatPct: SUPPORT_TAX_INPUTS.repeatPct.default,
  touchMinutes: SUPPORT_TAX_INPUTS.touchMinutes.default,
};

describe('parseSupportTaxShareState', () => {
  it('returns defaults for an empty query', () => {
    expect(parseSupportTaxShareState(new URLSearchParams())).toEqual(DEFAULT_STATE);
  });

  it('reads all four short params', () => {
    const state = parseSupportTaxShareState(new URLSearchParams('v=3000&c=20&r=55&t=8'));
    expect(state).toEqual({
      monthlyTickets: 3000,
      costPerTicket: 20,
      repeatPct: 55,
      touchMinutes: 8,
    });
  });

  it('clamps out-of-range values into each input range', () => {
    const state = parseSupportTaxShareState(new URLSearchParams('v=999999&c=1&r=99&t=0'));
    expect(state).toEqual({
      monthlyTickets: 10000,
      costPerTicket: 10,
      repeatPct: 70,
      touchMinutes: 2,
    });
  });

  it('rounds to each input step', () => {
    const state = parseSupportTaxShareState(new URLSearchParams('v=1524'));
    expect(state.monthlyTickets).toBe(1500);
  });

  it('falls back to defaults for junk values', () => {
    const state = parseSupportTaxShareState(new URLSearchParams('v=abc&c=&r=NaN&t=Infinity'));
    expect(state).toEqual(DEFAULT_STATE);
  });
});

describe('buildSupportTaxShareQuery', () => {
  it('returns an empty string at defaults so the bare URL stays canonical', () => {
    expect(buildSupportTaxShareQuery(DEFAULT_STATE)).toBe('');
  });

  it('includes only non-default params', () => {
    expect(
      buildSupportTaxShareQuery({ ...DEFAULT_STATE, monthlyTickets: 3000, repeatPct: 55 }),
    ).toBe('v=3000&r=55');
  });

  it('clamps values before writing them', () => {
    expect(buildSupportTaxShareQuery({ ...DEFAULT_STATE, costPerTicket: 500 })).toBe('c=30');
  });

  it('round-trips through parse', () => {
    const state = {
      monthlyTickets: 4500,
      costPerTicket: 22,
      repeatPct: 30,
      touchMinutes: 20,
    };
    const query = buildSupportTaxShareQuery(state);
    expect(parseSupportTaxShareState(new URLSearchParams(query))).toEqual(state);
  });

  it('round-trips defaults through an empty query', () => {
    const query = buildSupportTaxShareQuery(DEFAULT_STATE);
    expect(parseSupportTaxShareState(new URLSearchParams(query))).toEqual(DEFAULT_STATE);
  });
});

describe('mergeSupportTaxShareQuery', () => {
  it('preserves foreign params such as utm attribution', () => {
    const merged = mergeSupportTaxShareQuery('utm_source=reddit&utm_campaign=supporttax', {
      ...DEFAULT_STATE,
      monthlyTickets: 3000,
    });
    expect(merged).toBe('utm_source=reddit&utm_campaign=supporttax&v=3000');
  });

  it('removes calculator keys that return to defaults without touching others', () => {
    const merged = mergeSupportTaxShareQuery('utm_source=reddit&v=3000&r=55', DEFAULT_STATE);
    expect(merged).toBe('utm_source=reddit');
  });

  it('overwrites stale calculator values in place', () => {
    const merged = mergeSupportTaxShareQuery('v=8000&utm_source=reddit', {
      ...DEFAULT_STATE,
      monthlyTickets: 3000,
    });
    expect(new URLSearchParams(merged).get('v')).toBe('3000');
    expect(new URLSearchParams(merged).get('utm_source')).toBe('reddit');
  });
});

describe('stripSupportTaxShareParams', () => {
  it('drops the calculator keys on the support-tax route only', () => {
    expect(stripSupportTaxShareParams(SUPPORT_TAX_ROUTE, 'v=3000&utm_source=reddit&r=55')).toBe(
      'utm_source=reddit',
    );
  });

  it('leaves other routes untouched', () => {
    expect(stripSupportTaxShareParams('/audit', 'v=3000&utm_source=reddit')).toBe(
      'v=3000&utm_source=reddit',
    );
  });

  it('passes empty queries through', () => {
    expect(stripSupportTaxShareParams(SUPPORT_TAX_ROUTE, '')).toBe('');
  });
});
