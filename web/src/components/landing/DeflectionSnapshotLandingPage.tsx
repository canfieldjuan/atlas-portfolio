import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Lock,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  DEMO_DEFLECTION_SNAPSHOT,
  type DeflectionSnapshot,
  type DeflectionSnapshotAnswerPreview,
  type DeflectionSnapshotFullAnswer,
  type DeflectionSnapshotQuestion,
} from '@/lib/deflection-snapshot';

const INTAKE_HREF = '/systems/support-ticket-deflection/intake';
const CTA_LABEL = 'Get my free Deflection Snapshot';

function PrimarySnapshotCta({ className = '' }: { className?: string }) {
  return (
    <Link
      href={INTAKE_HREF}
      className={`group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark ${className}`}
    >
      {CTA_LABEL}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono text-primary">
      {children}
    </div>
  );
}

function SnapshotQuestionRows({
  questions,
}: {
  questions: DeflectionSnapshotQuestion[];
}) {
  const maxFrequency = questions.reduce(
    (max, question) => Math.max(max, question.weighted_frequency),
    1,
  );

  return (
    <ol className="space-y-3">
      {questions.slice(0, 3).map((question) => (
        <li
          key={question.rank}
          className="grid gap-3 rounded-md border border-border bg-white/72 p-4 md:grid-cols-[2rem_minmax(0,1fr)_8rem]"
        >
          <span className="font-mono text-sm text-foreground/45">
            #{question.rank}
          </span>
          <div className="min-w-0">
            <p className="font-medium leading-snug text-foreground">
              {question.question}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/58">
              Customer wording: &quot;{question.customer_wording}&quot;
            </p>
          </div>
          <div className="md:text-right">
            <p className="font-mono text-sm text-foreground/72">
              Score {question.weighted_frequency}
            </p>
            <p className="mt-1 text-xs text-foreground/50">
              relative priority
            </p>
            <div className="mt-2 h-1.5 rounded-full bg-border">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.max(18, Math.round((question.weighted_frequency / maxFrequency) * 100))}%`,
                }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function AnswerTeaser({ answer }: { answer: DeflectionSnapshotFullAnswer }) {
  return (
    <article className="rounded-md border border-primary/25 bg-primary/[0.05] p-5">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-mono text-primary">
        <span>Drafted answer sample</span>
        <span className="rounded-md border border-primary/25 px-2 py-0.5">
          Rank #{answer.rank}
        </span>
        <span className="rounded-md border border-primary/25 px-2 py-0.5">
          {answer.source_count} source tickets
        </span>
      </div>
      <h3 className="text-lg font-semibold leading-snug text-foreground">
        {answer.question}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-foreground/72">
        {answer.answer}
      </p>
    </article>
  );
}

function PreviewPill({ preview }: { preview: DeflectionSnapshotAnswerPreview }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-white/62 px-3 py-2 text-xs">
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{preview.question}</p>
        <p className="mt-0.5 text-foreground/50">
          {preview.step_count} steps, {preview.source_count} sources
        </p>
      </div>
      <Lock className="h-4 w-4 shrink-0 text-foreground/38" />
    </div>
  );
}

function HeroProofPanel({ snapshot }: { snapshot: DeflectionSnapshot }) {
  const answer = snapshot.teaser.full_answer;
  const sourceQuestion = answer
    ? snapshot.top_questions.find((question) => question.rank === answer.rank)
    : undefined;
  const customerPhrase = sourceQuestion?.customer_wording ?? answer?.question ?? '';
  const previewCount = snapshot.teaser.previews.length;

  if (!answer) {
    return <SnapshotArtifact snapshot={snapshot} />;
  }

  return (
    <section
      aria-label="Before and after Deflection Snapshot proof"
      className="rounded-md border border-border bg-surface p-5 shadow-[var(--card-shadow)]"
    >
      <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-xs text-primary">BEFORE / AFTER SNAPSHOT PROOF</p>
          <h2 className="mt-2 text-2xl font-semibold leading-tight text-foreground">
            One ticket pattern becomes one publishable draft.
          </h2>
        </div>
        <span className="w-fit rounded-md border border-primary/25 px-2 py-1 text-xs font-mono text-primary">
          Representative demo
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0">
          <div className="border-b border-border pb-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-foreground/45">
              <FileText className="h-4 w-4" />
              Before ticket thread
            </div>
            <p className="text-lg font-medium leading-snug text-foreground">
              Customer asked: &ldquo;{customerPhrase}&rdquo;
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/58">
              ATLAS finds the repeat wording across closed tickets, then checks
              whether resolved replies contain enough scoped evidence to draft an
              answer.
            </p>
          </div>

          <div className="pt-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-primary">
              <CheckCircle2 className="h-4 w-4" />
              After drafted answer
            </div>
            <h3 className="text-lg font-semibold leading-snug text-foreground">
              {answer.question}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/72">
              {answer.answer}
            </p>
          </div>
        </div>

        <aside className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-2 text-foreground/72">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              <span>{answer.source_count} source tickets</span>
            </div>
            <div className="flex items-center gap-2 text-foreground/72">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <span>Review-ready draft</span>
            </div>
            {previewCount > 0 && (
              <div className="flex items-center gap-2 text-foreground/72">
                <Lock className="h-4 w-4 shrink-0 text-foreground/38" />
                <span>{previewCount} more previews stay gated</span>
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-mono uppercase tracking-wide text-primary">
              Free snapshot
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/62">
              Top repeats, customer wording, one sourced drafted answer.
            </p>
            <p className="mt-4 text-xs font-mono uppercase tracking-wide text-foreground/45">
              Full report
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/62">
              Complete backlog, drafts, source trail, write-next list.
            </p>
          </div>
        </aside>
      </div>

      <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-foreground/45">
        Demo values are representative. Your uploaded snapshot uses your own
        closed-ticket data and keeps the full report behind checkout.
      </p>
    </section>
  );
}

function SnapshotArtifact({
  snapshot,
  showTeaser = true,
}: {
  snapshot: DeflectionSnapshot;
  showTeaser?: boolean;
}) {
  const { summary, top_questions, teaser } = snapshot;
  const visibleQuestions = top_questions.slice(0, 3);
  const exposedRanks = new Set(visibleQuestions.map((question) => question.rank));
  if (showTeaser) {
    if (teaser.full_answer) exposedRanks.add(teaser.full_answer.rank);
    teaser.previews.forEach((preview) => exposedRanks.add(preview.rank));
  }
  const highestExposedRank = Math.max(0, ...Array.from(exposedRanks));
  const firstLockedRank = highestExposedRank + 1;
  const lockedRangeLabel =
    firstLockedRank <= summary.generated
      ? `Ranks ${firstLockedRank}-${summary.generated} stay locked`
      : 'The remaining report stays locked';

  return (
    <section
      aria-label="Representative Deflection Snapshot"
      className="rounded-md border border-border bg-surface p-4 shadow-[var(--card-shadow)] md:p-5"
    >
      <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-xs text-primary">REPRESENTATIVE SNAPSHOT</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            Repeat-question diagnostic
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md border border-border bg-white/65 px-3 py-2">
            <div className="font-mono text-lg text-foreground">{summary.generated}</div>
            <div className="text-[11px] text-foreground/50">repeats</div>
          </div>
          <div className="rounded-md border border-border bg-white/65 px-3 py-2">
            <div className="font-mono text-lg text-foreground">
              {summary.drafted_answer_count}
            </div>
            <div className="text-[11px] text-foreground/50">drafts</div>
          </div>
          <div className="rounded-md border border-border bg-white/65 px-3 py-2">
            <div className="font-mono text-lg text-foreground">
              {summary.no_proven_answer_count}
            </div>
            <div className="text-[11px] text-foreground/50">write next</div>
          </div>
        </div>
      </div>

      <SnapshotQuestionRows questions={visibleQuestions} />

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-dashed border-border bg-white/45 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Lock className="h-4 w-4 text-foreground/40" />
            {lockedRangeLabel}
          </div>
          <p className="text-sm leading-relaxed text-foreground/58">
            The real snapshot can show there is more backlog without giving away
            the full report. The paid unlock gives your team the complete list
            and the answer plan behind it.
          </p>
        </div>
        <div className="rounded-md border border-border bg-white/62 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Search className="h-4 w-4 text-primary" />
            Customer wording becomes the target list
          </div>
          <p className="text-sm leading-relaxed text-foreground/58">
            The snapshot surfaces the phrases customers already use. Your team
            decides what to publish and where it should live.
          </p>
        </div>
      </div>

      {showTeaser && teaser.full_answer && (
        <div className="mt-5">
          <AnswerTeaser answer={teaser.full_answer} />
          {teaser.previews.length > 0 && (
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {teaser.previews.map((preview) => (
                <PreviewPill key={preview.rank} preview={preview} />
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-foreground/45">
        Demo values are representative. Your uploaded snapshot uses your own
        closed-ticket data. Scores are relative ranking signals, not raw ticket
        counts or dollar estimates. The full report keeps the remaining ranked
        backlog behind checkout.
      </p>
    </section>
  );
}

function ProofList() {
  const items = [
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: 'Grounded in resolved tickets',
      body:
        'Drafted answers are built only when the ticket history contains scoped resolution evidence.',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'A real diagnostic, not a generic calculator',
      body:
        'The snapshot ranks the repeat questions and phrases from the uploaded queue before asking for the full report purchase.',
    },
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: 'No bot touches your customers',
      body:
        'The output is a review queue for your team. Nothing auto-publishes and nothing replies on your behalf.',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <article key={item.title} className="rounded-md border border-border bg-surface p-5">
          <div className="mb-3 text-primary">{item.icon}</div>
          <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground/62">{item.body}</p>
        </article>
      ))}
    </div>
  );
}

export function DeflectionSnapshotLandingPage() {
  return (
    <main className="deflection-landing min-h-screen px-6 pb-20 pt-12 md:pt-16">
      <section className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[minmax(0,0.82fr)_minmax(27rem,1fr)] md:items-center">
        <div>
          <Eyebrow>
            <Upload className="h-3.5 w-3.5" />
            Free Deflection Snapshot
          </Eyebrow>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] text-foreground md:text-6xl">
            Turn repeat support tickets into help-center answers your team can
            publish.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground/68">
            Upload 3 months of closed tickets. Get a free snapshot that ranks
            the repeat questions, exposes the customer wording, and shows one
            sourced drafted answer your team could review and publish.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PrimarySnapshotCta />
            <p className="max-w-sm text-sm leading-relaxed text-foreground/50">
              CSV upload. No help-desk integration. Your CSV is deleted after 30
              days.
            </p>
          </div>
        </div>

        <HeroProofPanel snapshot={DEMO_DEFLECTION_SNAPSHOT} />
      </section>

      <section className="section-band mt-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <Eyebrow>Picture</Eyebrow>
            <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              The free snapshot shows the work before the full report unlock.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/66">
              The first screen proves answer quality. The snapshot below shows
              the offer shape: ranked repeat questions, customer wording, locked
              backlog, and the boundary between the free taste and the paid
              report.
            </p>
          </div>
          <SnapshotArtifact snapshot={DEMO_DEFLECTION_SNAPSHOT} showTeaser={false} />
        </div>
      </section>

      <section className="section-band">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <Eyebrow>Process</Eyebrow>
            <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              The snapshot turns old tickets into a publishing queue.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/66">
              Support leads already know repeat tickets are expensive. The
              missing question is which answers should be published first. The
              snapshot gives your team the first proof object without asking for
              a platform rollout.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              ['1', 'Export closed tickets'],
              ['2', 'Find recurring questions'],
              ['3', 'Surface customer wording'],
              ['4', 'Preview one drafted answer'],
            ].map(([step, label]) => (
              <div key={step} className="rounded-md border border-border bg-surface p-5">
                <div className="font-mono text-sm text-primary">Step {step}</div>
                <p className="mt-3 text-base font-medium leading-snug text-foreground">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-band section-band-muted">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <Eyebrow>Proof</Eyebrow>
            <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              Strong claims, bounded by the data.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/66">
              The landing page can be direct because the product is deliberately
              narrow: it reads your queue, shows the repeat pattern, and keeps
              every publishable answer grounded in resolved support history.
            </p>
          </div>
          <ProofList />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-4xl rounded-md border border-primary/25 bg-primary/[0.05] p-6 text-center shadow-[var(--primary-glow)] md:p-8">
        <Eyebrow>Push</Eyebrow>
        <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
          Start with the free snapshot.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-foreground/66">
          If the repeat pattern is weak, the snapshot will show that. If it is
          strong, the full report is the paid unlock: every recurring question,
          every review-ready draft, the source trail, and the no-proven-answer
          list.
        </p>
        <div className="mt-6">
          <PrimarySnapshotCta />
        </div>
      </section>
    </main>
  );
}
