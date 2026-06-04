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
  type DeflectionSnapshotLockedQuestion,
  type DeflectionSnapshotQuestion,
} from '@/lib/deflection-snapshot';
import {
  DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL,
  DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD,
  formatDeflectionWholeUsd,
} from '@/lib/deflection-pricing';

const INTAKE_HREF = '/systems/support-ticket-deflection/intake';
const CTA_LABEL = 'Get my free Deflection Snapshot';
const integerFormatter = new Intl.NumberFormat('en-US');

function formatInteger(value: number) {
  return integerFormatter.format(value);
}

function benchmarkEstimateForTickets(ticketCount: number) {
  return formatDeflectionWholeUsd(
    ticketCount * DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD,
  );
}

function snapshotCostProof(snapshot: DeflectionSnapshot) {
  const repeatTicketCount = snapshot.summary.repeat_ticket_count;
  const sourceWindowDays =
    typeof snapshot.summary.source_window_days === 'number' &&
    snapshot.summary.source_window_days > 0
      ? snapshot.summary.source_window_days
      : undefined;
  const uploadedWindowCost =
    repeatTicketCount * DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD;
  const annualPace = sourceWindowDays
    ? (uploadedWindowCost / sourceWindowDays) * 365
    : uploadedWindowCost * 12;

  return {
    annualPace,
    repeatTicketCount,
    sourceWindowDays,
    uploadedWindowCost,
  };
}

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

function CostProofBand({ snapshot }: { snapshot: DeflectionSnapshot }) {
  const {
    annualPace,
    repeatTicketCount,
    sourceWindowDays,
    uploadedWindowCost,
  } = snapshotCostProof(snapshot);
  const windowLabel = sourceWindowDays
    ? `${formatInteger(sourceWindowDays)} days`
    : 'the uploaded window';
  const metrics = [
    {
      label: 'Support Tax estimate',
      value: formatDeflectionWholeUsd(uploadedWindowCost),
      detail: `${formatInteger(repeatTicketCount)} repeat-ticket hits x ${DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL} benchmark across ${windowLabel}`,
    },
    {
      label: 'Annualized pace',
      value: formatDeflectionWholeUsd(annualPace),
      detail: sourceWindowDays
        ? 'Same measured pace normalized to 365 days'
        : 'Same measured pace projected across 12 similar windows',
    },
    {
      label: 'Snapshot action',
      value: 'Free',
      detail:
        'Upload the CSV first, then decide whether the full report is worth unlocking',
    },
  ];

  return (
    <section className="section-band section-band-muted mt-16">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(21rem,1fr)] lg:items-start">
        <div>
          <Eyebrow>Support Tax estimate</Eyebrow>
          <h2 className="max-w-3xl text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            The Snapshot turns repeat volume into a benchmark cost estimate.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-foreground/66">
            In this representative labeled-synthetic support set, the repeat
            ticket count is multiplied by the{' '}
            {DEFLECTION_ASSISTED_CONTACT_BENCHMARK_LABEL} assisted-contact
            benchmark. The point is not a savings promise. It is a fast value
            check before your team spends anything.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PrimarySnapshotCta />
            <p className="max-w-sm text-sm leading-relaxed text-foreground/50">
              See whether your own queue has enough repeat volume before paying
              for every draft and source trail.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {metrics.map((metric) => (
            <article
              key={metric.label}
              className="rounded-md border border-border bg-surface p-4 shadow-[var(--card-shadow)]"
            >
              <p className="font-mono text-[11px] uppercase tracking-wide text-foreground/45">
                {metric.label}
              </p>
              <p className="mt-2 text-3xl font-semibold leading-none text-foreground">
                {metric.value}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground/58">
                {metric.detail}
              </p>
            </article>
          ))}

          <p className="rounded-md border border-primary/25 bg-primary/[0.06] p-4 text-sm leading-relaxed text-foreground/66">
            The free Snapshot earns the next step by showing the pattern first:
            ranked repeats, customer wording, and one sourced answer sample. The
            Snapshot comes before any paid report, so the decision starts with
            evidence from your own queue.
          </p>
        </div>
      </div>
    </section>
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

function LockedQuestionFomoRows({
  label,
  questions,
}: {
  label: string;
  questions: DeflectionSnapshotLockedQuestion[];
}) {
  const rows = questions.slice(0, 3);

  return (
    <div className="rounded-md border border-dashed border-border bg-white/45 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <Lock className="h-4 w-4 text-foreground/40" />
        {label}
      </div>
      <div className="space-y-2">
        {rows.map((question) => (
          <div
            key={question.rank}
            className="grid gap-2 rounded-md border border-border/70 bg-white/62 p-3 text-xs sm:grid-cols-[4.5rem_minmax(0,1fr)_7rem] sm:items-center"
          >
            <span className="font-mono text-foreground/58">Rank #{question.rank}</span>
            <span className="text-foreground/72">
              {formatInteger(question.ticket_count)} repeat-ticket hits
            </span>
            <span className="font-mono text-foreground/72 sm:text-right">
              {benchmarkEstimateForTickets(question.ticket_count)}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-foreground/58">
        Counts and benchmark estimates stay visible; question text withheld
        until the full report unlocks the complete backlog.
      </p>
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
  const heroCostProof = snapshotCostProof(snapshot);
  const supportTaxEstimate = formatDeflectionWholeUsd(
    heroCostProof.uploadedWindowCost,
  );

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
            The Snapshot shows what repeats, what it costs, and one answer.
          </h2>
        </div>
        <span className="w-fit max-w-[16rem] rounded-md border border-primary/25 px-2 py-1 text-xs font-mono leading-snug text-primary">
          Representative labeled-synthetic support set
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0">
          <div className="border-b border-border pb-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-foreground/45">
              <FileText className="h-4 w-4" />
              Customer wording found
            </div>
            <p className="text-lg font-medium leading-snug text-foreground">
              Customer asked: &ldquo;{customerPhrase}&rdquo;
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/58">
              ATLAS finds the repeat wording across closed tickets, estimates
              the benchmark Support Tax, then checks whether resolved replies
              contain enough scoped evidence to draft an answer.
            </p>
          </div>

          <div className="pt-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-mono uppercase tracking-wide text-primary">
              <CheckCircle2 className="h-4 w-4" />
              One sourced draft answer
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
              <Search className="h-4 w-4 shrink-0 text-primary" />
              <span>
                {formatInteger(heroCostProof.repeatTicketCount)} repeat-ticket
                hits
              </span>
            </div>
            <div className="flex items-center gap-2 text-foreground/72">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <span>Support Tax estimate: {supportTaxEstimate}</span>
            </div>
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
              Free Snapshot
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/62">
              Ranked repeats, customer wording, Support Tax estimate, one
              sourced drafted answer.
            </p>
            <p className="mt-4 text-xs font-mono uppercase tracking-wide text-foreground/45">
              Full report
            </p>
            <p className="mt-1 text-sm leading-relaxed text-foreground/62">
              Complete backlog, drafts, source trail, write-next list if the
              Snapshot proves enough repeat demand.
            </p>
          </div>
        </aside>
      </div>

      <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-foreground/45">
        Representative labeled-synthetic support set. Your uploaded snapshot
        uses your own closed-ticket data. Benchmark estimates are not guaranteed
        savings, and the full report stays behind checkout.
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
  const { summary, top_questions, locked_questions, teaser } = snapshot;
  const visibleQuestions = top_questions.slice(0, 3);
  const lockedRanks = locked_questions.map((question) => question.rank);
  const firstLockedRank =
    lockedRanks.length > 0
      ? Math.min(...lockedRanks)
      : Math.max(0, ...top_questions.map((question) => question.rank)) + 1;
  const lastLockedRank =
    lockedRanks.length > 0 ? Math.max(...lockedRanks) : summary.generated;
  const lockedRangeLabel =
    firstLockedRank <= lastLockedRank
      ? `Ranks ${firstLockedRank}-${lastLockedRank} stay locked`
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
        <LockedQuestionFomoRows
          label={lockedRangeLabel}
          questions={locked_questions}
        />
        <div className="rounded-md border border-border bg-white/62 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Search className="h-4 w-4 text-primary" />
            Customer wording becomes the target list
          </div>
          <p className="text-sm leading-relaxed text-foreground/58">
            The Snapshot surfaces the phrases customers already use. Your team
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
        Representative labeled-synthetic support set. Your uploaded snapshot
        uses your own closed-ticket data. Scores are relative ranking signals;
        benchmark estimates are not guaranteed savings. The full report keeps
        the remaining ranked backlog behind checkout.
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
        'The Snapshot ranks the repeat questions and phrases from the uploaded queue before asking for a paid next step.',
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
            Get the free Snapshot that shows which support tickets to deflect
            first.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground/68">
            Upload 3 months of closed tickets. Your Snapshot ranks the repeat
            issues, quotes the wording customers use, estimates the Support Tax,
            and gives you one sourced draft answer your team can review.
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

      <CostProofBand snapshot={DEMO_DEFLECTION_SNAPSHOT} />

      <section className="section-band">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <Eyebrow>Picture</Eyebrow>
            <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              The free Snapshot shows the work before any paid step.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/66">
              The first screen proves answer quality. The snapshot below shows
              the offer shape: ranked repeat questions, customer wording, locked
              backlog, and what the free Snapshot includes before any paid
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
              The Snapshot is the proof object.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/66">
              Support leads already know repeat tickets are expensive. The
              missing question is which answers should be published first. The
              Snapshot answers that question without asking for a platform
              rollout or a paid commitment.
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
          Start with the free Snapshot.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-foreground/66">
          The only ask on this page is the CSV upload. If the repeat pattern is
          weak, the Snapshot will show that. If it is strong, you will know
          whether the complete ranked backlog, review-ready drafts, source
          trail, and no-proven-answer list are worth unlocking.
        </p>
        <div className="mt-6">
          <PrimarySnapshotCta />
        </div>
      </section>
    </main>
  );
}
