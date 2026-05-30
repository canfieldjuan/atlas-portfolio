import { CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import type {
  FAQDeflectionReportArtifact,
  FAQTermMapping,
  TicketFAQItem,
} from '@/lib/deflection-report-contract';

function titleCase(value: string) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function cleanMarkdownText(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function MarkdownDeliverable({ markdown }: { markdown: string }) {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim());

  return (
    <article className="rounded-2xl border border-border bg-surface p-6 md:p-8">
      {lines.map((line, index) => {
        if (!line) return <div key={`space-${index}`} className="h-3" />;

        if (line.startsWith('### ')) {
          return (
            <h3 key={index} className="mt-6 text-lg font-semibold text-foreground first:mt-0">
              {cleanMarkdownText(line.slice(4))}
            </h3>
          );
        }

        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="mt-8 text-2xl font-semibold text-foreground first:mt-0">
              {cleanMarkdownText(line.slice(3))}
            </h2>
          );
        }

        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className="text-3xl font-semibold tracking-tight text-foreground">
              {cleanMarkdownText(line.slice(2))}
            </h1>
          );
        }

        if (/^\d+\.\s+/.test(line)) {
          return (
            <p key={index} className="mt-2 text-sm leading-relaxed text-foreground/70">
              <span className="font-mono text-primary/75">{line.match(/^\d+/)?.[0]}.</span>{' '}
              {cleanMarkdownText(line.replace(/^\d+\.\s+/, ''))}
            </p>
          );
        }

        if (line.startsWith('- ')) {
          return (
            <p key={index} className="mt-2 flex gap-2 text-sm leading-relaxed text-foreground/70">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
              <span>{cleanMarkdownText(line.slice(2))}</span>
            </p>
          );
        }

        return (
          <p key={index} className="mt-3 text-sm leading-relaxed text-foreground/70 first:mt-0">
            {cleanMarkdownText(line)}
          </p>
        );
      })}
    </article>
  );
}

function ProofBadges({ artifact }: { artifact: FAQDeflectionReportArtifact }) {
  const { summary } = artifact;
  const checks = summary.output_checks;
  const badges = [
    { label: 'Questions found', value: summary.generated.toLocaleString() },
    { label: 'Drafted answers', value: summary.drafted_answer_count.toLocaleString() },
    { label: 'No proven answer yet', value: summary.no_proven_answer_count.toLocaleString() },
    { label: 'Ticket sources', value: summary.ticket_source_count.toLocaleString() },
    { label: 'Uses customer vocabulary', value: checks.uses_user_vocabulary ? 'Yes' : 'Review' },
    { label: 'Action items included', value: checks.has_action_items ? 'Yes' : 'Review' },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {badges.map((badge) => (
        <div key={badge.label} className="rounded-xl border border-border bg-surface p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            {badge.label}
          </div>
          <div className="mt-2 text-xl font-semibold text-foreground">{badge.value}</div>
        </div>
      ))}
    </div>
  );
}

function EvidenceStatus({ status }: { status: TicketFAQItem['answer_evidence_status'] }) {
  const label = status === 'resolution_evidence' ? 'Resolved-answer evidence' : 'Draft needs review';

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-primary">
      <CheckCircle2 className="h-3 w-3" />
      {label}
    </span>
  );
}

function TermMappingRows({ mappings }: { mappings: FAQTermMapping[] }) {
  if (mappings.length === 0) return null;

  return (
    <div className="space-y-2">
      {mappings.slice(0, 3).map((mapping) => (
        <div
          key={`${mapping.customer_term}-${mapping.documentation_term}`}
          className="rounded-lg border border-border bg-background/40 p-3"
        >
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <div>
              <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-foreground/35">
                Customer term
              </div>
              <div className="font-medium text-foreground">&quot;{mapping.customer_term}&quot;</div>
            </div>
            <div>
              <div className="mb-1 font-mono text-[9px] uppercase tracking-widest text-foreground/35">
                Current docs say
              </div>
              <div className="font-medium text-foreground/70">
                &quot;{mapping.documentation_term}&quot;
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-foreground/55">{mapping.suggestion}</p>
        </div>
      ))}
    </div>
  );
}

function ItemCard({ item, rank }: { item: TicketFAQItem; rank: number }) {
  const visibleSources = (item.source_labels.length > 0 ? item.source_labels : item.source_ids).slice(
    0,
    3,
  );
  const hiddenSourceCount = Math.max(0, item.source_ids.length - visibleSources.length);

  return (
    <section className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            Opportunity #{rank}
          </div>
          <h3 className="mt-1 text-xl font-semibold text-foreground">{titleCase(item.topic)}</h3>
        </div>
        <EvidenceStatus status={item.answer_evidence_status} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <div className="text-2xl font-semibold tabular-nums text-foreground">{item.ticket_count}</div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            Tickets
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <div className="text-2xl font-semibold tabular-nums text-primary">
            {item.opportunity_score}
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            Opportunity
          </div>
        </div>
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <div className="text-2xl font-semibold tabular-nums text-foreground">
            {item.source_ids.length}
          </div>
          <div className="mt-1 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            Sources
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          <div>
            <div className="mb-1 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
              Customer wording
            </div>
            <p className="text-sm leading-relaxed text-foreground/75">
              &quot;{item.question}&quot;
            </p>
          </div>
          <div>
            <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
              Vocabulary gaps
            </div>
            <TermMappingRows mappings={item.term_mappings} />
          </div>
          <div>
            <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
              Source tickets
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleSources.map((source) => (
                <span
                  key={source}
                  className="rounded-md border border-border bg-background/40 px-2.5 py-1 text-[11px] font-mono text-foreground/55"
                >
                  {source}
                </span>
              ))}
              {hiddenSourceCount > 0 && (
                <span className="rounded-md border border-border bg-background/40 px-2.5 py-1 text-[11px] font-mono text-foreground/45">
                  +{hiddenSourceCount} more
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
          <div className="mb-2 text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            Draft FAQ
          </div>
          <h4 className="text-base font-semibold leading-snug text-foreground">{item.question}</h4>
          <p className="mt-3 text-sm leading-relaxed text-foreground/65">{item.answer}</p>
          <ol className="mt-4 space-y-2">
            {item.steps.map((step, index) => (
              <li key={step} className="flex gap-2 text-sm leading-relaxed text-foreground/70">
                <span className="mt-0.5 font-mono text-xs text-primary/75">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <p className="mt-4 rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-foreground/60">
            <span className="font-medium text-foreground/75">When to contact support: </span>
            {item.when_to_contact_support}
          </p>
          {item.action_items.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {item.action_items.map((action) => (
                <span
                  key={action}
                  className="rounded-md border border-primary/30 px-3 py-1.5 text-xs text-primary"
                >
                  {action}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function DeflectionReportArtifactPage({
  artifact,
  companyName,
}: {
  artifact: FAQDeflectionReportArtifact;
  companyName?: string;
}) {
  const topItems = artifact.faq_result.items.slice(0, 5);

  return (
    <main className="min-h-screen px-6 pb-20 pt-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono tracking-wide text-primary">
            <FileText className="h-3.5 w-3.5" />
            <span>FULL DEFLECTION REPORT{companyName ? ` | ${companyName}` : ''}</span>
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Your paid report is ready to review.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-foreground/65">
            The markdown report is the deliverable. The cards below are the drill-down
            view over the same `faq_result.items` data.
          </p>
        </div>

        <ProofBadges artifact={artifact} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <MarkdownDeliverable markdown={artifact.markdown} />
          <aside className="rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-6 lg:self-start">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground/45">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Report summary
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-foreground/45">Top question</dt>
                <dd className="mt-1 font-medium leading-snug text-foreground">
                  {artifact.summary.top_question}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/45">Top opportunity score</dt>
                <dd className="mt-1 font-mono text-foreground">
                  {artifact.summary.top_opportunity_score}
                </dd>
              </div>
              <div>
                <dt className="text-foreground/45">Generated FAQ items</dt>
                <dd className="mt-1 font-mono text-foreground">
                  {artifact.faq_result.generated.toLocaleString()}
                </dd>
              </div>
            </dl>
          </aside>
        </div>

        <section className="mt-10 space-y-4">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary/80">
              Drill-down cards
            </div>
            <h2 className="mt-2 text-2xl font-semibold text-foreground">
              Top FAQ opportunities from the same report data.
            </h2>
          </div>
          {topItems.map((item, index) => (
            <ItemCard key={`${item.topic}-${item.question}`} item={item} rank={index + 1} />
          ))}
        </section>
      </div>
    </main>
  );
}
