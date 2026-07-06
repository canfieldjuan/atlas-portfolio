'use client';

import { useEffect, useId, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { trackCalculatorEngaged } from '@/lib/analytics';
import { clampToStep, computeQuickSupportTax } from '@/lib/support-tax-math';
import {
  mergeSupportTaxShareQuery,
  parseSupportTaxShareState,
  SUPPORT_TAX_INPUTS,
} from '@/lib/support-tax-share-state';

// The 30-Second Support Tax Calculator. A simpler, manager-facing cut of the
// leaky-bucket model: two primary inputs (ticket volume + fully loaded cost per
// ticket) with the model assumptions (repeat share, touch time) exposed as
// editable overrides, showing the monthly cost and agent-hours spent
// re-answering repeat questions. This sizes current spend; it is not a forecast
// of what the Resolution Audit will save. Math lives in @/lib/support-tax-math;
// slider state round-trips through the URL via @/lib/support-tax-share-state.

const TICKETS = SUPPORT_TAX_INPUTS.monthlyTickets;
const COST = SUPPORT_TAX_INPUTS.costPerTicket;
const REPEAT_PCT = SUPPORT_TAX_INPUTS.repeatPct;
const TOUCH_MINUTES = SUPPORT_TAX_INPUTS.touchMinutes;

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const count = (n: number) => Math.round(n).toLocaleString();

function SliderField({
  label,
  hint,
  value,
  min,
  max,
  step,
  onChange,
  prefix,
  suffix,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  const fieldId = useId();

  const commit = (input: HTMLInputElement) => {
    const n = Number(input.value);
    if (input.value.trim() !== '' && Number.isFinite(n)) {
      const nextValue = clampToStep(n, { min, max, step });
      onChange(nextValue);
      input.value = String(nextValue);
    } else {
      input.value = String(value);
    }
  };

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
            {label}
          </label>
          <div className="text-[11px] text-foreground/45">{hint}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {prefix && <span className="text-sm text-foreground/50">{prefix}</span>}
          <input
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={step}
            id={fieldId}
            key={value}
            defaultValue={value}
            onBlur={(event) => commit(event.currentTarget)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur();
            }}
            className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-right text-sm font-semibold tabular-nums text-foreground outline-none transition-colors focus:border-primary/60"
          />
          {suffix && <span className="text-sm text-foreground/50">{suffix}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`${label} slider`}
        style={{ accentColor: 'var(--primary)' }}
        className="w-full cursor-pointer"
      />
      <div className="mt-1 flex justify-between text-[10px] font-mono text-foreground/40">
        <span>
          {prefix}
          {min.toLocaleString()}
          {suffix}
        </span>
        <span>
          {prefix}
          {max.toLocaleString()}
          {suffix}
        </span>
      </div>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</div>
      <div className="mt-0.5 text-[11px] text-foreground/45">{sub}</div>
    </div>
  );
}

export function ThirtySecondCalculator() {
  const searchParams = useSearchParams();
  const [initialState] = useState(() => parseSupportTaxShareState(searchParams));
  const [monthlyTickets, setMonthlyTickets] = useState(initialState.monthlyTickets);
  const [costPerTicket, setCostPerTicket] = useState(initialState.costPerTicket);
  const [repeatPct, setRepeatPct] = useState(initialState.repeatPct);
  const [touchMinutes, setTouchMinutes] = useState(initialState.touchMinutes);

  const withEngagement = (set: (n: number) => void) => (n: number) => {
    trackCalculatorEngaged({ calculator: 'thirty_second' });
    set(n);
  };

  // Mirror slider state into the URL so a configured result can be shared;
  // native replaceState is the documented shallow-update path (no navigation).
  // Merging preserves foreign params (utm_* attribution) and the write is
  // debounced so a slider drag issues one history update, not dozens
  // (browsers rate-limit rapid replaceState calls).
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const query = mergeSupportTaxShareQuery(window.location.search, {
        monthlyTickets,
        costPerTicket,
        repeatPct,
        touchMinutes,
      });
      const next = query
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;
      window.history.replaceState(null, '', next);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [monthlyTickets, costPerTicket, repeatPct, touchMinutes]);

  const { monthlyRepeatVolume, monthlyTax, annualTax, monthlyHours } = computeQuickSupportTax({
    monthlyTickets,
    costPerTicket,
    repeatShare: repeatPct / 100,
    touchHoursPerTicket: touchMinutes / 60,
  });

  return (
    <div className="glass rounded-2xl border border-border p-5 sm:p-7">
      <div className="mb-7 max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-primary">
          30-second calculator
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Manual repeat tickets are not free.
        </h2>
        <p className="mt-3 leading-relaxed text-foreground/62">
          Estimate what repeat Tier-1 work costs you each month, because your help center doesn&apos;t use
          the words your customers actually search with. Two numbers in, the size of the problem out.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* Inputs */}
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground">Tune the inputs</h3>
            <p className="mt-1 text-xs leading-relaxed text-foreground/50">
              Move the sliders or type exact numbers. The math updates as you go.
            </p>
          </div>

          <div className="space-y-6">
            <SliderField
              label="Monthly ticket volume"
              hint="Closed tickets per month"
              value={monthlyTickets}
              min={TICKETS.min}
              max={TICKETS.max}
              step={TICKETS.step}
              onChange={withEngagement(setMonthlyTickets)}
            />
            <SliderField
              label="Fully loaded cost per Tier-1 ticket"
              hint="Agent time, benefits, tooling"
              prefix="$"
              value={costPerTicket}
              min={COST.min}
              max={COST.max}
              step={COST.step}
              onChange={withEngagement(setCostPerTicket)}
            />
          </div>

          <details className="group mt-7 rounded-xl border border-border bg-surface-muted p-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
              <span>
                <span className="block text-xs font-semibold text-foreground">
                  Assumptions &mdash; think we&apos;re wrong? Change them
                </span>
                <span className="mt-1 block text-[11px] text-foreground/45">
                  Industry averages: {REPEAT_PCT.default}% repeat share, {TOUCH_MINUTES.default} min
                  touch time per ticket.
                </span>
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-foreground/45 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4 space-y-6">
              <SliderField
                label="Repeat-ticket share"
                hint="Share of volume that is repeat Tier-1 how-to"
                suffix="%"
                value={repeatPct}
                min={REPEAT_PCT.min}
                max={REPEAT_PCT.max}
                step={REPEAT_PCT.step}
                onChange={withEngagement(setRepeatPct)}
              />
              <SliderField
                label="Average touch time"
                hint="Agent minutes per repeat ticket"
                suffix=" min"
                value={touchMinutes}
                min={TOUCH_MINUTES.min}
                max={TOUCH_MINUTES.max}
                step={TOUCH_MINUTES.step}
                onChange={withEngagement(setTouchMinutes)}
              />
            </div>
          </details>
        </section>

        {/* Outputs */}
        <section className="space-y-4">
          <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary/80">
              Annual spend on repeat tickets
            </div>
            <div className="mt-2 text-5xl font-semibold tracking-tight tabular-nums text-primary">
              {usd(annualTax)}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/62">
              A directional size of what {usd(monthlyTax)} per month on repeat questions adds up to. This
              sizes current spend, not a forecast of what the Resolution Audit will save.
            </p>
            <p className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-mono leading-relaxed text-foreground/55">
              The math: {count(monthlyTickets)} tickets &times; {repeatPct}% repeat &times; $
              {costPerTicket} = {usd(monthlyTax)}/mo &rarr; {usd(annualTax)}/yr
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Repeat volume" value={count(monthlyRepeatVolume)} sub="tickets / month" />
            <Metric label="Time sink" value={count(monthlyHours)} sub="agent hours / month" />
            <Metric label="Monthly cost" value={usd(monthlyTax)} sub="spent on repeats" />
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-foreground">Ticket volume breakdown</p>
              <p className="text-xs font-mono text-foreground/45">{repeatPct}% repeat work</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-foreground/[0.08]">
              <div
                className="h-full rounded-full bg-primary/80"
                style={{ width: `${repeatPct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-foreground/45">
              <span>Repeat how-to tickets</span>
              <span>All other tickets</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">Resolved is not the same as fixed.</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/62">
              Repeat tickets cost you in agent time, tooling and AI-session spend, ticket overages, and
              customer frustration &mdash; but a closed or resolved ticket doesn&apos;t prove the root cause
              was fixed. The Resolution Audit reads your ticket export into a ranked, source-backed action
              queue: which questions keep coming back, the estimated cost exposure behind each, review-ready
              answers where your tickets already hold the evidence, the gaps where no proven answer exists
              yet, and the repeats that belong with product, billing, policy, or onboarding for review
              rather than another support reply.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-foreground/45">
              Deterministic parsing of your own ticket export. No AI guesswork, and you won&apos;t wait days
              for it.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
