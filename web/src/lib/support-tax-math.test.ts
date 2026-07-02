import { describe, expect, it } from 'vitest';

import { DEFLECTION_ASSISTED_CONTACT_DELTA_USD } from '@/lib/deflection-pricing';
import {
  BURNOUT_TURNOVER_SHARE,
  clampToStep,
  computeLeakyBucketLeak,
  computeQuickSupportTax,
  CONTEXT_MINUTES_PER_REPEAT,
  QUICK_REPEAT_SHARE,
  REPLACEMENT_COST,
} from '@/lib/support-tax-math';

// Golden values are hardcoded by hand, not re-derived from the formulas,
// so a model change fails here instead of silently changing a live
// landing-page headline number.

describe('pricing input pins', () => {
  it('pins the assisted-contact delta the leaky bucket consumes', () => {
    expect(DEFLECTION_ASSISTED_CONTACT_DELTA_USD).toBeCloseTo(11.66, 10);
  });

  it('pins the rendered assumption constants', () => {
    expect(QUICK_REPEAT_SHARE).toBe(0.4);
    expect(CONTEXT_MINUTES_PER_REPEAT).toBe(10);
    expect(REPLACEMENT_COST).toBe(46000);
    expect(BURNOUT_TURNOVER_SHARE).toBe(0.7);
  });
});

describe('computeQuickSupportTax', () => {
  it('matches the shipped defaults: 1,500 tickets at $15', () => {
    const result = computeQuickSupportTax({ monthlyTickets: 1500, costPerTicket: 15 });
    expect(result.monthlyRepeatVolume).toBe(600);
    expect(result.monthlyTax).toBe(9000);
    expect(result.annualTax).toBe(108000);
    expect(result.monthlyHours).toBe(120);
  });

  it('accepts overridden repeat share and touch hours', () => {
    const result = computeQuickSupportTax({
      monthlyTickets: 2000,
      costPerTicket: 12,
      repeatShare: 0.55,
      touchHoursPerTicket: 0.15,
    });
    expect(result.monthlyRepeatVolume).toBe(1100);
    expect(result.monthlyTax).toBe(13200);
    expect(result.annualTax).toBe(158400);
    expect(result.monthlyHours).toBeCloseTo(165, 10);
  });

  it('returns zeros for zero volume', () => {
    const result = computeQuickSupportTax({ monthlyTickets: 0, costPerTicket: 30 });
    expect(result.monthlyRepeatVolume).toBe(0);
    expect(result.monthlyTax).toBe(0);
    expect(result.annualTax).toBe(0);
    expect(result.monthlyHours).toBe(0);
  });
});

describe('computeLeakyBucketLeak', () => {
  // assistedContactDeltaUsd is the hand-pinned 11.66 golden value; the
  // "pricing input pins" suite asserts the live constant still equals it.
  const defaults = {
    monthlyTickets: 3000,
    agents: 10,
    salary: 70000,
    repeatPct: 50,
    attritionPct: 35,
    currentSelfServicePct: 14,
    targetSelfServicePct: 40,
    assistedContactDeltaUsd: 11.66,
  };

  it('matches the shipped defaults leak by leak', () => {
    const result = computeLeakyBucketLeak(defaults);
    expect(result.monthlyRepeatTickets).toBe(1500);
    expect(result.hourlyRate).toBeCloseTo(33.653846, 6);
    expect(result.monthlyContextHours).toBe(250);
    expect(result.annualContextLeak).toBeCloseTo(100961.538462, 6);
    expect(result.agentsLostPerYear).toBeCloseTo(3.5, 10);
    expect(result.annualAttritionTax).toBeCloseTo(112700, 10);
    expect(result.selfServiceDelta).toBeCloseTo(0.26, 10);
    expect(result.annualSelfServiceOpportunity).toBeCloseTo(54568.8, 6);
    expect(result.totalVisibleLeak).toBeCloseTo(268230.338462, 6);
  });

  it('sums the three leaks into the total', () => {
    const result = computeLeakyBucketLeak(defaults);
    expect(result.totalVisibleLeak).toBeCloseTo(
      result.annualContextLeak + result.annualAttritionTax + result.annualSelfServiceOpportunity,
      10,
    );
  });

  it('floors the self-service delta at zero when the target is below current', () => {
    const result = computeLeakyBucketLeak({
      ...defaults,
      currentSelfServicePct: 50,
      targetSelfServicePct: 10,
    });
    expect(result.selfServiceDelta).toBe(0);
    expect(result.annualSelfServiceOpportunity).toBe(0);
    expect(result.totalVisibleLeak).toBeCloseTo(
      result.annualContextLeak + result.annualAttritionTax,
      10,
    );
  });

  it('zeroes the attrition tax when attrition is zero', () => {
    const result = computeLeakyBucketLeak({ ...defaults, attritionPct: 0 });
    expect(result.agentsLostPerYear).toBe(0);
    expect(result.annualAttritionTax).toBe(0);
  });

  it('zeroes every repeat-driven leak when repeat share is zero', () => {
    const result = computeLeakyBucketLeak({ ...defaults, repeatPct: 0 });
    expect(result.monthlyRepeatTickets).toBe(0);
    expect(result.annualContextLeak).toBe(0);
    expect(result.annualSelfServiceOpportunity).toBe(0);
    expect(result.totalVisibleLeak).toBeCloseTo(result.annualAttritionTax, 10);
  });
});

describe('clampToStep', () => {
  const range = { min: 100, max: 10000, step: 50 };

  it('rounds to the nearest step', () => {
    expect(clampToStep(1524, range)).toBe(1500);
    expect(clampToStep(1526, range)).toBe(1550);
  });

  it('clamps below the minimum and above the maximum', () => {
    expect(clampToStep(-500, range)).toBe(100);
    expect(clampToStep(0, range)).toBe(100);
    expect(clampToStep(999999, range)).toBe(10000);
  });

  it('keeps in-range step-aligned values unchanged', () => {
    expect(clampToStep(100, range)).toBe(100);
    expect(clampToStep(10000, range)).toBe(10000);
    expect(clampToStep(70000, { min: 30000, max: 180000, step: 1000 })).toBe(70000);
  });
});
