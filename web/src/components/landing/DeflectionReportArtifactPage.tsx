import { CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import type { FAQDeflectionReportArtifact, TicketFAQItem } from '@/lib/deflection-report-contract';

function cleanMarkdownText(value: string) {
  return value
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function isPipeTableRow(line: string) {
  return line.startsWith('|') && line.endsWith('|') && line.slice(1, -1).includes('|');
}

function isPipeSeparatorRow(line: string) {
  return /^\|?(\s*:?-{3,}:?\s*\|)+\s*$/.test(line);
}

function parsePipeCells(line: string) {
  return line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(cleanMarkdownText);
}

function MarkdownDeliverable({ markdown }: { markdown: string }) {
  const lines = markdown.split(/\r?\n/).map((line) => line.trim());
  const blocks: Array<
    | { kind: 'space'; key: number }
    | { kind: 'heading'; key: number; level: 2 | 3 | 4; text: string }
    | { kind: 'paragraph'; key: number; text: string }
    | { kind: 'ordered'; key: number; items: string[] }
    | { kind: 'unordered'; key: number; items: string[] }
    | { kind: 'table'; key: number; rows: string[][] }
  > = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];

    if (!line) {
      blocks.push({ kind: 'space', key: index });
      continue;
    }

    if (isPipeTableRow(line)) {
      const rows: string[][] = [];
      while (index < lines.length && isPipeTableRow(lines[index])) {
        if (!isPipeSeparatorRow(lines[index])) rows.push(parsePipeCells(lines[index]));
        index++;
      }
      index--;
      if (rows.length > 0) blocks.push({ kind: 'table', key: index, rows });
      continue;
    }

    if (line.startsWith('### ')) {
      blocks.push({ kind: 'heading', key: index, level: 4, text: cleanMarkdownText(line.slice(4)) });
      continue;
    }

    if (line.startsWith('## ')) {
      blocks.push({ kind: 'heading', key: index, level: 3, text: cleanMarkdownText(line.slice(3)) });
      continue;
    }

    if (line.startsWith('# ')) {
      blocks.push({ kind: 'heading', key: index, level: 2, text: cleanMarkdownText(line.slice(2)) });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(cleanMarkdownText(lines[index].replace(/^\d+\.\s+/, '')));
        index++;
      }
      index--;
      blocks.push({ kind: 'ordered', key: index, items });
      continue;
    }

    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push(cleanMarkdownText(lines[index].slice(2)));
        index++;
      }
      index--;
      blocks.push({ kind: 'unordered', key: index, items });
      continue;
    }

    blocks.push({ kind: 'paragraph', key: index, text: cleanMarkdownText(line) });
  }

  return (
    <article className="rounded-2xl border border-border bg-surface p-6 md:p-8">
      {blocks.map((block) => {
        if (block.kind === 'space') return <div key={`space-${block.key}`} className="h-3" />;

        if (block.kind === 'heading' && block.level === 2) {
          return (
            <h2 key={block.key} className="mt-8 text-3xl font-semibold tracking-tight text-foreground first:mt-0">
              {block.text}
            </h2>
          );
        }

        if (block.kind === 'heading' && block.level === 3) {
          return (
            <h3 key={block.key} className="mt-8 text-2xl font-semibold text-foreground first:mt-0">
              {block.text}
            </h3>
          );
        }

        if (block.kind === 'heading') {
          return (
            <h4 key={block.key} className="mt-6 text-lg font-semibold text-foreground first:mt-0">
              {block.text}
            </h4>
          );
        }

        if (block.kind === 'ordered') {
          return (
            <ol key={block.key} className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-foreground/70">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          );
        }

        if (block.kind === 'unordered') {
          return (
            <ul key={block.key} className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-foreground/70">
              {block.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          );
        }

        if (block.kind === 'table') {
          const [header, ...body] = block.rows;
          return (
            <div key={block.key} className="mt-4 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-background/50 text-foreground">
                  <tr>
                    {header.map((cell, cellIndex) => (
                      <th key={`${cell}-${cellIndex}`} className="border-b border-border px-3 py-2 font-semibold">
                        {cell}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {body.map((row, rowIndex) => (
                    <tr key={`${block.key}-${rowIndex}`} className="border-t border-border/70">
                      {row.map((cell, cellIndex) => (
                        <td key={`${cell}-${cellIndex}`} className="px-3 py-2 text-foreground/70">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        return (
          <p key={block.key} className="mt-3 text-sm leading-relaxed text-foreground/70 first:mt-0">
            {block.text}
          </p>
        );
      })}
    </article>
  );
}

function guidanceFor(item: TicketFAQItem) {
  const actionItems = item.action_items.map((action) => action.trim()).filter(Boolean);
  const contactSupport = item.when_to_contact_support.trim();

  return {
    actionItems,
    contactSupport,
    hasGuidance: actionItems.length > 0 || contactSupport.length > 0,
  };
}

function ProofBadges({ artifact }: { artifact: FAQDeflectionReportArtifact }) {
  const { summary } = artifact;
  const checks = summary.output_checks;
  const guidanceCount = artifact.faq_result.items.filter((item) => guidanceFor(item).hasGuidance).length;
  const badges = [
    { label: 'Ranked questions', value: summary.generated.toLocaleString() },
    { label: 'Publishable answers', value: summary.drafted_answer_count.toLocaleString() },
    { label: 'Needs resolution first', value: summary.no_proven_answer_count.toLocaleString() },
    { label: 'Repeat-ticket sources', value: summary.ticket_source_count.toLocaleString() },
    { label: 'Customer phrases', value: checks.uses_user_vocabulary ? 'Mapped' : 'Review' },
    {
      label: 'Reviewer guidance',
      value: guidanceCount > 0 ? `${guidanceCount.toLocaleString()} items` : checks.has_action_items ? 'Review' : 'None',
    },
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

function ReportContentsPrimer({ artifact }: { artifact: FAQDeflectionReportArtifact }) {
  const contents = [
    {
      label: 'Support Tax Confirmation',
      detail: `${artifact.summary.ticket_source_count.toLocaleString()} repeat-ticket sources tied to the cost story from the snapshot.`,
    },
    {
      label: 'Ranked Question Opportunities',
      detail: `${artifact.summary.generated.toLocaleString()} repeat questions sorted by customer pain and publishing value.`,
    },
    {
      label: 'Your Help-Desk SEO Targeting List',
      detail: 'Customer phrases and intent gaps for help-center headings and internal search.',
    },
    {
      label: 'Publishable Help-Center Copy',
      detail: `${artifact.summary.drafted_answer_count.toLocaleString()} evidence-backed answer drafts ready for review.`,
    },
    {
      label: 'Evidence Appendix',
      detail: 'Traceable proof for reviewers without a separate source-card wall in the main flow.',
    },
  ];

  return (
    <aside className="rounded-2xl border border-border bg-surface p-5 md:p-6">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground/45">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          Paid report contents
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/60">
          A quick map of the unlocked report before the full ranked backlog,
          copy drafts, and evidence appendix.
        </p>
      </div>

      <dl className="mt-5 grid gap-4 border-t border-border/70 pt-5 text-sm md:grid-cols-[minmax(0,1fr)_180px]">
        <div>
          <dt className="text-foreground/45">First ranked opportunity</dt>
          <dd className="mt-1 font-medium leading-snug text-foreground">
            {artifact.summary.top_question}
          </dd>
        </div>
        <div className="border-t border-border/60 pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
          <dt className="text-foreground/45">Top opportunity score</dt>
          <dd className="mt-1 font-mono text-foreground">
            {artifact.summary.top_opportunity_score}
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-border/70 pt-5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
          Report map
        </div>
        <ul className="mt-3 grid gap-x-5 gap-y-4 text-sm leading-relaxed text-foreground/65 md:grid-cols-2">
          {contents.map((item) => (
            <li key={item.label} className="flex gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <strong className="text-foreground">{item.label}</strong>
                <span className="block text-foreground/55">{item.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

function PaidReviewerGuidance({ artifact }: { artifact: FAQDeflectionReportArtifact }) {
  const guidanceItems = artifact.faq_result.items
    .map((item) => ({ item, guidance: guidanceFor(item) }))
    .filter(({ guidance }) => guidance.hasGuidance);

  return (
    <section className="mt-10">
      <div className="text-[10px] font-mono uppercase tracking-widest text-primary/80">
        Reviewer guidance
      </div>
      <h2 className="mt-2 text-2xl font-semibold text-foreground">
        Escalation boundaries and action checklists
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground/60">
        These paid-only notes preserve the operational guidance from the unlocked
        artifact without restoring the old source-ticket or vocabulary drill-down
        cards.
      </p>

      {guidanceItems.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {guidanceItems.map(({ item, guidance }, index) => (
            <article
              key={`${item.topic}-${item.question}`}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                Question {index + 1}
              </div>
              <h3 className="mt-1 text-base font-semibold leading-snug text-foreground">
                {item.question}
              </h3>

              {guidance.actionItems.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-foreground/68">
                  {guidance.actionItems.map((action) => (
                    <li key={action} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              )}

              {guidance.contactSupport && (
                <p className="mt-4 rounded-lg border border-border bg-background/40 p-3 text-xs leading-relaxed text-foreground/62">
                  <span className="font-medium text-foreground/75">When to contact support: </span>
                  {guidance.contactSupport}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-border bg-surface p-4 text-sm text-foreground/60">
          No separate reviewer guidance was included with this artifact.
        </p>
      )}
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
  return (
    <main className="min-h-screen px-6 pb-20 pt-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono tracking-wide text-primary">
            <FileText className="h-3.5 w-3.5" />
            <span>FULL BACKLOG REPORT{companyName ? ` | ${companyName}` : ''}</span>
          </div>
          <h1 className="max-w-3xl text-3xl font-semibold leading-[1.1] tracking-tight text-foreground md:text-5xl">
            Your complete Support Tax report is ready.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-foreground/65">
            The snapshot showed the cost of repeated tickets. This paid report gives
            the full ranked backlog, the Help-Desk SEO targeting list, publishable
            answer drafts, and the evidence appendix reviewers need.
          </p>
        </div>

        <ProofBadges artifact={artifact} />

        <div className="mt-8 space-y-8">
          <ReportContentsPrimer artifact={artifact} />
          <MarkdownDeliverable markdown={artifact.markdown} />
        </div>

        <PaidReviewerGuidance artifact={artifact} />
      </div>
    </main>
  );
}
