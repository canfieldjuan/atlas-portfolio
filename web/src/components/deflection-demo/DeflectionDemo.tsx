'use client';

import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, FileText, Loader2, Search, X } from 'lucide-react';
import Link from 'next/link';
import {
  DEMO_CHIPS,
  estimateSavings,
  searchDeflection,
  type DeflectionDoc,
  type DeflectionIssue,
} from '@/lib/deflection-demo';

// Interactive demo: type a question a customer asks, see what the help center
// returns today (a jargon-y doc) vs the actionable, customer-language answer the
// Support Ticket Deflection Report would publish — plus an illustrative volume.
// Modular: all data/search comes from `@/lib/deflection-demo` (the backend seam);
// this component only renders. Numbers are illustrative, not a guaranteed result.

type Phase = 'idle' | 'searching' | 'result' | 'no-match';

function MatchBar({ score, tone }: { score: number; tone: 'muted' | 'primary' }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
      <div
        className={`h-full rounded-full ${tone === 'primary' ? 'bg-primary' : 'bg-foreground/30'}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

function DocCard({
  doc,
  variant,
}: {
  doc: DeflectionDoc;
  variant: 'today' | 'report';
}) {
  const isReport = variant === 'report';
  return (
    <div
      className={`rounded-xl border p-5 flex flex-col ${
        isReport ? 'border-primary/30 bg-primary/[0.04]' : 'border-border bg-surface'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/45">
          {isReport ? 'What the Report would publish' : 'What your help center returns today'}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest ${
            isReport ? 'text-primary' : 'text-foreground/40'
          }`}
        >
          {isReport ? <Check className="w-3 h-3" /> : null}
          {doc.matchLabel}
        </span>
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2 leading-snug">{doc.title}</h3>
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] text-foreground/45 mb-1">
          <span>Intent match</span>
          <span className="font-mono">{doc.matchScore}%</span>
        </div>
        <MatchBar score={doc.matchScore} tone={isReport ? 'primary' : 'muted'} />
      </div>
      {isReport ? (
        <ol className="space-y-1.5 mb-4">
          {doc.body.split('\n').map((step, i) => (
            <li key={i} className="flex gap-2 text-sm text-foreground/70 leading-relaxed">
              <span className="font-mono text-xs text-primary/70 mt-0.5">{i + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-foreground/55 leading-relaxed mb-4">{doc.body}</p>
      )}
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {doc.actions.map((action) => (
          <span
            key={action}
            className={`text-xs px-3 py-1.5 rounded-md border ${
              isReport
                ? 'border-primary/30 text-primary'
                : 'border-border text-foreground/50'
            }`}
          >
            {action}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-foreground/40">{doc.format}</p>
    </div>
  );
}

export function DeflectionDemo() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [issue, setIssue] = useState<DeflectionIssue | null>(null);

  async function runSearch(raw: string) {
    const q = raw.trim();
    setQuery(raw);
    if (!q) {
      setPhase('idle');
      setIssue(null);
      return;
    }
    setPhase('searching');
    const found = await searchDeflection(q);
    setIssue(found);
    setPhase(found ? 'result' : 'no-match');
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void runSearch(query);
  }

  const savings = issue ? estimateSavings(issue) : null;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="glass rounded-2xl border border-border p-5 sm:p-6">
        <label htmlFor="deflection-q" className="block text-[10px] font-mono uppercase tracking-widest text-foreground/45 mb-2">
          Type a question your customers keep asking
        </label>
        <form onSubmit={onSubmit}>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 focus-within:border-primary/60 transition-colors">
            <Search className="w-4 h-4 text-foreground/40 shrink-0" />
            <input
              id="deflection-q"
              type="text"
              value={query}
              onChange={(e) => void runSearch(e.target.value)}
              placeholder={'e.g. "I can\'t log in" or "charged twice"'}
              autoComplete="off"
              className="flex-1 bg-transparent outline-none text-sm sm:text-base text-foreground placeholder:text-foreground/35"
            />
            {query && (
              <button
                type="button"
                onClick={() => void runSearch('')}
                aria-label="Clear"
                className="text-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-widest text-foreground/40 mr-0.5">
            Try
          </span>
          {DEMO_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => void runSearch(chip)}
              className="px-3 py-1.5 rounded-full border border-border bg-surface text-sm text-foreground/65 hover:border-primary/40 hover:text-foreground transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* States */}
      {phase === 'idle' && (
        <p className="text-sm text-foreground/50 leading-relaxed px-1">
          Pick a question above. You&apos;ll see the jargon-y article a customer hits in most help
          centers today, beside the actionable, customer-language answer the Deflection Report
          would have your team publish.
        </p>
      )}

      {phase === 'searching' && (
        <div className="flex items-center gap-2 text-sm text-foreground/55 px-1">
          <Loader2 className="w-4 h-4 animate-spin" /> Matching against the sample ticket dataset…
        </div>
      )}

      {phase === 'no-match' && (
        <div className="glass rounded-xl border border-border p-6 text-sm text-foreground/60 leading-relaxed">
          No close match in this short sample set. The real Report runs against <em>your</em> 90-day
          ticket export, where repeat questions like this surface by volume — try one of the chips
          above to see the comparison.
        </div>
      )}

      {phase === 'result' && issue && savings && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
            <h2 className="text-lg font-semibold text-foreground">
              {issue.intent}: the same intent, two very different answers
            </h2>
            <span className="text-[11px] font-mono uppercase tracking-widest text-foreground/40">
              Illustrative · sample dataset
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DocCard doc={issue.traditional} variant="today" />
            <DocCard doc={issue.improved} variant="report" />
          </div>

          {/* Illustrative volume — no guaranteed result */}
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-semibold text-foreground tabular-nums">
                  {savings.ticketsPerMonth.toLocaleString()}
                </div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-foreground/40 mt-1">
                  Tickets / mo (sample)
                </div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-primary tabular-nums">
                  ~{savings.deflectedPerMonth.toLocaleString()}
                </div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-foreground/40 mt-1">
                  Could self-serve
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-2xl font-semibold text-foreground tabular-nums">
                  ~${savings.monthlySavings.toLocaleString()}
                </div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-foreground/40 mt-1">
                  At ${issue.costPerTicket}/ticket
                </div>
              </div>
            </div>
            <p className="mt-4 text-[11px] text-foreground/45 leading-relaxed">
              Illustrative, from a public complaint dataset — not a guaranteed result. The Report
              ranks <em>your</em> repeat questions by real volume and drafts answers your team reviews.
            </p>
          </div>
        </motion.div>
      )}

      {/* Bottom CTA (kept) */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center shadow-[var(--primary-glow)]">
        <FileText className="w-7 h-7 text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          See this run on your own tickets
        </h2>
        <p className="text-sm text-foreground/60 mb-6 max-w-xl mx-auto leading-relaxed">
          Upload a CSV of your last 90 days of closed tickets. We send back a free Deflection
          Snapshot: your top repeat questions, the wording customers use, and a sample answer.
        </p>
        <Link
          href="/systems/support-ticket-deflection/intake"
          className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
        >
          Upload your CSV — get a free Snapshot
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
