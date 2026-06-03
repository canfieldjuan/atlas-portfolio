import { CheckCircle2, FileText, ShieldCheck } from 'lucide-react';
import type { FAQDeflectionReportArtifact } from '@/lib/deflection-report-contract';

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
              <table className="min-w-full border-collapse text-left text-sm">
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

function ProofBadges({ artifact }: { artifact: FAQDeflectionReportArtifact }) {
  const { summary } = artifact;
  const checks = summary.output_checks;
  const badges = [
    { label: 'Ranked questions', value: summary.generated.toLocaleString() },
    { label: 'Publishable answers', value: summary.drafted_answer_count.toLocaleString() },
    { label: 'Needs resolution first', value: summary.no_proven_answer_count.toLocaleString() },
    { label: 'Repeat-ticket sources', value: summary.ticket_source_count.toLocaleString() },
    { label: 'Customer phrases', value: checks.uses_user_vocabulary ? 'Mapped' : 'Review' },
    { label: 'Action list', value: checks.has_action_items ? 'Included' : 'Review' },
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

function ReportContentsPanel({ artifact }: { artifact: FAQDeflectionReportArtifact }) {
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
    <aside className="rounded-2xl border border-border bg-surface p-5 lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-foreground/45">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        Paid report contents
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-foreground/45">First ranked opportunity</dt>
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
      </dl>

      <ul className="mt-5 space-y-3 text-sm leading-relaxed text-foreground/65">
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
    </aside>
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <MarkdownDeliverable markdown={artifact.markdown} />
          <ReportContentsPanel artifact={artifact} />
        </div>
      </div>
    </main>
  );
}
