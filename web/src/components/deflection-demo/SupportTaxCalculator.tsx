'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Support Tax Calculator — estimates the monthly/annual cost of repeat Tier-1
// tickets from the USER's own inputs (ticket volume + cost per ticket) plus an
// adjustable repeat-rate assumption. Ported from the operator's standalone HTML,
// re-themed to our tokens and re-voiced. The numbers are the user's own estimate
// from their inputs — not a product cost-claim and not a forecast of what the
// Report will save (see the disclaimer + the funnel brief's claims section).

const TOUCH_HOURS = 0.2; // ~12 minutes average handle time per repeat ticket
const VOLUME = { min: 100, max: 10000, step: 50, default: 1500 };
const COST = { min: 10, max: 30, step: 1, default: 15 };
const REPEAT = { min: 10, max: 60, step: 5, default: 40 }; // percent

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;

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
  // The number input is uncontrolled (keyed on `value` so a slider move remounts it
  // with the new default) — so typing isn't clamped on every keystroke; commit on
  // blur/Enter. No setState-in-effect needed to keep it in sync with the slider.
  const commit = (raw: string) => {
    const n = Number(raw);
    if (raw.trim() !== '' && Number.isFinite(n)) {
      onChange(clamp(Math.round(n / step) * step, min, max));
    }
  };

  return (
    <div>
      <div className="flex items-end justify-between gap-3 mb-2">
        <div>
          <label className="text-sm font-medium text-foreground">{label}</label>
          <div className="text-[11px] text-foreground/45">{hint}</div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {prefix && <span className="text-sm text-foreground/50">{prefix}</span>}
          <input
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={step}
            key={value}
            defaultValue={value}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            aria-label={label}
            className="w-24 rounded-lg border border-border bg-surface px-3 py-2 text-right text-sm font-semibold text-foreground tabular-nums outline-none focus:border-primary/60 transition-colors"
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
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`${label} slider`}
        style={{ accentColor: 'var(--primary)' }}
        className="w-full cursor-pointer"
      />
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">{label}</div>
      <div className="text-xl font-semibold text-foreground tabular-nums mt-1">{value}</div>
      <div className="text-[11px] text-foreground/40 mt-0.5">{sub}</div>
    </div>
  );
}

export function SupportTaxCalculator() {
  const [volume, setVolume] = useState(VOLUME.default);
  const [cost, setCost] = useState(COST.default);
  const [repeatPct, setRepeatPct] = useState(REPEAT.default);

  const repeatVolume = Math.round(volume * (repeatPct / 100));
  const monthlyCost = repeatVolume * cost;
  const annualCost = monthlyCost * 12;
  const hours = Math.round(repeatVolume * TOUCH_HOURS);

  return (
    <div className="glass rounded-2xl border border-border p-5 sm:p-7">
      <div className="mb-6 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono uppercase tracking-widest mb-4">
          30-second calculator
        </div>
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          The Support Tax Calculator
        </h2>
        <p className="mt-3 text-foreground/60 leading-relaxed">
          Estimate how much of your support load is repeat Tier-1 questions — and what that
          costs each month — from your own ticket volume and cost per ticket.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-foreground mb-1">Tune the inputs</h3>
          <p className="text-xs text-foreground/50 mb-6">
            Move the sliders or type exact numbers; the estimate updates live.
          </p>

          <div className="space-y-6">
            <SliderField
              label="Monthly ticket volume"
              hint="100–10,000 tickets"
              value={volume}
              min={VOLUME.min}
              max={VOLUME.max}
              step={VOLUME.step}
              onChange={setVolume}
            />
            <SliderField
              label="Fully-loaded cost per Tier-1 ticket"
              hint="$10–$30 per ticket"
              prefix="$"
              value={cost}
              min={COST.min}
              max={COST.max}
              step={COST.step}
              onChange={setCost}
            />
            <SliderField
              label="Repeat Tier-1 share"
              hint="industry-average assumption — adjust to your reality"
              suffix="%"
              value={repeatPct}
              min={REPEAT.min}
              max={REPEAT.max}
              step={REPEAT.step}
              onChange={setRepeatPct}
            />
          </div>

          <p className="mt-6 text-[11px] text-foreground/45 leading-relaxed">
            Assumes {repeatPct}% of volume is repeat Tier-1 how-to tickets at ~12 minutes
            (0.2 hrs) of touch time each.
          </p>
        </div>

        {/* Outputs */}
        <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5 flex flex-col">
          <span className="text-[10px] font-mono uppercase tracking-widest text-primary mb-3">
            Your monthly cost of repeat tickets
          </span>

          <div className="rounded-xl border border-border bg-surface p-4 mb-3">
            <div className="text-[11px] font-mono uppercase tracking-widest text-foreground/40">
              Annual cost
            </div>
            <div className="text-4xl sm:text-5xl font-semibold tracking-tight text-primary tabular-nums mt-1">
              {usd(annualCost)}
            </div>
            <div className="text-xs text-foreground/45 mt-1">per year on repeat Tier-1 tickets</div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <Metric label="Repeat volume" value={repeatVolume.toLocaleString()} sub="tickets / mo" />
            <Metric label="Monthly cost" value={usd(monthlyCost)} sub="at your inputs" />
            <Metric label="Time sink" value={hours.toLocaleString()} sub="hrs / mo" />
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between text-[11px] text-foreground/45 mb-2">
              <span>Ticket volume breakdown</span>
              <span className="font-mono">{repeatPct}% repeat</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-foreground/10 overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${repeatPct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-foreground/40 mt-2">
              <span>Repeat how-to</span>
              <span>Everything else</span>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">Why this happens</h3>
            <p className="text-sm text-foreground/60 leading-relaxed">
              Your help center is written in your product&apos;s language; customers search in
              their own. Agents lose hours re-answering questions whose FAQ articles don&apos;t
              use the words customers actually type when they&apos;re stuck.
            </p>
          </div>

          <Link
            href="/systems/support-ticket-deflection/intake"
            className="group mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
          >
            Get a free Deflection Snapshot
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <p className="mt-3 text-[11px] text-foreground/45 leading-relaxed">
            Illustrative estimate from your inputs + a stated {repeatPct}% / 12-min assumption —
            not a forecast of what the Report will save.
          </p>
        </div>
      </div>
    </div>
  );
}
