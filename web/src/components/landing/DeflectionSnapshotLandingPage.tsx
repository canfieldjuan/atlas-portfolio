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
  DeflectionLockedQuestionRows,
  DeflectionTopQuestionRows,
  DeflectionTopBlindSpotRows,
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
  DEFLECTION_FULL_REPORT_PRICE_LABEL,
  formatDeflectionWholeUsd,
} from '@/lib/deflection-pricing';
import { DeflectionSupportTaxProjection } from './DeflectionSupportTaxProjection';
import { SupportTicketCsvIntakeForm } from './SupportTicketCsvIntakeForm';

const INTAKE_HREF = '/systems/support-ticket-deflection/intake';
const CTA_LABEL = 'Get my free Deflection Snapshot';
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
    `Same questions, again and again. The ${DEFLECTION_FULL_REPORT_PRICE_LABEL} full report is a one-time cost against that recurring bill, not the price of one ticket.`,
  ].join(' ');
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
    <section className="section-band section-band-muted mt-16">
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
  const { summary, top_questions, top_blind_spots, locked_questions, teaser } = snapshot;
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
          <p className="font-mono text-xs text-primary">REPRESENTATIVE SNAPSHOT</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">
            What the free Resolution Report hands you.
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

      {top_blind_spots && top_blind_spots.length > 0 && (
        <>
          <div className="mt-10 mb-2">
            <h3 className="text-lg font-semibold text-red-500/90">Top Unresolved Blind Spots</h3>
            <p className="mt-1 text-sm text-foreground/60">High-volume repeat issues lacking a clear, proven resolution in your tickets.</p>
          </div>
          <DeflectionTopBlindSpotRows
            questions={top_blind_spots}
            assistedContactCost={assistedContactCost}
          />
        </>
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
      title: 'Grounded in resolved tickets',
      body:
        'Drafted answers are built only when the ticket history contains scoped resolution evidence.',
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'A real diagnostic, not a generic calculator',
      body:
        'A calculator gives you one total. The Snapshot shows the recurring cost behind each repeat question, so you can fix the biggest losses first.',
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
  const [assistedContactCost, setAssistedContactCost] = useState(
    DEFLECTION_ASSISTED_CONTACT_BENCHMARK_USD,
  );

  return (
    <main className="deflection-landing min-h-screen px-6 pb-20 pt-12 md:pt-16">
      <section className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[minmax(0,0.82fr)_minmax(27rem,1fr)] md:items-center">
        <div>
          <Eyebrow>
            <Upload className="h-3.5 w-3.5" />
            Ticket Resolution Report
          </Eyebrow>
          <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] text-foreground md:text-6xl">
            Deflect tickets by actually resolving them.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-foreground/68">
            Upload 30 days of closed tickets. The free Resolution Report shows which
            issues repeat, the exact wording customers use, your team&apos;s blind spots, and one sourced draft your team can review.
          </p>
        </div>

        <SupportTicketCsvIntakeForm
          copy={{
            backHref: '/',
            backLabel: 'Back to site',
            sourcePage: '/systems/support-ticket-deflection/snapshot',
            sourceOffer: 'hero_intake',
            snapshotName: 'Resolution Report',
            submitLabel: 'Get my free Resolution Report',
          }}
        />
      </section>

      <section className="section-band">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 max-w-3xl">
            <Eyebrow>Artifact</Eyebrow>
            <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              Read the Snapshot, then decide what to fix.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/66">
              The example below shows what you get: ranked repeat questions,
              customer wording, a cost projection, one sourced draft answer, and
              a preview of the remaining questions the full report unlocks.
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
              Built for one narrow decision: what to fix first.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-foreground/66">
              The Snapshot has one job: read the queue, show the repeat pattern,
              and keep every publishable answer grounded in resolved support
              history.
            </p>
          </div>
          <ProofList />
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-4xl rounded-md border border-primary/25 bg-primary/[0.05] p-6 text-center shadow-[var(--primary-glow)] md:p-8">
        <Eyebrow>Push</Eyebrow>
        <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
          Every month, the same repeat questions bill you again.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-foreground/66">
          The only ask on this page is the CSV upload, and seeing what those
          repeats cost is free. If the repeat pattern is weak, the Snapshot will
          show that. If it is strong, you will have a ranked starting point and one
          answer draft to review before any next step.
        </p>
        <div className="mt-6">
          <PrimarySnapshotCta />
        </div>
      </section>
    </main>
  );
}
