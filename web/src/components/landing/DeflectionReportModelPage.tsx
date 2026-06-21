import { CheckCircle2, CircleAlert, FileText, ListChecks, ShieldCheck } from 'lucide-react';
import type { DeflectionReportSection, DeflectionStructuredReport } from '@/lib/deflection-report-contract';
import { DeflectionDemo } from '@/components/deflection-demo/DeflectionDemo';
import { uploadedDeflectionSearchEnabled } from '@/lib/deflection-uploaded-search-config';

const RANKED_ROW_LIMIT = 25;
const PRIORITY_FIX_QUEUE_LIMIT = 3;
const TOP_UNRESOLVED_REPEATS_LIMIT = 3;
const DRAFTED_RESOLUTIONS_LIMIT = 3;
const COVERED_RECURRING_LIMIT = 3;
const OUTCOME_DIAGNOSTIC_LIMIT = 25;
const QUESTION_DETAIL_LIMIT = 10;
const SEO_TARGET_LIMIT = 20;

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

function nonNegativeIntOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

function money(value: unknown): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? `$${Math.max(0, Math.round(value)).toLocaleString()}`
    : '$0';
}

function csatSignalLabel(value: unknown): string {
  const signal = asRecord(value);
  const status = text(signal.status);
  const negativeCount = int(signal.negative_csat_ticket_count);
  const presentCount = int(signal.csat_present_count);
  const average = signal.numeric_average;
  if (negativeCount > 0) return `${negativeCount.toLocaleString()} negative CSAT`;
  if (typeof average === 'number' && Number.isFinite(average)) return `Avg ${average.toFixed(1)}`;
  if (status === 'present') return 'CSAT present';
  if (status === 'sparse' || presentCount > 0) return 'CSAT sparse';
  return 'Insufficient data';
}

function priorityDriverLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

function sortedWebSections(model: DeflectionStructuredReport): DeflectionReportSection[] {
  return model.sections
    .filter((section) => section.surfaces.includes('web'))
    .slice()
    .sort((a, b) => a.priority - b.priority);
}

function sectionById(model: DeflectionStructuredReport, id: string): DeflectionReportSection | undefined {
  return sortedWebSections(model).find((section) => section.id === id);
}

function uploadedSearchChips(model: DeflectionStructuredReport): string[] {
  const rankedQuestions = rows(asRecord(sectionById(model, 'ranked_questions')?.data).rows)
    .map((row) => text(row.question))
    .filter(Boolean);
  const seoTargets = texts(asRecord(sectionById(model, 'seo_targets')?.data).phrases);
  return Array.from(new Set([...rankedQuestions, ...seoTargets])).slice(0, 6);
}

function SupportTaxSummary({ section }: { section?: DeflectionReportSection }) {
  const data = asRecord(section?.data);
  const sourceWindow = asRecord(data.source_date_window);
  const sourceWindowLabel =
    text(sourceWindow.source_date_start) && text(sourceWindow.source_date_end)
      ? `${text(sourceWindow.source_date_start)} to ${text(sourceWindow.source_date_end)}`
      : '';
  const metrics = [
    { label: 'Repeat tickets', value: int(data.repeat_ticket_count).toLocaleString() },
    { label: 'Ranked questions', value: int(data.generated_question_count).toLocaleString() },
    { label: 'Estimated support cost', value: money(data.estimated_support_cost) },
    {
      label: 'Annualized pace',
      value: money(data.annualized_support_cost ?? data.annualized_run_rate_support_cost),
    },
    { label: 'Publishable answers', value: int(data.drafted_answer_count).toLocaleString() },
    { label: 'Needs resolution first', value: int(data.no_proven_answer_count).toLocaleString() },
  ];

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">
        <ShieldCheck className="h-3.5 w-3.5" />
        Paid report dashboard
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-foreground">Support Tax confirmation</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/60">
        The hosted report is the operating view. It summarizes the highest-value sections and keeps complete
        source detail in the evidence export.
      </p>
      {sourceWindowLabel && (
        <p className="mt-3 text-xs font-mono uppercase tracking-widest text-foreground/45">
          Source window: {sourceWindowLabel}
        </p>
      )}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-xl border border-border bg-background/35 p-4">
            <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
              {metric.label}
            </div>
            <div className="mt-2 text-xl font-semibold text-foreground">{metric.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PriorityFixQueue({ section }: { section?: DeflectionReportSection }) {
  const data = asRecord(section?.data);
  const allItems = rows(data.items);
  const requestedLimit =
    nonNegativeIntOrNull(data.result_page_limit) ??
    nonNegativeIntOrNull(section?.default_limit) ??
    PRIORITY_FIX_QUEUE_LIMIT;
  const limit = Math.min(PRIORITY_FIX_QUEUE_LIMIT, requestedLimit);
  const items = allItems.slice(0, limit);

  const statusCounts = Object.entries(asRecord(data.status_counts))
    .filter(([, value]) => int(value) > 0)
    .slice(0, 4);
  const basis = asRecord(data.support_cost_basis);
  const basisStatus = text(basis.status).replace(/_/g, ' ');

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6" data-smoke="priorityFixQueue">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">
        <ListChecks className="h-3.5 w-3.5" />
        Action queue
      </div>
      <h2 className="mt-3 text-xl font-semibold text-foreground">Priority Fix Queue</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/60">
        Ranked by repeat volume, benchmark support cost, answer status, confidence, reopened tickets, and CSAT signal.
      </p>

      {statusCounts.length > 0 && (
        <dl className="mt-4 flex flex-wrap gap-2 text-xs">
          {statusCounts.map(([status, count]) => (
            <div key={status} className="rounded-full border border-border bg-background/35 px-3 py-1">
              <dt className="sr-only">{status}</dt>
              <dd className="font-mono text-foreground/65">
                {int(count).toLocaleString()} {status}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {items.length > 0 ? (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-background/50 text-foreground">
              <tr>
                {[
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
                ].map((label) => (
                  <th key={label} className="border-b border-border px-3 py-2 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={`${int(row.rank)}-${text(row.question)}-${text(row.status)}`} className="border-t border-border/70">
                  <td className="px-3 py-2 font-mono text-foreground/55">{int(row.rank)}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium leading-snug text-foreground">{text(row.question)}</div>
                    <div className="mt-1 text-xs leading-relaxed text-foreground/48">
                      {texts(row.priority_drivers).slice(0, 3).map(priorityDriverLabel).join(' / ')}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full border border-border bg-background/45 px-2 py-1 text-xs text-foreground/70">
                      {text(row.status) || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-foreground/70">{int(row.ticket_count).toLocaleString()}</td>
                  <td className="px-3 py-2 text-foreground/70">{money(row.estimated_support_cost)}</td>
                  <td className="px-3 py-2 text-foreground/70">{csatSignalLabel(row.csat_signal)}</td>
                  <td className="px-3 py-2 text-foreground/70">{text(row.owner_lane) || 'Unknown'}</td>
                  <td className="px-3 py-2 text-foreground/70">{text(row.confidence) || 'Unknown'}</td>
                  <td className="px-3 py-2 font-mono text-foreground/70">{int(row.priority_score).toLocaleString()}</td>
                  <td className="px-3 py-2 leading-relaxed text-foreground/70">{text(row.recommended_action)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-border bg-background/35 p-4 text-sm text-foreground/60">
          No priority fixes are shown in this result-page view.
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-foreground/50">
        Showing {items.length.toLocaleString()} of {allItems.length.toLocaleString()} queued fixes. Cost basis:
        {' '}
        {basisStatus || 'benchmark only'}. Complete source IDs and evidence stay in the export.
      </p>
    </section>
  );
}

function TopUnresolvedRepeats({ section }: { section?: DeflectionReportSection }) {
  const data = asRecord(section?.data);
  const allItems = rows(data.items);
  const requestedLimit = nonNegativeIntOrNull(section?.default_limit) ?? TOP_UNRESOLVED_REPEATS_LIMIT;
  const limit = Math.min(TOP_UNRESOLVED_REPEATS_LIMIT, requestedLimit);
  const items = allItems.slice(0, limit);
  const topItemCount = Math.max(int(data.top_item_count), allItems.length);
  const basis = asRecord(data.support_cost_basis);
  const basisStatus = text(basis.status).replace(/_/g, ' ');

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6" data-smoke="topUnresolvedRepeats">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">
        <CircleAlert className="h-3.5 w-3.5" />
        Open repeat questions
      </div>
      <h2 className="mt-3 text-xl font-semibold text-foreground">Top Unresolved Repeats</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/60">
        These repeated questions still need an answer or resolution review. Start here to remove the backlog that
        keeps sending customers back to agents.
      </p>

      {items.length > 0 ? (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[880px] border-collapse text-left text-sm">
            <thead className="bg-background/50 text-foreground">
              <tr>
                {['Question/theme', 'Status', 'Repeats', 'Cost', 'CSAT', 'Owner lane', 'Action'].map((label) => (
                  <th key={label} className="border-b border-border px-3 py-2 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={`${int(row.rank)}-${text(row.question)}-${text(row.status)}`} className="border-t border-border/70">
                  <td className="px-3 py-2">
                    <div className="font-medium leading-snug text-foreground">{text(row.question)}</div>
                    <div className="mt-1 text-xs leading-relaxed text-foreground/48">
                      Score {int(row.priority_score).toLocaleString()} | {text(row.confidence) || 'Unknown'} confidence
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full border border-border bg-background/45 px-2 py-1 text-xs text-foreground/70">
                      {text(row.status) || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-foreground/70">{int(row.ticket_count).toLocaleString()}</td>
                  <td className="px-3 py-2 text-foreground/70">{money(row.estimated_support_cost)}</td>
                  <td className="px-3 py-2 text-foreground/70">{csatSignalLabel(row.csat_signal)}</td>
                  <td className="px-3 py-2 text-foreground/70">{text(row.owner_lane) || 'Unknown'}</td>
                  <td className="px-3 py-2 leading-relaxed text-foreground/70">{text(row.recommended_action)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-border bg-background/35 p-4 text-sm text-foreground/60">
          No unresolved repeat questions are shown in this result-page view.
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-foreground/50">
        Showing {items.length.toLocaleString()} of {topItemCount.toLocaleString()} top unresolved repeats. Cost
        basis: {basisStatus || 'benchmark only'}. Complete source IDs and evidence stay in the export.
      </p>
    </section>
  );
}

function DraftedResolutions({ section }: { section?: DeflectionReportSection }) {
  const data = asRecord(section?.data);
  const allItems = rows(data.items);
  const requestedLimit = nonNegativeIntOrNull(section?.default_limit) ?? DRAFTED_RESOLUTIONS_LIMIT;
  const limit = Math.min(DRAFTED_RESOLUTIONS_LIMIT, requestedLimit);
  const items = allItems.slice(0, limit);
  const topItemCount = Math.max(int(data.top_item_count), allItems.length);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6" data-smoke="draftedResolutions">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Ready to review
      </div>
      <h2 className="mt-3 text-xl font-semibold text-foreground">Drafted Resolutions</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/60">
        These repeat questions already have a proposed resolution path. Review the action, approve the answer,
        and use the export when you need the complete source trail.
      </p>

      {items.length > 0 ? (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-background/50 text-foreground">
              <tr>
                {['Question/theme', 'Draft status', 'Repeats', 'Cost', 'CSAT', 'Owner lane', 'Confidence', 'Next action'].map((label) => (
                  <th key={label} className="border-b border-border px-3 py-2 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={`${int(row.rank)}-${text(row.question)}-${text(row.status)}`} className="border-t border-border/70">
                  <td className="px-3 py-2">
                    <div className="font-medium leading-snug text-foreground">{text(row.question)}</div>
                    <div className="mt-1 text-xs leading-relaxed text-foreground/48">
                      {texts(row.priority_drivers).slice(0, 3).map(priorityDriverLabel).join(' / ')}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full border border-border bg-background/45 px-2 py-1 text-xs text-foreground/70">
                      {text(row.status) || 'Draft ready'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-foreground/70">{int(row.ticket_count).toLocaleString()}</td>
                  <td className="px-3 py-2 text-foreground/70">{money(row.estimated_support_cost)}</td>
                  <td className="px-3 py-2 text-foreground/70">{csatSignalLabel(row.csat_signal)}</td>
                  <td className="px-3 py-2 text-foreground/70">{text(row.owner_lane) || 'Unknown'}</td>
                  <td className="px-3 py-2 text-foreground/70">{text(row.confidence) || 'Unknown'}</td>
                  <td className="px-3 py-2 leading-relaxed text-foreground/70">{text(row.recommended_action)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-border bg-background/35 p-4 text-sm text-foreground/60">
          No drafted resolutions are shown in this result-page view.
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-foreground/50">
        Showing {items.length.toLocaleString()} of {topItemCount.toLocaleString()} drafted resolutions. Complete
        source IDs and evidence stay in the export.
      </p>
    </section>
  );
}

function CoveredRecurring({ section }: { section?: DeflectionReportSection }) {
  const data = asRecord(section?.data);
  const allItems = rows(data.items);
  const requestedLimit = nonNegativeIntOrNull(section?.default_limit) ?? COVERED_RECURRING_LIMIT;
  const limit = Math.min(COVERED_RECURRING_LIMIT, requestedLimit);
  const items = allItems.slice(0, limit);
  const topItemCount = Math.max(int(data.top_item_count), allItems.length);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6" data-smoke="coveredRecurring">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">
        <CircleAlert className="h-3.5 w-3.5" />
        Still coming back
      </div>
      <h2 className="mt-3 text-xl font-semibold text-foreground">Already Covered but Still Recurring</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/60">
        These questions have answer evidence, but reopened-ticket or CSAT signals suggest customers still cannot
        find, trust, or use the answer without agent help.
      </p>

      {items.length > 0 ? (
        <div className="mt-5 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-background/50 text-foreground">
              <tr>
                {['Question/theme', 'Status', 'Repeats', 'Cost', 'CSAT', 'Owner lane', 'Signal', 'Next action'].map((label) => (
                  <th key={label} className="border-b border-border px-3 py-2 font-semibold">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={`${int(row.rank)}-${text(row.question)}-${text(row.status)}`} className="border-t border-border/70">
                  <td className="px-3 py-2">
                    <div className="font-medium leading-snug text-foreground">{text(row.question)}</div>
                    <div className="mt-1 text-xs leading-relaxed text-foreground/48">
                      Score {int(row.priority_score).toLocaleString()} | {text(row.confidence) || 'Unknown'} confidence
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full border border-border bg-background/45 px-2 py-1 text-xs text-foreground/70">
                      {text(row.status) || 'Still recurring'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-foreground/70">{int(row.ticket_count).toLocaleString()}</td>
                  <td className="px-3 py-2 text-foreground/70">{money(row.estimated_support_cost)}</td>
                  <td className="px-3 py-2 text-foreground/70">{csatSignalLabel(row.csat_signal)}</td>
                  <td className="px-3 py-2 text-foreground/70">{text(row.owner_lane) || 'Unknown'}</td>
                  <td className="px-3 py-2 text-foreground/70">
                    {texts(row.priority_drivers).slice(0, 3).map(priorityDriverLabel).join(' / ')}
                  </td>
                  <td className="px-3 py-2 leading-relaxed text-foreground/70">{text(row.recommended_action)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-border bg-background/35 p-4 text-sm text-foreground/60">
          No already-covered recurring questions are shown in this result-page view.
        </div>
      )}
      <p className="mt-3 text-xs leading-relaxed text-foreground/50">
        Showing {items.length.toLocaleString()} of {topItemCount.toLocaleString()} already-covered recurring
        questions. Complete source IDs and evidence stay in the export.
      </p>
    </section>
  );
}

function SeoTargets({ section }: { section?: DeflectionReportSection }) {
  const data = asRecord(section?.data);
  const requestedLimit = int(data.limit) || SEO_TARGET_LIMIT;
  const limit = Math.min(SEO_TARGET_LIMIT, requestedLimit);
  const phrases = texts(data.phrases).slice(0, limit);
  if (phrases.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <h2 className="text-xl font-semibold text-foreground">Help-desk SEO targeting list</h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground/60">
        Customer wording to reuse in help-center headings, internal search synonyms, and FAQ titles.
      </p>
      <ol className="mt-4 grid gap-2 text-sm leading-relaxed text-foreground/70 md:grid-cols-2">
        {phrases.map((phrase, index) => (
          <li key={`${phrase}-${index}`} className="rounded-lg border border-border/70 bg-background/35 px-3 py-2">
            <span className="font-mono text-foreground/40">{index + 1}. </span>
            {phrase}
          </li>
        ))}
      </ol>
    </section>
  );
}

function RankedQuestions({ section }: { section?: DeflectionReportSection }) {
  const tableRows = rows(asRecord(section?.data).rows).slice(0, RANKED_ROW_LIMIT);
  if (tableRows.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <h2 className="text-xl font-semibold text-foreground">Ranked question opportunities</h2>
      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-background/50 text-foreground">
            <tr>
              {['Rank', 'Customer question', 'Tickets', 'Support cost', 'Opportunity', 'Answer status'].map((label) => (
                <th key={label} className="border-b border-border px-3 py-2 font-semibold">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={`${int(row.rank)}-${text(row.question)}`} className="border-t border-border/70">
                <td className="px-3 py-2 font-mono text-foreground/55">{int(row.rank)}</td>
                <td className="px-3 py-2 text-foreground">{text(row.question)}</td>
                <td className="px-3 py-2 text-foreground/70">{int(row.ticket_count).toLocaleString()}</td>
                <td className="px-3 py-2 text-foreground/70">{money(row.estimated_support_cost)}</td>
                <td className="px-3 py-2 text-foreground/70">{int(row.opportunity_score)}</td>
                <td className="px-3 py-2 text-foreground/70">{text(row.answer_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-foreground/50">
        Table capped at {RANKED_ROW_LIMIT.toLocaleString()} rows here; download the complete evidence export for the full audit trail.
      </p>
    </section>
  );
}

function OutcomeDiagnostics({ section }: { section?: DeflectionReportSection }) {
  const data = asRecord(section?.data);
  const allDiagnostics = rows(data.rows);
  const requestedLimit = int(section?.default_limit) || OUTCOME_DIAGNOSTIC_LIMIT;
  const limit = Math.min(OUTCOME_DIAGNOSTIC_LIMIT, requestedLimit);
  const diagnostics = allDiagnostics.slice(0, limit);
  if (diagnostics.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <h2 className="text-xl font-semibold text-foreground">Resolution outcome diagnostics</h2>
      <p className="mt-2 text-sm leading-relaxed text-foreground/60">
        Status and CSAT signals flag answers that may need review. Resolution evidence still decides publishability.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {diagnostics.map((row) => (
          <article key={text(row.question)} className="rounded-xl border border-border bg-background/35 p-4">
            <h3 className="text-sm font-semibold text-foreground">{text(row.question)}</h3>
            <p className="mt-2 text-xs leading-relaxed text-foreground/55">{text(row.status_mix)}</p>
            <p className="mt-3 text-sm leading-relaxed text-foreground/68">{text(row.guidance)}</p>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-foreground/50">
        Diagnostics capped at {limit.toLocaleString()} rows here; download the complete evidence export for the full audit trail.
      </p>
    </section>
  );
}

function QuestionDetails({ section }: { section?: DeflectionReportSection }) {
  const detailRows = rows(asRecord(section?.data).rows).slice(0, QUESTION_DETAIL_LIMIT);
  if (detailRows.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <h2 className="text-xl font-semibold text-foreground">Top publishable answers and gaps</h2>
      <div className="mt-4 grid gap-4">
        {detailRows.map((row) => {
          const sourceCount = texts(row.source_ids).length;
          const steps = texts(row.steps);
          const publishable = text(row.answer_linkage) === 'publishable_answer';
          return (
            <article key={`${int(row.rank)}-${text(row.question)}`} className="rounded-xl border border-border bg-background/35 p-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                Question {int(row.rank).toLocaleString()} | {int(row.ticket_count).toLocaleString()} tickets
              </div>
              <h3 className="mt-2 text-base font-semibold leading-snug text-foreground">{text(row.question)}</h3>
              <p className="mt-2 text-sm text-foreground/60">{text(row.answer_status)}</p>
              {publishable ? (
                <>
                  <p className="mt-4 text-sm leading-relaxed text-foreground/75">{text(row.answer)}</p>
                  {steps.length > 0 && (
                    <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-foreground/65">
                      {steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                  )}
                </>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-foreground/70">
                  No uploaded resolution evidence was present for this question; keep it in review.
                </p>
              )}
              <p className="mt-4 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed text-foreground/55">
                {sourceCount.toLocaleString()} source tickets represented. Complete source IDs and quotes live in the evidence export.
              </p>
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-foreground/50">
        Detail cards capped at {QUESTION_DETAIL_LIMIT.toLocaleString()} questions for readability.
      </p>
    </section>
  );
}

export function DeflectionReportModelPage({
  model,
  requestId,
  companyName,
}: {
  model: DeflectionStructuredReport;
  requestId: string;
  companyName?: string;
}) {
  const sections = sortedWebSections(model);
  const supportTax = sectionById(model, 'support_tax');
  const searchChips = uploadedSearchChips(model);
  const showUploadedSearch = uploadedDeflectionSearchEnabled() && searchChips.length > 0;

  return (
    <main className="min-h-screen px-6 pb-20 pt-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono tracking-wide text-primary">
            <FileText className="h-3.5 w-3.5" />
            <span>MODEL-BACKED REPORT{companyName ? ` | ${companyName}` : ''}</span>
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Your Support Tax report is ready.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-foreground/65">
            This hosted view gives you the operating summary, ranked opportunities, publishable answer drafts,
            and review gaps. The complete evidence export remains the uncapped audit surface.
          </p>
        </div>

        <div className="space-y-8">
          <SupportTaxSummary section={supportTax} />
          {showUploadedSearch && (
            <section className="rounded-2xl border border-border bg-surface p-5 md:p-6">
              <h2 className="text-xl font-semibold text-foreground">
                Search the FAQ drafts built from this CSV
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-foreground/60">
                Try one of your ranked questions or search another customer phrase from
                the same uploaded report.
              </p>
              <DeflectionDemo
                requestId={requestId}
                chips={searchChips}
                className="mt-5"
                label="Search this unlocked report"
                idleCopy="Pick a question from your report or search another customer phrase from the uploaded CSV."
                searchingCopy="Searching the uploaded report..."
                noMatchCopy="No close match was found in this uploaded report."
                errorCopy="Uploaded report search is temporarily unavailable. Try again in a moment."
              />
            </section>
          )}
          {sections.map((section) => {
            if (section.id === 'support_tax') return null;
            if (section.id === 'source_file') {
              const sourceLabel = text(asRecord(section.data).source_label);
              return sourceLabel ? (
                <p key={section.id} className="text-xs font-mono uppercase tracking-widest text-foreground/45">
                  Source file: {sourceLabel}
                </p>
              ) : null;
            }
            if (section.id === 'seo_targets') return <SeoTargets key={section.id} section={section} />;
            if (section.id === 'ranked_questions') return <RankedQuestions key={section.id} section={section} />;
            if (section.id === 'priority_fix_queue') return <PriorityFixQueue key={section.id} section={section} />;
            if (section.id === 'top_unresolved_repeats') return <TopUnresolvedRepeats key={section.id} section={section} />;
            if (section.id === 'drafted_resolutions') return <DraftedResolutions key={section.id} section={section} />;
            if (section.id === 'already_covered_still_recurring') return <CoveredRecurring key={section.id} section={section} />;
            if (section.id === 'outcome_diagnostics') return <OutcomeDiagnostics key={section.id} section={section} />;
            if (section.id === 'question_details') return <QuestionDetails key={section.id} section={section} />;
            return null;
          })}
          <aside className="rounded-2xl border border-border bg-surface p-5 text-sm leading-relaxed text-foreground/65 md:p-6">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Complete evidence stays uncapped.
            </div>
            <p className="mt-2">
              Use the evidence export for every source ID, quote, and audit row. This page stays bounded so it can
              work as the decision surface.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
