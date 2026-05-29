'use client';

import { useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Leaky Bucket Calculator — estimates the annual cost of repeated support
// questions from user inputs and explicit assumptions. This is not a forecast of
// what the Deflection Report will save.

const TICKETS = { min: 100, max: 20000, step: 100, default: 3000 };
const AGENTS = { min: 1, max: 100, step: 1, default: 10 };
const SALARY = { min: 30000, max: 180000, step: 1000, default: 70000 };
const REPEAT = { min: 10, max: 70, step: 1, default: 50 };
const ATTRITION = { min: 0, max: 70, step: 1, default: 35 };
const CURRENT_SELF_SERVICE = { min: 0, max: 50, step: 1, default: 14 };
const TARGET_SELF_SERVICE = { min: 10, max: 75, step: 1, default: 40 };

const ANNUAL_WORK_HOURS = 2080;
const CONTEXT_MINUTES_PER_REPEAT = 10;
const REPLACEMENT_COST = 46000;
const BURNOUT_TURNOVER_SHARE = 0.7;
const HUMAN_TICKET_COST = 22;
const SELF_SERVE_TICKET_COST = 0;

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
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
      onChange(clamp(Math.round(n / step) * step, min, max));
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
    </div>
  );
}

function OutputCard({
  eyebrow,
  title,
  value,
  detail,
  tone = 'primary',
}: {
  eyebrow: string;
  title: string;
  value: string;
  detail: string;
  tone?: 'primary' | 'danger' | 'success';
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-red-300 border-red-500/25 bg-red-500/[0.04]'
      : tone === 'success'
        ? 'text-emerald-300 border-emerald-500/25 bg-emerald-500/[0.04]'
        : 'text-primary border-primary/25 bg-primary/[0.04]';

  return (
    <article className={`rounded-xl border p-5 ${toneClass}`}>
      <div className="mb-2 text-[10px] font-mono uppercase tracking-widest opacity-80">
        {eyebrow}
      </div>
      <h3 className="mb-4 text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <div className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">{value}</div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/62">{detail}</p>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

export function SupportTaxCalculator() {
  const [monthlyTickets, setMonthlyTickets] = useState(TICKETS.default);
  const [agents, setAgents] = useState(AGENTS.default);
  const [salary, setSalary] = useState(SALARY.default);
  const [repeatPct, setRepeatPct] = useState(REPEAT.default);
  const [attritionPct, setAttritionPct] = useState(ATTRITION.default);
  const [currentSelfServicePct, setCurrentSelfServicePct] = useState(CURRENT_SELF_SERVICE.default);
  const [targetSelfServicePct, setTargetSelfServicePct] = useState(TARGET_SELF_SERVICE.default);

  const monthlyRepeatTickets = monthlyTickets * (repeatPct / 100);
  const hourlyRate = salary / ANNUAL_WORK_HOURS;
  const monthlyContextHours = (monthlyRepeatTickets * CONTEXT_MINUTES_PER_REPEAT) / 60;
  const annualContextLeak = monthlyContextHours * 12 * hourlyRate;

  const agentsLostPerYear = agents * (attritionPct / 100);
  const annualAttritionTax = agentsLostPerYear * REPLACEMENT_COST * BURNOUT_TURNOVER_SHARE;

  const selfServiceDelta = Math.max(0, targetSelfServicePct - currentSelfServicePct) / 100;
  const annualSelfServiceOpportunity =
    monthlyRepeatTickets * 12 * selfServiceDelta * (HUMAN_TICKET_COST - SELF_SERVE_TICKET_COST);

  const totalVisibleLeak = annualContextLeak + annualAttritionTax + annualSelfServiceOpportunity;

  return (
    <div className="glass rounded-2xl border border-border p-5 sm:p-7">
      <div className="mb-7 max-w-3xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-mono uppercase tracking-widest text-primary">
          Leaky bucket calculator
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          See where repeated questions drain budget.
        </h2>
        <p className="mt-3 leading-relaxed text-foreground/62">
          Model three leaks most teams feel but rarely measure: context assembly, repetition-driven
          attrition, and the self-service opportunity hiding in repeat questions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-foreground">Operating inputs</h3>
            <p className="mt-1 text-xs leading-relaxed text-foreground/50">
              Start with a B2B SaaS support baseline. Tune the assumptions to match your queue.
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
              label="Frontline support agents"
              hint="Tier-1 agents actively closing tickets"
              value={agents}
              min={AGENTS.min}
              max={AGENTS.max}
              step={AGENTS.step}
              onChange={setAgents}
            />
            <SliderField
              label="Average loaded salary"
              hint="Salary, benefits, tooling allocation"
              prefix="$"
              value={salary}
              min={SALARY.min}
              max={SALARY.max}
              step={SALARY.step}
              onChange={setSalary}
            />
            <SliderField
              label="Repeat-question share"
              hint="Questions customers ask again and again"
              suffix="%"
              value={repeatPct}
              min={REPEAT.min}
              max={REPEAT.max}
              step={REPEAT.step}
              onChange={setRepeatPct}
            />
            <SliderField
              label="Annual agent attrition"
              hint="Departures per year across frontline support"
              suffix="%"
              value={attritionPct}
              min={ATTRITION.min}
              max={ATTRITION.max}
              step={ATTRITION.step}
              onChange={setAttritionPct}
            />
            <SliderField
              label="Current self-service resolution"
              hint="What your current help center resolves today"
              suffix="%"
              value={currentSelfServicePct}
              min={CURRENT_SELF_SERVICE.min}
              max={CURRENT_SELF_SERVICE.max}
              step={CURRENT_SELF_SERVICE.step}
              onChange={setCurrentSelfServicePct}
            />
            <SliderField
              label="Target self-service resolution"
              hint="A conservative target for findable docs"
              suffix="%"
              value={targetSelfServicePct}
              min={TARGET_SELF_SERVICE.min}
              max={TARGET_SELF_SERVICE.max}
              step={TARGET_SELF_SERVICE.step}
              onChange={setTargetSelfServicePct}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary/80">
              Annual visible leak
            </div>
            <div className="mt-2 text-5xl font-semibold tracking-tight tabular-nums text-primary">
              {usd(totalVisibleLeak)}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-foreground/62">
              Directional budget exposed by the assumptions below. This is not a forecast of what
              the Deflection Report will save.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Metric label="Repeat tickets / mo" value={count(monthlyRepeatTickets)} />
            <Metric label="Context hours / mo" value={count(monthlyContextHours)} />
            <Metric label="Self-service delta" value={`${Math.round(selfServiceDelta * 100)}%`} />
          </div>

          <OutputCard
            eyebrow="Leak 01"
            title="Context assembly leak"
            value={usd(annualContextLeak)}
            detail={`Assumes ${CONTEXT_MINUTES_PER_REPEAT} minutes of context gathering for each repeat question before the agent can answer.`}
          />
          <OutputCard
            eyebrow="Leak 02"
            title="Burnout attrition tax"
            value={usd(annualAttritionTax)}
            detail={`Assumes ${Math.round(BURNOUT_TURNOVER_SHARE * 100)}% of attrition is tied to repetitive frontline support load and a ${usd(REPLACEMENT_COST)} replacement cost.`}
            tone="danger"
          />
          <OutputCard
            eyebrow="Opportunity"
            title="Self-service budget opportunity"
            value={usd(annualSelfServiceOpportunity)}
            detail={`Shows the annual ticket cost affected if findable help-center pages move repeat questions from ${currentSelfServicePct}% to ${targetSelfServicePct}% self-service resolution.`}
            tone="success"
          />

          <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-foreground">What to do with this number</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/62">
              Upload 3-6 months of tickets. The free snapshot shows whether repeat questions are
              actually there, which customer wording is missing, and one review-ready FAQ draft
              built from resolved replies.
            </p>
            <Link
              href="/systems/support-ticket-deflection/intake"
              className="group mt-4 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-medium text-black transition-all hover:bg-primary/90"
            >
              Upload tickets — get a free Deflection Snapshot
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
