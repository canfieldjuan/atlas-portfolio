'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, Search, X } from 'lucide-react';
import {
  DEMO_CHIPS,
  searchDeflection,
  type DeflectionSearchSource,
  type FAQTermMapping,
  type TicketFAQItem,
} from '@/lib/deflection-demo';

// Interactive demo: type a question a customer asks, see one TicketFAQItem-shaped
// report finding beside the draft FAQ fields the team would review. Modular:
// all data/search comes from
// `@/lib/deflection-demo` (the backend seam); this component only renders.
// The free snapshot page renders a smaller shape; this card demonstrates the
// paid report drill-down item.

type Phase = 'idle' | 'searching' | 'result' | 'no-match' | 'error';

const resultSourceLabel: Record<DeflectionSearchSource, string> = {
  local: 'Illustrative · sample dataset',
  atlas: 'Atlas-backed · approved data',
};

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function EvidenceStatus({ status }: { status: TicketFAQItem['answer_evidence_status'] }) {
  const label = status === 'resolution_evidence' ? 'Resolved-answer evidence' : 'Draft needs review';

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-primary">
      <Check className="h-3 w-3" />
      {label}
    </span>
  );
}

function SourceEvidence({
  sourceIds,
  sourceLabels,
}: {
  sourceIds: string[];
  sourceLabels: string[];
}) {
  const visibleSources = (sourceLabels.length > 0 ? sourceLabels : sourceIds).slice(0, 4);
  const omittedSourceCount = Math.max(0, sourceIds.length - visibleSources.length);

  return (
    <div className="flex flex-wrap gap-2">
      {visibleSources.map((source, index) => (
        <span
          key={`${source}-${index}`}
          className="rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-mono text-foreground/55"
        >
          {source}
        </span>
      ))}
      {omittedSourceCount > 0 && (
        <span className="rounded-md border border-border bg-surface px-2.5 py-1 text-[11px] font-mono text-foreground/45">
          +{omittedSourceCount} more
        </span>
      )}
    </div>
  );
}

function TermMappings({ mappings }: { mappings: FAQTermMapping[] }) {
  if (mappings.length === 0) return null;

  return (
    <div>
      <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
        Customer words vs doc words
      </div>
      <div className="space-y-2">
        {mappings.slice(0, 3).map((mapping) => (
          <div
            key={`${mapping.customer_term}-${mapping.documentation_term}`}
            className="rounded-lg border border-border bg-surface p-3"
          >
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="mb-1 font-mono uppercase tracking-widest text-[9px] text-foreground/35">
                  Customer term
                </div>
                <div className="font-medium text-foreground">&ldquo;{mapping.customer_term}&rdquo;</div>
              </div>
              <div>
                <div className="mb-1 font-mono uppercase tracking-widest text-[9px] text-foreground/35">
                  Current docs say
                </div>
                <div className="font-medium text-foreground/70">
                  &ldquo;{mapping.documentation_term}&rdquo;
                </div>
              </div>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-foreground/55">
              {mapping.suggestion}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportFindingCard({ item }: { item: TicketFAQItem }) {
  return (
    <div className="flex flex-col rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/45">
          Report finding
        </span>
        <EvidenceStatus status={item.answer_evidence_status} />
      </div>

      <h3 className="mb-4 text-base font-semibold leading-snug text-foreground">
        {titleCase(item.topic)}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-2xl font-semibold tabular-nums text-foreground">
            {item.ticket_count.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            Repeat tickets
          </div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-3">
          <div className="text-2xl font-semibold tabular-nums text-primary">
            {item.source_ids.length.toLocaleString()}
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            Source tickets
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            Customer wording
          </div>
          <p className="text-sm leading-relaxed text-foreground/75">
            &ldquo;{item.question}&rdquo;
          </p>
        </div>

        <TermMappings mappings={item.term_mappings} />

        <div>
          <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            Source evidence
          </div>
          <SourceEvidence sourceIds={item.source_ids} sourceLabels={item.source_labels} />
        </div>
      </div>
    </div>
  );
}

function FaqDraftCard({ item }: { item: TicketFAQItem }) {
  return (
    <div className="flex flex-col rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/45">
          FAQ draft
        </span>
        <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground/45">
          {item.steps.length} steps
        </span>
      </div>
      <h3 className="mb-3 text-base font-semibold leading-snug text-foreground">{item.question}</h3>
      <p className="mb-4 text-sm leading-relaxed text-foreground/65">{item.answer}</p>
      <ol className="space-y-1.5 mb-4">
        {item.steps.map((step, i) => (
          <li key={i} className="flex gap-2 text-sm text-foreground/70 leading-relaxed">
            <span className="font-mono text-xs text-primary/70 mt-0.5">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
      <div className="mb-4 rounded-lg border border-border bg-background/40 p-3 text-xs leading-relaxed text-foreground/60">
        <span className="font-medium text-foreground/75">When to contact support: </span>
        {item.when_to_contact_support}
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {item.action_items.map((action) => (
          <span
            key={action}
            className="text-xs px-3 py-1.5 rounded-md border border-primary/30 text-primary"
          >
            {action}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DeflectionDemo() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [item, setItem] = useState<TicketFAQItem | null>(null);
  const [resultSource, setResultSource] = useState<DeflectionSearchSource>('local');
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
      setItem(null);
      setResultSource('local');
      return;
    }
    setPhase('searching');
    try {
      const found = await searchDeflection(q);
      if (reqId !== reqRef.current) return; // superseded by a newer search
      setItem(found.match);
      setResultSource(found.source);
      setPhase(found.match ? 'result' : 'no-match');
    } catch {
      // Once searchDeflection is a real fetch, a network/API failure rejects
      // here — recover to a visible, retryable state instead of freezing on
      // 'searching' with an unhandled rejection.
      if (reqId !== reqRef.current) return;
      setItem(null);
      setResultSource('local');
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
      setItem(null);
      setResultSource('local');
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
              placeholder={'e.g. "export reports" or "webhook retries"'}
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
          Pick a question above. You&apos;ll see the kind of report finding your team would review:
          customer wording, term mappings, source-ticket evidence, and a drafted FAQ.
        </p>
      )}

      {phase === 'searching' && (
        <div className="flex items-center gap-2 text-sm text-foreground/55 px-1">
          <Loader2 className="w-4 h-4 animate-spin" /> Matching against the sample ticket dataset…
        </div>
      )}

      {phase === 'no-match' && (
        <div className="glass rounded-xl border border-border p-6 text-sm text-foreground/60 leading-relaxed">
          No close match in this short sample set. The real Report runs against <em>your</em> 3–6-month
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

      {phase === 'result' && item && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-5"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
            <h2 className="text-lg font-semibold text-foreground">
              {titleCase(item.topic)}: ranked finding and draft FAQ
            </h2>
            <span className="text-[11px] font-mono uppercase tracking-widest text-foreground/40">
              {resultSourceLabel[resultSource]}
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ReportFindingCard item={item} />
            <FaqDraftCard item={item} />
          </div>
        </motion.div>
      )}
    </div>
  );
}
