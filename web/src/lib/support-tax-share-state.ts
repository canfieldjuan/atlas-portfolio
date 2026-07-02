import { clampToStep, type StepRange } from '@/lib/support-tax-math';

// URL share state for the 30-second support-tax calculator
// (/systems/support-ticket-deflection/support-tax). Slider state round-trips
// through short query params so a configured result can be pasted into a
// thread; defaults are omitted so the bare URL stays canonical.

export interface SupportTaxInputRange extends StepRange {
  default: number;
}

export const SUPPORT_TAX_INPUTS: Record<
  'monthlyTickets' | 'costPerTicket' | 'repeatPct' | 'touchMinutes',
  SupportTaxInputRange
> = {
  monthlyTickets: { min: 100, max: 10000, step: 50, default: 1500 },
  costPerTicket: { min: 10, max: 30, step: 1, default: 15 },
  // Same 10-70% band as the leaky-bucket calculator's repeat-share input.
  repeatPct: { min: 10, max: 70, step: 1, default: 40 },
  touchMinutes: { min: 2, max: 60, step: 1, default: 12 },
};

export interface SupportTaxShareState {
  monthlyTickets: number;
  costPerTicket: number;
  repeatPct: number;
  touchMinutes: number;
}

const PARAM_KEYS: Record<keyof SupportTaxShareState, string> = {
  monthlyTickets: 'v',
  costPerTicket: 'c',
  repeatPct: 'r',
  touchMinutes: 't',
};

// Accepts URLSearchParams or Next's read-only wrapper.
interface QueryParamsLike {
  get(name: string): string | null;
}

function parseParam(params: QueryParamsLike, key: keyof SupportTaxShareState): number {
  const range = SUPPORT_TAX_INPUTS[key];
  const raw = params.get(PARAM_KEYS[key]);
  if (raw === null || raw.trim() === '') return range.default;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return range.default;
  return clampToStep(parsed, range);
}

export function parseSupportTaxShareState(params: QueryParamsLike): SupportTaxShareState {
  return {
    monthlyTickets: parseParam(params, 'monthlyTickets'),
    costPerTicket: parseParam(params, 'costPerTicket'),
    repeatPct: parseParam(params, 'repeatPct'),
    touchMinutes: parseParam(params, 'touchMinutes'),
  };
}

export function buildSupportTaxShareQuery(state: SupportTaxShareState): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(PARAM_KEYS) as Array<keyof SupportTaxShareState>) {
    const range = SUPPORT_TAX_INPUTS[key];
    const value = clampToStep(state[key], range);
    if (value !== range.default) params.set(PARAM_KEYS[key], String(value));
  }
  return params.toString();
}
