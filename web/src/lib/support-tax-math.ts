import { DEFLECTION_ASSISTED_CONTACT_DELTA_USD } from '@/lib/deflection-pricing';

// Pure math behind the support-tax calculators
// (SupportTaxCalculator, ThirtySecondCalculator, SupportTaxMiniCalculator).
// Every formula here is pinned by support-tax-math.test.ts; change a model,
// change its golden values in the same slice.

// Quick model assumptions (30-second / mini calculators).
export const QUICK_REPEAT_SHARE = 0.4; // 40% of volume modeled as repeat Tier-1 how-to tickets
const QUICK_TOUCH_HOURS_PER_TICKET = 0.2; // 12 minutes of average touch time per ticket

// Leaky-bucket assumptions (rendered in the calculator's output copy).
export const CONTEXT_MINUTES_PER_REPEAT = 10;
export const REPLACEMENT_COST = 46000;
export const BURNOUT_TURNOVER_SHARE = 0.7;
const ANNUAL_WORK_HOURS = 2080;

export interface StepRange {
  min: number;
  max: number;
  step: number;
}

// Round to the nearest step, then clamp into [min, max]. Shared by every
// calculator number-input commit handler.
export function clampToStep(value: number, { min, max, step }: StepRange): number {
  const stepped = Math.round(value / step) * step;
  return Math.min(Math.max(stepped, min), max);
}

export interface QuickSupportTaxInputs {
  monthlyTickets: number;
  costPerTicket: number;
  repeatShare?: number;
  touchHoursPerTicket?: number;
}

export interface QuickSupportTaxResult {
  monthlyRepeatVolume: number;
  monthlyTax: number;
  annualTax: number;
  monthlyHours: number;
}

// The two-input model: repeat Tier-1 volume priced at a fully loaded
// cost per ticket. Repeat share and touch hours are parameters so landers
// can expose them as editable assumptions without touching the math.
export function computeQuickSupportTax({
  monthlyTickets,
  costPerTicket,
  repeatShare = QUICK_REPEAT_SHARE,
  touchHoursPerTicket = QUICK_TOUCH_HOURS_PER_TICKET,
}: QuickSupportTaxInputs): QuickSupportTaxResult {
  const monthlyRepeatVolume = monthlyTickets * repeatShare;
  const monthlyTax = monthlyRepeatVolume * costPerTicket;
  const annualTax = monthlyTax * 12;
  const monthlyHours = monthlyRepeatVolume * touchHoursPerTicket;
  return { monthlyRepeatVolume, monthlyTax, annualTax, monthlyHours };
}

export interface LeakyBucketInputs {
  monthlyTickets: number;
  agents: number;
  salary: number;
  repeatPct: number;
  attritionPct: number;
  currentSelfServicePct: number;
  targetSelfServicePct: number;
}

export interface LeakyBucketResult {
  monthlyRepeatTickets: number;
  hourlyRate: number;
  monthlyContextHours: number;
  annualContextLeak: number;
  agentsLostPerYear: number;
  annualAttritionTax: number;
  selfServiceDelta: number;
  annualSelfServiceOpportunity: number;
  totalVisibleLeak: number;
}

// The leaky-bucket model: three leaks summed into an annual visible leak.
// Directional sizing of current spend, not a savings forecast. Known model
// limits are parked in HARDENING.md (SUPPORT-TAX-MATH-1 / -2).
export function computeLeakyBucketLeak({
  monthlyTickets,
  agents,
  salary,
  repeatPct,
  attritionPct,
  currentSelfServicePct,
  targetSelfServicePct,
}: LeakyBucketInputs): LeakyBucketResult {
  const monthlyRepeatTickets = monthlyTickets * (repeatPct / 100);
  const hourlyRate = salary / ANNUAL_WORK_HOURS;
  const monthlyContextHours = (monthlyRepeatTickets * CONTEXT_MINUTES_PER_REPEAT) / 60;
  const annualContextLeak = monthlyContextHours * 12 * hourlyRate;

  const agentsLostPerYear = agents * (attritionPct / 100);
  const annualAttritionTax = agentsLostPerYear * REPLACEMENT_COST * BURNOUT_TURNOVER_SHARE;

  const selfServiceDelta = Math.max(0, targetSelfServicePct - currentSelfServicePct) / 100;
  const annualSelfServiceOpportunity =
    monthlyRepeatTickets * 12 * selfServiceDelta * DEFLECTION_ASSISTED_CONTACT_DELTA_USD;

  const totalVisibleLeak = annualContextLeak + annualAttritionTax + annualSelfServiceOpportunity;

  return {
    monthlyRepeatTickets,
    hourlyRate,
    monthlyContextHours,
    annualContextLeak,
    agentsLostPerYear,
    annualAttritionTax,
    selfServiceDelta,
    annualSelfServiceOpportunity,
    totalVisibleLeak,
  };
}
