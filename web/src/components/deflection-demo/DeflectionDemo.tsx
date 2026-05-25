'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Search, X } from 'lucide-react';
import {
  DEMO_CHIPS,
  searchDeflection,
  type DeflectionDoc,
  type DeflectionIssue,
} from '@/lib/deflection-demo';

// Interactive demo: type a question a customer asks, see the actionable answer
// the Support Ticket Deflection Report would publish, beside the real demand
// behind it — the ticket volume for the issue and the source tickets cited as
// evidence. Modular: all data/search comes from
// `@/lib/deflection-demo` (the backend seam); this component only renders.
// Numbers are illustrative until wired to Atlas; never a guaranteed result.

type Phase = 'idle' | 'searching' | 'result' | 'no-match' | 'error';

function MatchBar({ score }: { score: number }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
      <div className="h-full rounded-full bg-primary" style={{ width: `${score}%` }} />
    </div>
  );
}

// The actionable answer the Report would publish (Atlas's real "improved" side).
function ReportCard({ doc }: { doc: DeflectionDoc }) {
  return (
    <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/45">
          What the Report would publish
        </span>
        <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-primary">
          <Check className="w-3 h-3" />
          {doc.matchLabel}
        </span>
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2 leading-snug">{doc.title}</h3>
      <div className="mb-3">
        <div className="flex items-center justify-between text-[11px] text-foreground/45 mb-1">
          <span>Relevance</span>
          <span className="font-mono">{doc.matchScore}%</span>
        </div>
        <MatchBar score={doc.matchScore} />
      </div>
      <ol className="space-y-1.5 mb-4">
        {doc.body.split('\n').map((step, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground/70 leading-relaxed">
            <span className="font-mono text-xs text-primary/70 mt-0.5">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {doc.actions.map((action) => (
          <span
            key={action}
            className="text-xs px-3 py-1.5 rounded-md border border-primary/30 text-primary"
          >
            {action}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[11px] text-foreground/40">{doc.format}</p>
    </div>
  );
}

// The real demand behind the question, from the Atlas search projection: the
// ticket volume for the issue + the count of source tickets cited as evidence.
function SignalsPanel({ issue }: { issue: DeflectionIssue }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 flex flex-col">
      <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/45 mb-4">
        Why this matters — real signals
      </span>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-2xl font-semibold text-foreground tabular-nums">
            {issue.ticketVolumeInSample.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-foreground/40 mt-1">
            Tickets in sample
          </div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-primary tabular-nums">
            {issue.sourceCount.toLocaleString()}
          </div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-foreground/40 mt-1">
            Source tickets
          </div>
        </div>
      </div>
      <p className="mt-auto pt-4 text-[11px] text-foreground/45 leading-relaxed">
        Both come straight from the matched FAQ: the ticket volume behind the question, and
        the source tickets cited as evidence. The answer beside this is what the Report would
        have your team review and publish.
      </p>
    </div>
  );
}

export function DeflectionDemo() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [issue, setIssue] = useState<DeflectionIssue | null>(null);
  // Monotonic request id: each search bumps it; a resolved response only updates
  // state if it is still the latest. Guards against out-of-order async results
  // once searchDeflection is wired to a real backend fetch.
  const reqRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Actual search — called by chips/submit and the debounce timer. The request-id
  // guard drops a stale earlier response once searchDeflection becomes a real fetch.
  async function runSearch(raw: string) {
    const q = raw.trim();
    const reqId = ++reqRef.current;
    if (!q) {
      setPhase('idle');
      setIssue(null);
      return;
    }
    setPhase('searching');
    try {
      const found = await searchDeflection(q);
      if (reqId !== reqRef.current) return; // superseded by a newer search
      setIssue(found);
      setPhase(found ? 'result' : 'no-match');
    } catch {
      // Once searchDeflection is a real fetch, a network/API failure rejects
      // here — recover to a visible, retryable state instead of freezing on
      // 'searching' with an unhandled rejection.
      if (reqId !== reqRef.current) return;
      setIssue(null);
      setPhase('error');
    }
  }

  // Per-keystroke: update the field immediately, debounce the search so a real
  // backend isn't hit on every character.
  function onType(raw: string) {
    setQuery(raw);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // Every edit invalidates any in-flight request immediately — so a slow
    // earlier response can't apply during the debounce window before the next
    // search fires. runSearch bumps it again when the debounced call starts.
    reqRef.current++;
    if (!raw.trim()) {
      setPhase('idle');
      setIssue(null);
      return;
    }
    debounceRef.current = setTimeout(() => void runSearch(raw), 220);
  }

  // Chips / submit / clear: search immediately.
  function searchNow(raw: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery(raw);
    void runSearch(raw);
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    searchNow(query);
  }

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

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
              onChange={(e) => onType(e.target.value)}
              placeholder={'e.g. "I can\'t log in" or "charged twice"'}
              autoComplete="off"
              className="flex-1 bg-transparent outline-none text-sm sm:text-base text-foreground placeholder:text-foreground/35"
            />
            {query && (
              <button
                type="button"
                onClick={() => searchNow('')}
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
              onClick={() => searchNow(chip)}
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
          Pick a question above. You&apos;ll see the actionable answer the Deflection Report would
          have your team publish, beside the real demand behind it — the ticket volume for the
          issue and the source tickets cited as evidence.
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
          above to see an example.
        </div>
      )}

      {phase === 'error' && (
        <div className="glass rounded-xl border border-border p-6 text-sm text-foreground/60 leading-relaxed">
          The search couldn&apos;t run just now. Try a chip above or search again — this is a
          recoverable state, not a frozen one.
        </div>
      )}

      {phase === 'result' && issue && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
            <h2 className="text-lg font-semibold text-foreground">
              {issue.intent}: the answer to publish, and the demand behind it
            </h2>
            <span className="text-[11px] font-mono uppercase tracking-widest text-foreground/40">
              Illustrative · sample dataset
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportCard doc={issue.improved} />
            <SignalsPanel issue={issue} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
