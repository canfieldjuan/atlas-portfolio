'use client';

import { useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import {
  clampToStep,
  computeQuickSupportTax,
  QUICK_REPEAT_SHARE,
} from '@/lib/support-tax-math';

// The 30-Second Support Tax Calculator. A simpler, manager-facing cut of the
// leaky-bucket model: two inputs (ticket volume + fully loaded cost per ticket)
// sized against fixed assumptions, showing the monthly cost and agent-hours spent
// re-answering repeat questions. This sizes current spend; it is not a forecast of
// what the Resolution Audit will save. Math lives in @/lib/support-tax-math.

const TICKETS = { min: 100, max: 10000, step: 50, default: 1500 };
const COST = { min: 10, max: 30, step: 1, default: 15 };

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
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  prefix?: string;
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
        </span>
        <span>
          {prefix}
          {max.toLocaleString()}
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
  const [monthlyTickets, setMonthlyTickets] = useState(TICKETS.default);
  const [costPerTicket, setCostPerTicket] = useState(COST.default);

  const { monthlyRepeatVolume, monthlyTax, annualTax, monthlyHours } = computeQuickSupportTax({
    monthlyTickets,
    costPerTicket,
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
              onChange={setMonthlyTickets}
            />
            <SliderField
              label="Fully loaded cost per Tier-1 ticket"
              hint="Agent time, benefits, tooling"
              prefix="$"
              value={costPerTicket}
              min={COST.min}
              max={COST.max}
              step={COST.step}
              onChange={setCostPerTicket}
            />
          </div>

          <div className="mt-7 rounded-xl border border-border bg-surface-muted p-4">
            <h4 className="text-xs font-semibold text-foreground">Industry-average assumptions</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Metric label="Repeat tickets" value="40%" sub="repetitive Tier-1 how-to" />
              <Metric label="Avg. touch time" value="12 min" sub="0.2 support hours each" />
            </div>
          </div>
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
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Repeat volume" value={count(monthlyRepeatVolume)} sub="tickets / month" />
            <Metric label="Time sink" value={count(monthlyHours)} sub="agent hours / month" />
            <Metric label="Monthly cost" value={usd(monthlyTax)} sub="spent on repeats" />
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-foreground">Ticket volume breakdown</p>
              <p className="text-xs font-mono text-foreground/45">{Math.round(QUICK_REPEAT_SHARE * 100)}% repeat work</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-foreground/[0.08]">
              <div
                className="h-full rounded-full bg-primary/80"
                style={{ width: `${QUICK_REPEAT_SHARE * 100}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-foreground/45">
              <span>Repeat how-to tickets</span>
              <span>All other tickets</span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">Why is this happening?</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/62">
              Your help center speaks your product&apos;s language, but your customers speak their own. Your
              team loses hours re-answering questions because the FAQ doesn&apos;t use the words customers
              reach for when they get stuck.
            </p>
            <Link
              href="/systems/support-ticket-deflection/intake"
              className="group mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-white transition-all hover:bg-primary-dark"
            >
              Start Your Forensic Audit
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
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
