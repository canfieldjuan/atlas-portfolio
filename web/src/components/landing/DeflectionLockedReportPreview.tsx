import { FileText, Lock, Table2 } from 'lucide-react';
import type { DeflectionReportSection, DeflectionStructuredReport } from '@/lib/deflection-report-contract';

type PreviewConfig = {
  id: string;
  smoke: string;
  eyebrow: string;
  heading: string;
  columns: string[];
  sample: (section: DeflectionReportSection) => string[];
};

const integerFormatter = new Intl.NumberFormat('en-US');

function formatInteger(value: number): string {
  return integerFormatter.format(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function rows(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null && !Array.isArray(row))
    : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function texts(value: unknown): string[] {
  return Array.isArray(value) ? value.map(text).filter(Boolean) : [];
}

function int(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function money(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `$${formatInteger(Math.max(0, Math.round(value)))}`
    : '$0';
}

function statusMix(value: unknown): string {
  const entries = Object.entries(asRecord(value))
    .flatMap(([status, count]) =>
      typeof count === 'number' && Number.isFinite(count) && count > 0
        ? [`${status.replace(/_/g, ' ')}: ${formatInteger(Math.floor(count))}`]
        : [],
    );
  return entries.length > 0 ? entries.join(' / ') : 'No outcome mix';
}

function csatSignal(value: unknown): string {
  const signal = asRecord(value);
  const negativeCount = int(signal.negative_csat_ticket_count);
  const presentCount = int(signal.csat_present_count);
  const average = signal.numeric_average;
  const status = text(signal.status);
  if (negativeCount > 0) return `${formatInteger(negativeCount)} negative CSAT`;
  if (typeof average === 'number' && Number.isFinite(average)) return `Avg ${average.toFixed(1)}`;
  if (status === 'present') return 'CSAT present';
  if (status === 'sparse' || presentCount > 0) return 'CSAT sparse';
  return 'Insufficient data';
}

function suppressionReason(value: unknown): string {
  const item = asRecord(value);
  return text(item.suppression_reason_label) || text(item.suppression_reason).replace(/_/g, ' ') || 'Review reason';
}

function actionItem(section: DeflectionReportSection): Record<string, unknown> {
  return rows(asRecord(section.data).items)[0] ?? {};
}

function diagnosticRow(section: DeflectionReportSection): Record<string, unknown> {
  return rows(asRecord(section.data).rows)[0] ?? {};
}

const PREVIEW_SECTIONS: PreviewConfig[] = [
  {
    id: 'priority_fix_queue',
    smoke: 'lockedPreviewPriorityFixQueue',
    eyebrow: 'Action queue',
    heading: 'Priority Fix Queue',
    columns: [
      'Rank',
      'Question/theme',
      'Status',
      'Repeats',
      'Cost',
      'CSAT',
      'Owner lane',
      'Confidence',
      'Score',
      'Recommended action',
    ],
    sample: (section) => {
      const item = actionItem(section);
      return [
        formatInteger(int(item.rank)),
        text(item.question),
        text(item.status),
        formatInteger(int(item.ticket_count)),
        money(item.estimated_support_cost),
        csatSignal(item.csat_signal),
        text(item.owner_lane),
        text(item.confidence),
        formatInteger(int(item.priority_score)),
        text(item.recommended_action),
      ];
    },
  },
  {
    id: 'top_unresolved_repeats',
    smoke: 'lockedPreviewTopUnresolvedRepeats',
    eyebrow: 'Content gap',
    heading: 'Top Unresolved Repeats',
    columns: ['Question/theme', 'Status', 'Repeats', 'Cost', 'CSAT', 'Owner lane', 'Action'],
    sample: (section) => {
      const item = actionItem(section);
      return [
        text(item.question),
        text(item.status),
        formatInteger(int(item.ticket_count)),
        money(item.estimated_support_cost),
        csatSignal(item.csat_signal),
        text(item.owner_lane),
        text(item.recommended_action),
      ];
    },
  },
  {
    id: 'drafted_resolutions',
    smoke: 'lockedPreviewDraftedResolutions',
    eyebrow: 'Ready to review',
    heading: 'Drafted Resolutions',
    columns: ['Question/theme', 'Draft status', 'Repeats', 'Cost', 'CSAT', 'Owner lane', 'Confidence', 'Next action'],
    sample: (section) => {
      const item = actionItem(section);
      return [
        text(item.question),
        text(item.status),
        formatInteger(int(item.ticket_count)),
        money(item.estimated_support_cost),
        csatSignal(item.csat_signal),
        text(item.owner_lane),
        text(item.confidence),
        text(item.recommended_action),
      ];
    },
  },
  {
    id: 'already_covered_still_recurring',
    smoke: 'lockedPreviewCoveredRecurring',
    eyebrow: 'Product or process gap',
    heading: 'Already Covered but Still Recurring',
    columns: ['Question/theme', 'Status', 'Repeats', 'Cost', 'CSAT', 'Owner lane', 'Signal', 'Next action'],
    sample: (section) => {
      const item = actionItem(section);
      return [
        text(item.question),
        text(item.status),
        formatInteger(int(item.ticket_count)),
        money(item.estimated_support_cost),
        csatSignal(item.csat_signal),
        text(item.owner_lane),
        texts(item.priority_drivers).slice(0, 2).join(' / '),
        text(item.recommended_action),
      ];
    },
  },
  {
    id: 'backlog_table',
    smoke: 'lockedPreviewBacklogTable',
    eyebrow: 'Broader backlog',
    heading: 'Backlog Table',
    columns: ['Rank', 'Question/theme', 'Status', 'Repeats', 'Cost', 'CSAT', 'Owner lane', 'Score', 'Action'],
    sample: (section) => {
      const item = actionItem(section);
      return [
        formatInteger(int(item.rank)),
        text(item.question),
        text(item.status),
        formatInteger(int(item.ticket_count)),
        money(item.estimated_support_cost),
        csatSignal(item.csat_signal),
        text(item.owner_lane),
        formatInteger(int(item.priority_score)),
        text(item.recommended_action),
      ];
    },
  },
  {
    id: 'outcome_diagnostics',
    smoke: 'lockedPreviewOutcomeDiagnostics',
    eyebrow: 'Resolution signals',
    heading: 'Resolution outcome diagnostics',
    columns: ['Question', 'Status mix', 'Reopened', 'Negative CSAT', 'Guidance'],
    sample: (section) => {
      const row = diagnosticRow(section);
      return [
        text(row.question),
        statusMix(row.status_mix),
        formatInteger(int(row.reopened_ticket_count)),
        formatInteger(int(row.negative_csat_ticket_count)),
        text(row.guidance),
      ];
    },
  },
  {
    id: 'suppressed_repeat_review_queue',
    smoke: 'lockedPreviewSuppressedRepeatReviewQueue',
    eyebrow: 'Review queue',
    heading: 'Suppressed Repeat Review Queue',
    columns: ['Question/theme', 'Hide reason', 'Repeats', 'Cost', 'CSAT', 'Owner lane', 'Confidence', 'Review action'],
    sample: (section) => {
      const item = actionItem(section);
      return [
        text(item.question),
        suppressionReason(item),
        formatInteger(int(item.ticket_count)),
        money(item.estimated_support_cost),
        csatSignal(item.csat_signal),
        text(item.owner_lane),
        text(item.confidence),
        text(item.recommended_action),
      ];
    },
  },
  {
    id: 'question_details',
    smoke: 'lockedPreviewQuestionDetails',
    eyebrow: 'Answer evidence',
    heading: 'Top publishable answers and gaps',
    columns: ['Rank', 'Question', 'Answer status', 'Evidence scope', 'Sources', 'Answer preview'],
    sample: (section) => {
      const row = diagnosticRow(section);
      return [
        formatInteger(int(row.rank)),
        text(row.question),
        text(row.answer_status),
        text(row.resolution_evidence_scope).replace(/_/g, ' '),
        formatInteger(int(row.source_count)),
        text(row.answer),
      ];
    },
  },
];

function sectionById(model: DeflectionStructuredReport, id: string) {
  return model.sections.find((section) => section.id === id);
}

function hasPreviewRows(section: DeflectionReportSection): boolean {
  const data = asRecord(section.data);
  if (Array.isArray(data.items)) return rows(data.items).length > 0;
  if (Array.isArray(data.rows)) return rows(data.rows).length > 0;
  return true;
}

function LockedSectionPreview({
  config,
  section,
}: {
  config: PreviewConfig;
  section: DeflectionReportSection;
}) {
  const sample = config.sample(section);

  return (
    <article
      data-smoke={config.smoke}
      className="rounded-md border border-border bg-surface p-4 shadow-[var(--card-shadow)] md:p-5"
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">
            <Table2 className="h-3.5 w-3.5" />
            {config.eyebrow}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-foreground">{config.heading}</h3>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-md border border-primary/25 bg-primary/[0.07] px-2.5 py-1 text-xs font-medium text-primary">
          <Lock className="h-3.5 w-3.5" />
          Locked full report
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-md border border-border">
        <div
          className="grid min-w-[760px] bg-background/50 text-xs font-semibold text-foreground"
          style={{ gridTemplateColumns: `repeat(${config.columns.length}, minmax(8rem, 1fr))` }}
        >
          {config.columns.map((column) => (
            <div key={column} className="border-r border-border px-3 py-2 last:border-r-0">
              {column}
            </div>
          ))}
        </div>
        <div className="relative">
          <div
            aria-hidden="true"
            className="grid min-w-[760px] blur-[1.5px]"
            style={{ gridTemplateColumns: `repeat(${config.columns.length}, minmax(8rem, 1fr))` }}
          >
            {sample.map((value, index) => (
              <div
                key={`${config.id}-${index}`}
                className="border-r border-t border-border px-3 py-3 text-sm leading-snug text-foreground/66 last:border-r-0"
              >
                {value || 'Locked'}
              </div>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-surface/60 px-4 text-center backdrop-blur-[1px]">
            <span className="rounded-md border border-primary/25 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
              Unlock the full audit to inspect rows, evidence, and source trails.
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function DeflectionLockedReportPreview({
  model,
}: {
  model: DeflectionStructuredReport;
}) {
  const sections = PREVIEW_SECTIONS.flatMap((config) => {
    const section = sectionById(model, config.id);
    return section && hasPreviewRows(section) ? [{ config, section }] : [];
  });

  if (sections.length === 0) return null;

  return (
    <section data-smoke="lockedReportPreview" className="section-band section-band-muted">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono text-primary">
            <FileText className="h-3.5 w-3.5" />
            Full Resolution Audit
          </div>
          <h2 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            The full report shape before you unlock it.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/66">
            The Snapshot shows whether a deeper audit is warranted. The locked
            preview below shows the operating sections the full report expands:
            ranked fixes, unresolved repeats, drafted answers, recurring
            covered issues, suppressed-row review reasons, backlog rows,
            outcome diagnostics, and answer evidence cards.
          </p>
        </div>
        <div className="grid gap-4">
          {sections.map(({ config, section }) => (
            <LockedSectionPreview key={config.id} config={config} section={section} />
          ))}
        </div>
      </div>
    </section>
  );
}
