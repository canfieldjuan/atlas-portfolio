'use client';

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
import { type ReactNode, useState } from 'react';
import {
  DeflectionBlindSpotRows,
  DeflectionLockedQuestionRows,
  DeflectionTopQuestionRows,
} from './DeflectionSnapshotRows';
import {
  DeflectionTeaserAnswer,
  DeflectionTeaserPreviewCard,
} from './DeflectionSnapshotTeaser';
import {
  DEMO_DEFLECTION_SNAPSHOT,
  type DeflectionSnapshot,
  type DeflectionSnapshotSourceWindow,
} from '@/lib/deflection-snapshot';
import {
  DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD,
  formatDeflectionWholeUsd,
} from '@/lib/deflection-pricing';
import { DeflectionSupportTaxProjection } from './DeflectionSupportTaxProjection';
import { SupportTicketCsvIntakeForm } from './SupportTicketCsvIntakeForm';

const INTAKE_HREF = '/systems/support-ticket-deflection/intake';
const CTA_LABEL = 'Start Your Forensic Audit';
const integerFormatter = new Intl.NumberFormat('en-US');

function formatInteger(value: number) {
  return integerFormatter.format(value);
}

function formatAssistedContactCost(value: number) {
  return value % 1 === 0 ? formatDeflectionWholeUsd(value) : `$${value.toFixed(2)}`;
}

function snapshotSourceWindow(snapshot: DeflectionSnapshot): DeflectionSnapshotSourceWindow | undefined {
  const { summary } = snapshot;
  return summary.source_date_start && summary.source_date_end && summary.source_window_days
    ? {
        source_date_start: summary.source_date_start,
        source_date_end: summary.source_date_end,
        source_window_days: summary.source_window_days,
      }
    : undefined;
}

function snapshotCostProof(snapshot: DeflectionSnapshot, assistedContactCost: number) {
  const repeatTicketCount = snapshot.summary.repeat_ticket_count;
  const sourceWindowDays =
    typeof snapshot.summary.source_window_days === 'number' &&
    snapshot.summary.source_window_days > 0
      ? snapshot.summary.source_window_days
      : undefined;
  const uploadedWindowCost = repeatTicketCount * assistedContactCost;
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

function snapshotCostBasisLabel(assistedContactCost: number) {
  return assistedContactCost === DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD
    ? 'At the Gartner benchmark'
    : `At your selected ${formatAssistedContactCost(assistedContactCost)} per assisted contact`;
}

function snapshotValueAnchor(snapshot: DeflectionSnapshot, assistedContactCost: number) {
  const { annualPace } = snapshotCostProof(snapshot, assistedContactCost);
  return [
    `${snapshotCostBasisLabel(assistedContactCost)}, a queue this size runs about ${formatDeflectionWholeUsd(
      annualPace,
    )} a year, ${formatDeflectionWholeUsd(annualPace * 3)} over three years, answering the same repeat questions by hand.`,
    `Same questions, again and again.`,
  ].join(' ');
}

function PrimarySnapshotCta({ className = '' }: { className?: string }) {
  return (
    <Link
      href={INTAKE_HREF}
      data-smoke="ctaLabel"
      className={`group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark ${className}`}
    >
      {CTA_LABEL}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function Eyebrow({ children, smoke }: { children: ReactNode; smoke?: string }) {
  return (
    <div
      data-smoke={smoke}
      className="mb-3 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono text-primary"
    >
      {children}
    </div>
  );
}

function HeroProofStrip({
  snapshot,
  assistedContactCost,
}: {
  snapshot: DeflectionSnapshot;
  assistedContactCost: number;
}) {
  const costProof = snapshotCostProof(snapshot, assistedContactCost);
  const includedDraftCount = snapshot.teaser.full_answer ? 1 : 0;
  const highlightedGapCount = snapshot.top_blind_spots && snapshot.top_blind_spots.length > 0 ? 1 : 0;
  const metrics = [
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Estimated Support Tax',
      value: formatDeflectionWholeUsd(costProof.uploadedWindowCost),
      detail: `${formatInteger(costProof.repeatTicketCount)} repeat contacts at ${formatAssistedContactCost(
        assistedContactCost,
      )} each`,
    },
    {
      icon: <Search className="h-4 w-4" />,
      label: 'Repeat Contacts',
      value: formatInteger(costProof.repeatTicketCount),
      detail: `grouped into ${formatInteger(snapshot.summary.generated)} ranked question clusters`,
    },
    {
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: 'Draft + Gap',
      value: `${includedDraftCount} + ${highlightedGapCount}`,
      detail:
        includedDraftCount > 0 && highlightedGapCount > 0
          ? 'one agent-backed answer and one unresolved finding'
          : 'draft answer and unresolved finding availability',
    },
  ];

  return (
    <div
      data-smoke="heroProofStrip"
      aria-label="Example Snapshot metrics"
      className="mt-7 grid max-w-3xl gap-3 xl:grid-cols-3"
    >
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-md border border-border bg-surface/78 px-4 py-3 shadow-sm"
        >
          <div className="flex items-center gap-2 text-primary">
            {metric.icon}
            <span className="font-mono text-[11px] uppercase tracking-[0.16em]">
              {metric.label}
            </span>
          </div>
          <div className="mt-3 font-mono text-2xl leading-none text-foreground">
            {metric.value}
          </div>
          <p className="mt-1 text-xs leading-snug text-foreground/55">
            {metric.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function CostProofBand({
  snapshot,
  assistedContactCost,
  onAssistedContactCostChange,
}: {
  snapshot: DeflectionSnapshot;
  assistedContactCost: number;
  onAssistedContactCostChange: (value: number) => void;
}) {
  return (
    <section
      data-smoke="supportTaxProjection assistedContactCost valueAnchor"
      className="section-band section-band-muted mt-16"
    >
      <div className="mx-auto max-w-6xl">
        <DeflectionSupportTaxProjection
          repeatTicketCount={snapshot.summary.repeat_ticket_count}
          assistedContactCost={assistedContactCost}
          sourceWindow={snapshotSourceWindow(snapshot)}
          onAssistedContactCostChange={onAssistedContactCostChange}
          subjectLabel="The repeat tickets in this sample"
          valueAnchor={snapshotValueAnchor(snapshot, assistedContactCost)}
          action={{
            kind: 'link',
            href: INTAKE_HREF,
            label: CTA_LABEL,
            helper:
              'See whether your own queue has enough repeat volume to justify deeper drafting.',
          }}
        />
      </div>
    </section>
  );
}



function SnapshotArtifact({
  snapshot,
  assistedContactCost,
  showTeaser = true,
}: {
  snapshot: DeflectionSnapshot;
  assistedContactCost: number;
  showTeaser?: boolean;
}) {
  const {
    summary,
    top_questions,
    locked_questions,
    teaser,
    top_blind_spots = [],
  } = snapshot;
  const artifactCostProof = snapshotCostProof(snapshot, assistedContactCost);
  const supportTaxEstimate = formatDeflectionWholeUsd(
    artifactCostProof.uploadedWindowCost,
  );
  const lockedRanks = locked_questions.map((question) => question.rank);
  const firstLockedRank =
    lockedRanks.length > 0
      ? Math.min(...lockedRanks)
      : Math.max(0, ...top_questions.map((question) => question.rank)) + 1;
  const lastLockedRank =
    lockedRanks.length > 0 ? Math.max(...lockedRanks) : summary.generated;
  const lockedRangeLabel =
    firstLockedRank <= lastLockedRank
      ? `Ranks ${firstLockedRank}-${lastLockedRank} previewed by volume`
      : 'Remaining question groups previewed by volume';
  const customerWordingExamples = top_questions
    .map((question) => question.customer_wording.trim())
    .filter(Boolean)
    .slice(0, 5);
  const artifactMetrics = [
    {
      label: 'Repeat-ticket hits',
      value: formatInteger(artifactCostProof.repeatTicketCount),
      detail: `${formatInteger(summary.generated)} ranked question groups`,
    },
    {
      label: 'Support Tax estimate',
      value: supportTaxEstimate,
      detail: `${formatAssistedContactCost(assistedContactCost)} assisted-contact value`,
    },
    {
      label: 'Included draft',
      value: teaser.full_answer ? '1' : '0',
      detail: teaser.full_answer
        ? `${formatInteger(teaser.full_answer.source_count)} source tickets`
        : 'No scoped draft in this sample',
    },
    {
      label: 'Remaining backlog',
      value: formatInteger(locked_questions.length),
      detail: 'rank and volume previewed',
    },
  ];

  return (
    <section
      aria-label="Representative Deflection Snapshot"
      className="rounded-md border border-border bg-surface p-4 shadow-[var(--card-shadow)] md:p-5"
    >
      <div className="mb-5 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-mono text-xs text-primary">EXAMPLE RESOLUTION SNAPSHOT</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            A preview of the truth.
          </h2>
        </div>
        <div className="grid gap-2 text-left sm:grid-cols-2 lg:grid-cols-4">
          {artifactMetrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-md border border-border bg-white/65 px-3 py-2"
            >
              <div className="font-mono text-lg leading-none text-foreground">
                {metric.value}
              </div>
              <div className="mt-1 text-[11px] font-medium text-foreground/62">
                {metric.label}
              </div>
              <div className="mt-1 text-[11px] leading-snug text-foreground/45">
                {metric.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 mb-2">
        <h3 className="text-lg font-semibold text-foreground">Top Proven Resolutions</h3>
        <p className="mt-1 text-sm text-foreground/60">Repeat tickets with consistent, extractable team answers.</p>
      </div>
      <DeflectionTopQuestionRows
        questions={top_questions}
        assistedContactCost={assistedContactCost}
      />

      {top_blind_spots.length > 0 && (
        <div data-smoke="blindSpots" className="mt-6 rounded-md border border-amber-500/20 bg-amber-500/[0.04] p-4">
          <div className="mb-3">
            <p className="font-mono text-xs text-amber-700/80">
              NO-PROVEN-ANSWER GAPS
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              High-cost repeats your team still has to investigate.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/62">
              These are repeated questions with no consistent resolution evidence
              in the ticket history. They are not drafted answers; they are the
              expensive support gaps to resolve next.
            </p>
          </div>
          <DeflectionBlindSpotRows
            blindSpots={top_blind_spots}
            assistedContactCost={assistedContactCost}
          />
        </div>
      )}

      <div className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="rounded-md border border-dashed border-border bg-white/45 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
            <Lock className="h-4 w-4 text-foreground/40" />
            {lockedRangeLabel}
          </div>
          <DeflectionLockedQuestionRows
            questions={locked_questions}
            assistedContactCost={assistedContactCost}
          />
          <p className="mt-3 text-sm leading-relaxed text-foreground/62">
            Counts and cost estimates stay visible here; the complete
            report adds the remaining question text and source trails.
          </p>
        </div>
        <div className="rounded-md border border-border bg-white/62 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Search className="h-4 w-4 text-primary" />
            Customer wording &rarr; your long-tail SEO target list
          </div>
          <p className="text-sm leading-relaxed text-foreground/58">
            When the upload includes customer phrasing, the Snapshot surfaces
            the literal phrases your customers already use. Those are the same
            long-tail terms they type into Google and your help center search.
            Your team gets a ranked list to publish answers against. SEO outcomes
            vary; we make no ranking guarantees.
          </p>
          {customerWordingExamples.length > 0 ? (
            <ul
              aria-label="Customer wording examples"
              className="mt-4 flex flex-wrap gap-2"
            >
              {customerWordingExamples.map((phrase) => (
                <li
                  key={phrase}
                  className="max-w-full rounded-md border border-primary/20 bg-primary/[0.07] px-2.5 py-1.5 text-xs font-medium leading-snug text-foreground/72"
                >
                  &ldquo;{phrase}&rdquo;
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs leading-relaxed text-foreground/50">
              If an upload does not include distinct customer phrasing, this list
              stays hidden instead of inventing terms.
            </p>
          )}
        </div>
      </div>

      {showTeaser && teaser.full_answer && (
        <div className="mt-5">
          <DeflectionTeaserAnswer answer={teaser.full_answer} />
          {teaser.previews.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {teaser.previews.map((preview) => (
                <DeflectionTeaserPreviewCard key={preview.rank} preview={preview} />
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-foreground/62">
        Your uploaded Snapshot uses your own closed-ticket data. Scores are
        relative ranking signals, benchmark estimates are not guaranteed
        savings, SEO outcomes are not guaranteed rankings, and the full report
        stays behind checkout.
      </p>
    </section>
  );
}

function ProofList() {
  const items = [
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: 'The Anatomy of a Finding',
      body:
        'Each finding consists of four verifiable elements: the volume of repeat tickets, the strength of existing agent resolution evidence, the estimated support cost, and the original source tickets.',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'The Audit Trail',
      body:
        'We do not guess. Every drafted resolution is anchored to source ticket IDs. If your ticket history does not contain scoped resolution evidence, we mark the issue as "no proven answer" rather than inventing a solution.',
    },
    {
      icon: <CheckCircle2 className="h-5 w-5" />,
      title: 'A Diagnostic, Not a Dashboard',
      body:
        'The report is a ranked queue of actions. It separates ready-to-review documentation drafts from product or policy gaps: the issues that require a fix to the software or the rulebook, not a new help article.',
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
  const [assistedContactCost, setAssistedContactCost] = useState(
    DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD,
  );

  return (
    <main className="deflection-landing min-h-screen px-6 pb-20 pt-12 md:pt-16">
      <section className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[minmax(0,1.05fr)_minmax(26rem,0.9fr)] md:items-start lg:grid-cols-[minmax(0,1.18fr)_minmax(28rem,0.9fr)] lg:gap-14">
        <div className="md:pt-8 lg:pt-10">
          <Eyebrow smoke="snapshotBadge">
            <Upload className="h-3.5 w-3.5" />
            The Resolution Audit.
          </Eyebrow>
          <h1
            data-smoke="promiseHeadline"
            className="max-w-4xl text-4xl font-semibold leading-[1.08] text-foreground md:text-6xl lg:text-7xl"
          >
            Deflect tickets by actually resolving them.
          </h1>
          <div className="mt-5 max-w-2xl space-y-4 text-lg leading-relaxed text-foreground/68 lg:mt-6 lg:max-w-3xl lg:text-xl lg:leading-relaxed">
            <p>Instead of guessing, we audit.</p>
            <p>
              Upload your support-ticket export to receive a forensic analysis
              of your ticket history. We identify high-volume topics your team
              can address with documentation or self-service, and we flag the
              gaps where your tickets do not contain a proven resolution yet.
              Those gaps often point to product, policy, or process fixes that
              need to happen before another help article can carry the load.
            </p>
          </div>
          <HeroProofStrip
            snapshot={DEMO_DEFLECTION_SNAPSHOT}
            assistedContactCost={assistedContactCost}
          />
        </div>

        <div className="md:w-full md:max-w-[34rem] md:justify-self-end">
          <SupportTicketCsvIntakeForm
            copy={{
              backHref: '/',
              backLabel: 'Back to site',
              sourcePage: '/systems/support-ticket-deflection/snapshot',
              sourceOffer: 'support-ticket-deflection-intake',
              snapshotName: 'Resolution Report',
              submitLabel: CTA_LABEL,
            }}
          />
        </div>
      </section>

      <section className="section-band">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <Eyebrow>Your Resolution Snapshot</Eyebrow>
            <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              See the evidence behind your ticket volume.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/66">
              The Snapshot below reveals your top repeat question, the estimated
              cost exposure behind it, and one real, agent-backed answer. It
              also identifies a high-cost unresolved gap where your tickets do
              not contain a proven resolution yet. A full report expands this
              across the ranked backlog from your ticket history.
            </p>
          </div>
          <SnapshotArtifact
            snapshot={DEMO_DEFLECTION_SNAPSHOT}
            assistedContactCost={assistedContactCost}
          />
        </div>
      </section>

      <CostProofBand
        snapshot={DEMO_DEFLECTION_SNAPSHOT}
        assistedContactCost={assistedContactCost}
        onAssistedContactCostChange={setAssistedContactCost}
      />

      <section className="section-band section-band-muted">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <Eyebrow>Proof</Eyebrow>
            <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              The mechanism behind the audit.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/66">
              Every finding has to trace back to ticket volume, resolution
              evidence, estimated cost exposure, and source tickets.
            </p>
          </div>
          <ProofList />
        </div>
      </section>

      <section
        data-smoke="snapshotFirst finalSnapshotAsk"
        className="mx-auto mt-16 max-w-4xl rounded-md border border-primary/25 bg-primary/[0.05] p-6 text-center shadow-[var(--primary-glow)] md:p-8"
      >
        <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
          Decide if an audit is worth the investment before you commit.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-foreground/66">
          Upload your Zendesk or Freshdesk CSV to receive a Snapshot. You will
          immediately see your top deflection topic and a summary count. This
          tells you if your ticket history contains enough unresolved,
          repetitive questions to justify a full audit. If the data is thin,
          you have a bounded starting point instead of a sales pitch.
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-foreground/66">
          If the data warrants it, the full report provides a ranked,
          source-backed action queue. You receive draft answers anchored to real
          agent resolutions and a list of operational blind spots.
        </p>
        <div className="mx-auto mt-5 max-w-2xl border-t border-primary/20 pt-4">
          <p className="text-sm leading-relaxed text-foreground/62">
            We do not promise guaranteed savings. We promise a usable audit
            trail. If the full report fails to deliver a ranked, source-backed
            queue of questions and answers, we will correct the findings.
          </p>
        </div>
        <div className="mt-6">
          <PrimarySnapshotCta />
        </div>
      </section>
    </main>
  );
}
