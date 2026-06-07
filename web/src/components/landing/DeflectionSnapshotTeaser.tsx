'use client';

import { Lock } from 'lucide-react';
import type {
  DeflectionSnapshotAnswerPreview,
  DeflectionSnapshotFullAnswer,
} from '@/lib/deflection-snapshot';

export function teaserAnswerLabel(answer: DeflectionSnapshotFullAnswer) {
  if (answer.rank === 1) {
    return 'Sample answer for your #1 most-asked question';
  }
  return `Sample answer for ranked question #${answer.rank}`;
}

export function DeflectionTeaserAnswer({
  answer,
}: {
  answer: DeflectionSnapshotFullAnswer;
}) {
  return (
    <article className="overflow-hidden rounded-2xl border border-primary/30 bg-surface shadow-[var(--primary-glow)]">
      <div className="flex items-center justify-between gap-4 border-b border-border bg-foreground/[0.02] px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Draft ready for review
          </span>
        </div>
        <div className="text-[10px] font-mono text-foreground/45">
          Rank #{answer.rank} - {answer.source_count} source tickets
        </div>
      </div>
      <div className="p-6">
        <div className="mb-3 text-[10px] font-mono font-semibold uppercase tracking-widest text-primary">
          {teaserAnswerLabel(answer)}
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          {answer.question}
        </h2>
        <div className="mt-4 rounded-xl border border-border/60 bg-background/50 p-4 text-base leading-relaxed text-foreground/80">
          {answer.answer}
        </div>
        {answer.steps.length > 0 && (
          <div className="mt-5">
            <h4 className="mb-3 text-xs font-mono uppercase tracking-wider text-foreground/50">
              Resolution Steps:
            </h4>
            <ol className="space-y-3">
              {answer.steps.map((step, index) => (
                <li key={`${answer.rank}-${index}`} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/5 text-xs font-mono font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-foreground/72">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4 text-xs text-foreground/50">
          <span>
            This live draft was verified from your team&apos;s past resolved replies.
          </span>
          <span className="flex items-center gap-1 font-medium text-primary">
            <Lock className="h-3 w-3" /> Source tickets included in full report
          </span>
        </div>
      </div>
    </article>
  );
}

export function DeflectionTeaserPreviewCard({
  preview,
}: {
  preview: DeflectionSnapshotAnswerPreview;
}) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-widest text-foreground/45">
        <span>Draft #{preview.rank}</span>
        <span>{preview.source_count} sources</span>
      </div>
      <h3 className="text-sm font-semibold leading-snug text-foreground">{preview.question}</h3>
      <div className="mt-4 space-y-2 blur-[2px]" aria-hidden="true">
        <div className="h-2.5 w-full rounded-full bg-foreground/14" />
        <div className="h-2.5 w-5/6 rounded-full bg-foreground/12" />
        <div className="h-2.5 w-2/3 rounded-full bg-foreground/10" />
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-foreground/55">
        <Lock className="h-3.5 w-3.5 text-foreground/40" />
        <span>{preview.step_count} drafted steps withheld in the full report</span>
      </div>
    </article>
  );
}
