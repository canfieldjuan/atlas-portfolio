'use client';

import { Lock } from 'lucide-react';
import type {
  DeflectionSnapshotLockedQuestion,
  DeflectionSnapshotQuestion,
} from '@/lib/deflection-snapshot';

const integerFormatter = new Intl.NumberFormat('en-US');
const wholeUsdFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 0,
  style: 'currency',
});
const fractionalUsdFormatter = new Intl.NumberFormat('en-US', {
  currency: 'USD',
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
  style: 'currency',
});

function usd(value: number) {
  return wholeUsdFormatter.format(Math.round(value));
}

function count(value: number) {
  return integerFormatter.format(Math.round(value));
}

function costLabel(value: number) {
  return (value % 1 === 0 ? wholeUsdFormatter : fractionalUsdFormatter).format(value);
}

export function DeflectionTopQuestionRows({
  questions,
  assistedContactCost,
  limit,
}: {
  questions: DeflectionSnapshotQuestion[];
  assistedContactCost: number;
  limit?: number;
}) {
  const visibleQuestions =
    typeof limit === 'number' ? questions.slice(0, limit) : questions;
  const maxTicketCount =
    visibleQuestions.reduce((max, question) => Math.max(max, question.ticket_count), 0) || 1;

  return (
    <ol className="mt-5 space-y-3">
      {visibleQuestions.map((question) => {
        const customerWording = question.customer_wording.trim();

        return (
          <li
            key={question.rank}
            className="glass flex items-start gap-4 rounded-xl border border-border/80 p-4 shadow-[0_4px_20px_rgba(23,35,31,0.01)] transition-all duration-300 hover:border-primary/30"
          >
            <span className="mt-0.5 w-6 shrink-0 text-center font-mono text-sm font-bold text-primary">
              #{question.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug text-foreground">
                {question.question}
              </p>
              {customerWording && (
                <p className="mt-1 text-xs text-foreground/50">
                  target phrase from your tickets: &ldquo;{customerWording}&rdquo;
                </p>
              )}
              <p className="mt-2 text-xs leading-relaxed text-foreground/50">
                Hit your queue{' '}
                <strong className="text-foreground/70">
                  {count(question.ticket_count)}
                </strong>{' '}
                times in this upload, possibly costing{' '}
                <strong className="text-foreground/70">
                  {usd(question.ticket_count * assistedContactCost)}
                </strong>{' '}
                at {costLabel(assistedContactCost)} per assisted contact.
              </p>
            </div>
            <div className="flex h-full shrink-0 flex-col items-end justify-center text-right">
              <span className="rounded bg-foreground/5 px-2 py-0.5 font-mono text-xs font-bold text-foreground/80">
                {count(question.ticket_count)}x
              </span>
              <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark"
                  style={{
                    width: `${Math.round((question.ticket_count / maxTicketCount) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function DeflectionLockedQuestionRows({
  questions,
  assistedContactCost,
  showFade = false,
}: {
  questions: DeflectionSnapshotLockedQuestion[];
  assistedContactCost: number;
  showFade?: boolean;
}) {
  return (
    <div className="relative">
      <ol
        className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-border bg-surface p-3 pr-2
          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-border/60
          [&::-webkit-scrollbar-track]:bg-transparent"
      >
        {questions.map((question) => (
          <li
            key={question.rank}
            className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5 transition-colors hover:bg-background/60"
          >
            <span className="w-10 shrink-0 text-center font-mono text-xs text-foreground/45">
              #{question.rank}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground/60">
                <Lock className="h-3.5 w-3.5 text-foreground/30" />
                <span>Question text withheld</span>
              </div>
              <p className="mt-0.5 text-[11px] text-foreground/45">
                <strong className="text-foreground/60">
                  {count(question.ticket_count)}
                </strong>{' '}
                repeat tickets -{' '}
                <strong className="text-foreground/60">
                  {usd(question.ticket_count * assistedContactCost)}
                </strong>{' '}
                estimated cost
              </p>
            </div>
          </li>
        ))}
      </ol>
      {showFade && (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 rounded-b-xl border-b border-border/10 bg-gradient-to-t from-background to-transparent" />
      )}
    </div>
  );
}

export function DeflectionTopBlindSpotRows({
  questions,
  assistedContactCost,
  limit,
}: {
  questions: DeflectionSnapshotQuestion[];
  assistedContactCost: number;
  limit?: number;
}) {
  const visibleQuestions =
    typeof limit === 'number' ? questions.slice(0, limit) : questions;
  const maxTicketCount =
    visibleQuestions.reduce((max, question) => Math.max(max, question.ticket_count), 0) || 1;

  if (visibleQuestions.length === 0) return null;

  return (
    <ol className="mt-4 space-y-3">
      {visibleQuestions.map((question) => {
        const customerWording = question.customer_wording.trim();

        return (
          <li
            key={question.rank}
            className="glass flex items-start gap-4 rounded-xl border border-red-500/20 bg-red-500/[0.02] p-4 shadow-sm transition-all duration-300 hover:border-red-500/40"
          >
            <span className="mt-0.5 w-6 shrink-0 text-center font-mono text-sm font-bold text-red-500/90">
              #{question.rank}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold leading-snug text-foreground">
                {question.question}
              </p>
              {customerWording && (
                <p className="mt-1 text-xs text-foreground/50">
                  target phrase from your tickets: &ldquo;{customerWording}&rdquo;
                </p>
              )}
              <p className="mt-2 text-xs leading-relaxed text-foreground/50">
                Hit your queue{' '}
                <strong className="text-foreground/70">
                  {count(question.ticket_count)}
                </strong>{' '}
                times in this upload, possibly costing{' '}
                <strong className="text-foreground/70">
                  {usd(question.ticket_count * assistedContactCost)}
                </strong>{' '}
                at {costLabel(assistedContactCost)} per assisted contact, with NO clear resolution pattern found.
              </p>
            </div>
            <div className="flex h-full shrink-0 flex-col items-end justify-center text-right">
              <span className="rounded bg-red-500/10 px-2 py-0.5 font-mono text-xs font-bold text-red-500/90">
                {count(question.ticket_count)}x
              </span>
              <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500/60 to-red-500/90"
                  style={{
                    width: `${Math.round((question.ticket_count / maxTicketCount) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
