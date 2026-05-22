'use client';

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calculator,
  Clock,
  FileText,
  Repeat,
  Workflow,
} from 'lucide-react';
import {
  DiagnosticReportLandingPage,
  type DiagnosticPricingTier,
  type DiagnosticReportLandingPageConfig,
} from '@/components/landing/DiagnosticReportLandingPage';
import { generateFaqJsonLd } from '@/lib/seo';

// All on-page CTAs route to the focused deflection report intake (CSV upload),
// not the broader /audit form. Kept as a single constant so future renames
// or per-CTA tracking params are one-edit-one-file.
const GAP_REPORT_INTAKE_HREF = '/systems/ai-content-ops/intake';

const pipelineStages = [
  { label: 'Support Tickets', sub: 'CSV • Last 90 days' },
  { label: 'Cluster by Intent' },
  { label: 'Rank by Volume' },
  { label: 'Extract Customer Wording' },
  { label: 'Draft Self-Service Answers' },
  { label: 'Review & Publish', sub: 'You approve, edit, ship' },
];

const reportContents = [
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Repeat Tickets Ranked by Volume',
    desc: 'The questions customers keep asking, sorted by how often they hit the inbox. That way you can see which answers can reduce avoidable support work first.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Deflectable Ticket Opportunities',
    desc: 'The repeat questions that should not need another human reply because the answer can be turned into a clear self-service path.',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Customer Wording',
    desc: 'The words customers actually use when they are stuck. This matters because customers search in their own language, not your internal labels.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Self-Service Answers to Review',
    desc: 'Plain-spoken self-service answers for the repeat questions your team should stop answering one ticket at a time. Review, edit, and publish.',
  },
  {
    icon: <Calculator className="w-5 h-5" />,
    title: 'Cost-Cutter Notes',
    desc: 'Short notes that explain why the answer is worth fixing now, based on repeat volume and the support work showing up in the tickets.',
  },
  {
    icon: <Repeat className="w-5 h-5" />,
    title: 'What Changed Next Time',
    desc: 'If you run it again, the next report shows which repeat questions are still reaching the inbox and what your self-service layer should handle next.',
  },
];

const useCases = [
  {
    title: `Founder or owner still close to support`,
    detail:
      `You still see the customer emails, Slack pings, and support replies because the team is small. You know the same questions keep coming back, and every repeat answer is time the team does not get back.`,
  },
  {
    title: `Head of Support trying to cut ticket volume`,
    detail:
      `Your KPI is not “write more FAQs.” It is fewer avoidable tickets. The problem is that the inbox is too busy to stop and sort 90 days of tickets by hand.`,
  },
  {
    title: `Small team without a full-time docs person`,
    detail:
      `You have enough customers to need self-service, but not enough people to keep the help center current. You need the first answers written so someone on the team can review, edit, and publish.`,
  },
];

const pricingTiers: DiagnosticPricingTier[] = [
  {
    id: `snapshot`,
    badge: `FIRST 5 DESIGN PARTNERS`,
    title: `Deflection Snapshot`,
    price: `Free`,
    sla: `Delivered in 24 hours after CSV upload`,
    description:
      `Upload your last 90 days of tickets. We send back enough to show you the pattern: the repeat questions, customer wording, and one self-service answer so you can see if the full report is worth doing.`,
    includes: [
      `Top 5-10 repeat questions`,
      `Customer wording examples`,
      `1 sample self-service answer`,
      `No card required, no contract`,
    ],
    note: `The free snapshot proves whether the pattern is there. It is not the full report.`,
    cta: `Get the free snapshot`,
    href: GAP_REPORT_INTAKE_HREF,
    highlighted: true,
  },
  {
    id: `full-report`,
    badge: `FULL REPORT`,
    title: `Full Deflection Report`,
    price: `$1,500`,
    description:
      `For the first 90-day batch. We turn the repeat questions into a full Support Ticket Deflection Report your team can use to decide what to fix and publish first.`,
    includes: [
      `Top 25-50 repeat questions`,
      `Customer wording clusters`,
      `Missing or hard-to-find answer list`,
      `3-5 self-service answers to review and publish`,
      `Priority notes and source ticket IDs`,
    ],
    note: `This is the paid version of the work: enough detail to actually update the help center.`,
    cta: `Start the full report`,
    href: GAP_REPORT_INTAKE_HREF,
  },
  {
    id: `quarterly-refresh`,
    title: `Quarterly Refresh`,
    price: `$1,500`,
    priceDetail: `/ quarter`,
    description:
      `Run the report every 90 days so your help center keeps up as customer questions change. Good for teams that keep seeing new repeat issues.`,
    includes: [
      `Full Deflection Report every 90 days`,
      `What changed since the last report`,
      `Questions that are still coming back`,
      `New self-service answers to review and publish`,
      `Cancel any time after the next report`,
    ],
    note: `Best after the first full report proves the work is useful.`,
    cta: `Keep it updated`,
    href: GAP_REPORT_INTAKE_HREF,
  },
];

const pricingFaqs: { q: string; a: string }[] = [
  {
    q: `What do I get in the free snapshot?`,
    a: `You get the top repeat questions we can see, a few examples of the words customers use, and one sample self-service answer. It is enough to show whether your old tickets are worth turning into a full Support Ticket Deflection Report. It is not the full report.`,
  },
  {
    q: `What do I get in the full Deflection Report?`,
    a: `The full report gives you the bigger working list: 25-50 repeat questions, customer wording clusters, missing or hard-to-find answers, 3-5 self-service answers, priority notes, and source ticket IDs.`,
  },
  {
    q: `What if my tickets are messy?`,
    a: `Messy is fine. Customers do not ask questions in neat categories. We group tickets by what the customer was trying to do, not by perfect tags or clean labels.`,
  },
  {
    q: `What about private customer data?`,
    a: `If your export tool can remove names, emails, phone numbers, or other private details, do that first. If it cannot, upload the CSV anyway and we remove private data in the intake step before model processing. No model training, no fine-tuning, no sharing.`,
  },
  {
    q: `Why use customer wording?`,
    a: `Because customers search for the problem in their own words. If they ask support one way and your help center says it another way, the answer can exist and still be hard to find.`,
  },
  {
    q: `How much editing will the answers need?`,
    a: `Plan on light editing. Most teams adjust tone, add a product link, confirm the exact steps, and publish. The point is that you are not starting from a blank page.`,
  },
  {
    q: `What if we do not have enough tickets?`,
    a: `Then we will tell you. The report works best when repeat questions show up clearly. If the export is too thin to be useful, we will not pretend there is a pattern that is not there.`,
  },
  {
    q: `Do we have to sign up for quarterly reports?`,
    a: `No. Start with the free snapshot. If the snapshot is useful, you can pay for the full Deflection Report. Quarterly refreshes are only for teams that want to keep the help center updated as new repeat questions show up.`,
  },
];

const faqJsonLd = generateFaqJsonLd(
  pricingFaqs.map((faq) => ({ question: faq.q, answer: faq.a })),
);

const sampleRankedQuestions: {
  issue: string;
  question: string;
  count: number;
  sourceType: string;
}[] = [
  {
    issue: `Credit report disputes`,
    question: `How can I dispute credit report information that keeps reappearing or has not been corrected?`,
    count: 28,
    sourceType: `CFPB complaint narratives`,
  },
  {
    issue: `Mortgage servicing issues`,
    question: `What should I do when a mortgage servicer says I am behind or mishandles escrow, payments, or loss mitigation?`,
    count: 12,
    sourceType: `CFPB complaint narratives`,
  },
  {
    issue: `Debt collection disputes`,
    question: `How do I respond when a collector contacts me about a debt I do not recognize or says I still owe?`,
    count: 6,
    sourceType: `CFPB complaint narratives`,
  },
];

const sampleFaqExamples = [
  {
    issue: `Credit report disputes`,
    question: `How can I dispute credit report information that keeps reappearing or has not been corrected?`,
    summary:
      `Consumers repeatedly described disputed credit report information that was not corrected, was verified without enough explanation, or returned after earlier disputes.`,
    steps: [
      `Collect the report section, account name, dates, and any letters or screenshots that show what is wrong.`,
      `File the dispute with each credit reporting company that shows the information, and keep the confirmation number.`,
      `Attach supporting records instead of relying only on a short written explanation.`,
      `Track the response date and compare the updated report against the exact item you disputed.`,
    ],
    supportGuidance:
      `Contact support or the reporting company again if the same item returns, the response does not explain what was verified, or the correction appears on one report but not another.`,
    sources: [`CFPB #1885409`, `CFPB #1973120`, `CFPB #2209426`, `CFPB #2591415`, `CFPB #3138626`],
  },
  {
    issue: `Mortgage servicing issues`,
    question: `What should I do when a mortgage servicer says I am behind or mishandles escrow, payments, or loss mitigation?`,
    summary:
      `The repeated pattern was not one isolated payment question. Consumers described servicer records that did not match their own, escrow changes that were hard to reconcile, or loss-mitigation steps that stalled without clear status.`,
    steps: [
      `Download your payment history, escrow statements, notices, and any loss-mitigation letters before calling.`,
      `Ask the servicer to identify the exact month, fee, escrow line, or document causing the issue.`,
      `Send missing documents through a trackable channel and keep the upload or delivery confirmation.`,
      `Request a written explanation when the servicer says the account is delinquent or incomplete.`,
    ],
    supportGuidance:
      `Contact support again if the servicer cannot point to the specific missing item, applies payments differently than your records show, or gives conflicting status updates across calls and letters.`,
    sources: [`CFPB #2326114`, `CFPB #2619048`, `CFPB #2885301`, `CFPB #3377106`],
  },
  {
    issue: `Debt collection disputes`,
    question: `How do I respond when a collector contacts me about a debt I do not recognize or says I still owe?`,
    summary:
      `Consumers often reported collection attempts for debts they did not recognize, debts they believed were already paid, or accounts where the collector had not provided enough validation detail.`,
    steps: [
      `Do not rely on a phone call alone. Ask for the collector name, account number, original creditor, amount, and written validation.`,
      `Compare the validation notice with your own records, credit reports, and payment history.`,
      `If the debt is not yours or the amount is wrong, send a written dispute and keep a copy.`,
      `Document every contact attempt, including dates, phone numbers, letters, and any payment demands.`,
    ],
    supportGuidance:
      `Contact support, the collector, or the relevant regulator if collection continues without validation, the collector reports disputed debt as undisputed, or you receive threats or contact patterns that seem improper.`,
    sources: [`CFPB #1678934`, `CFPB #2047189`, `CFPB #2755042`, `CFPB #3446907`],
  },
];

const demoScaleStats = [
  { value: `1.28M`, label: `public archive rows` },
  { value: `383k`, label: `rows with narratives` },
  { value: `1,000`, label: `rows validated` },
  { value: `46`, label: `rows shown in excerpt` },
];

const heroReportRows = [
  {
    issue: `Billing confusion`,
    count: `41 tickets`,
    phrase: `why was I charged twice?`,
  },
  {
    issue: `Team access`,
    count: `29 tickets`,
    phrase: `how do I add another person?`,
  },
  {
    issue: `Cancellation steps`,
    count: `18 tickets`,
    phrase: `how do I cancel my account?`,
  },
];

const comparisonRows = [
  {
    customer: `how do I add another person?`,
    traditional: `Seat management permissions`,
    answer: `How do I invite a teammate without giving them billing access?`,
  },
  {
    customer: `why was I charged twice?`,
    traditional: `Billing reconciliation policy`,
    answer: `Why do I see two charges after changing my plan?`,
  },
  {
    customer: `can I cancel before renewal?`,
    traditional: `Account lifecycle changes`,
    answer: `How do I cancel before my renewal date?`,
  },
];

function DeflectionReportHeroArtifact() {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--artifact-dark-border)] bg-[var(--artifact-dark)] shadow-[var(--artifact-shadow)]">
      <div className="border-b border-[var(--artifact-dark-border-muted)] px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--artifact-success-text)]">
              Support Ticket Deflection Report
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--artifact-inverse)]">
              24-hour snapshot preview
            </p>
          </div>
          <div className="rounded-full border border-[var(--artifact-success-text-border)] bg-[var(--artifact-success-text-surface)] px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-[var(--artifact-success-text-strong)]">
            CSV uploaded
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            [`90 days`, `ticket window`],
            [`Top 25`, `questions ranked`],
            [`5 answers`, `ready to review`],
          ].map(([value, label]) => (
            <div key={label} className="rounded-lg border border-[var(--artifact-dark-border-muted)] bg-[var(--artifact-paper)] px-3 py-3">
              <p className="text-lg font-semibold text-[var(--artifact-paper-text)]">{value}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--artifact-paper-muted)]">
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-[var(--artifact-dark-border-muted)] bg-[var(--artifact-dark-muted)] p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--artifact-success-text)]">
              Repeat questions found
            </p>
            <p className="text-[10px] font-mono text-[var(--artifact-inverse-muted)]">ranked by volume</p>
          </div>
          <div className="space-y-2">
            {heroReportRows.map((row, index) => (
              <div key={row.issue} className="rounded-md bg-[var(--artifact-paper)] px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--artifact-paper-text)]">
                    {String(index + 1).padStart(2, '0')} · {row.issue}
                  </p>
                  <p className="shrink-0 text-[11px] font-mono text-[var(--artifact-success-muted)]">{row.count}</p>
                </div>
                <p className="mt-1 text-xs text-[var(--artifact-paper-muted)]">Customer phrase: &ldquo;{row.phrase}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-[var(--artifact-success-border-veil)] bg-[var(--artifact-success-surface)] p-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--artifact-success)]">
            Self-service answer your team reviews
          </p>
          <p className="mt-2 text-sm font-semibold text-[var(--artifact-paper-text)]">
            Why do I see two charges after changing my plan?
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[var(--artifact-body)]">
            Most duplicate-looking charges come from a plan change, renewal timing, or a pending authorization. Check your billing page for the invoice date first. If both charges posted, send support the two invoice IDs so they can confirm the adjustment.
          </p>
        </div>
      </div>
    </div>
  );
}

function HelpCenterComparison() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-[var(--artifact-danger-border)] bg-[var(--artifact-danger-surface)] p-5 shadow-[var(--card-shadow)]">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--artifact-danger-tint)] text-[var(--artifact-danger)]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--artifact-danger)]">
              Traditional help center
            </p>
            <h3 className="text-lg font-semibold text-[var(--artifact-paper-text)]">Answers written in company language</h3>
          </div>
        </div>
        <div className="space-y-3">
          {comparisonRows.map((row) => (
            <div key={row.traditional} className="rounded-lg border border-[var(--artifact-danger-border-muted)] bg-white px-4 py-3">
              <p className="text-[11px] text-[var(--artifact-danger)]">Customer searches: &ldquo;{row.customer}&rdquo;</p>
              <p className="mt-1 text-sm font-medium text-[var(--artifact-paper-text)]">{row.traditional}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 border-t border-[var(--artifact-danger-border-muted)] pt-4 text-sm leading-relaxed text-[var(--artifact-danger-muted)]">
          The answer may exist, but the title and wording do not match how customers describe the problem when they are stuck.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--artifact-success-border)] bg-[var(--artifact-success-panel)] p-5 shadow-[var(--card-shadow)]">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--artifact-success-surface)] text-[var(--artifact-success)]">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--artifact-success)]">
              Deflection answer layer
            </p>
            <h3 className="text-lg font-semibold text-[var(--artifact-paper-text)]">Answers drafted from customer wording</h3>
          </div>
        </div>
        <div className="space-y-3">
          {comparisonRows.map((row) => (
            <div key={row.answer} className="rounded-lg border border-[var(--artifact-success-border-muted)] bg-white px-4 py-3">
              <p className="text-[11px] text-[var(--artifact-success)]">Ticket phrase preserved: &ldquo;{row.customer}&rdquo;</p>
              <p className="mt-1 text-sm font-medium text-[var(--artifact-paper-text)]">{row.answer}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 border-t border-[var(--artifact-success-border-muted)] pt-4 text-sm leading-relaxed text-[var(--artifact-body)]">
          Your team still reviews the answer. The difference is that the first draft starts from the way customers actually ask.
        </p>
      </div>
    </div>
  );
}

function DeflectionReportSample() {
  const totalSources = sampleRankedQuestions.reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="glass rounded-xl border border-border overflow-hidden">
      <div className="border-b border-border px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-surface">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-primary/80" />
          <span className="text-sm font-medium text-white">Support Ticket Deflection Report</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            · Live Demo / Public Dataset
          </span>
        </div>
        <div className="text-[11px] font-mono text-foreground/45">
          Source: 1.28M-row public archive · 1,000-row run validated
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {demoScaleStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-surface px-3 py-3">
              <p className="text-lg font-semibold text-white">{stat.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Headline number */}
        <div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-2">
            HEADLINE FINDING
          </div>
          <p className="text-base text-foreground/75 leading-relaxed">
            A local CFPB public complaint archive contains{' '}
            <span className="text-white font-medium">1,282,355 rows</span>, including{' '}
            <span className="text-white font-medium">383,564 rows with consumer narratives</span>.
            The answer generator was validated on{' '}
            <span className="text-white font-medium">1,000 public complaint narratives</span>
            {' '}with fail-closed output checks before this page leaned on the scale claim.
            Customer reports are built for full uploaded CSV batches, including common{' '}
            <span className="text-white font-medium">500-1,000+ ticket exports</span>.
            The <span className="text-white font-medium">{totalSources}-row excerpt below</span>{' '}
            is kept short so visitors can inspect grounded output without reading a full report.
          </p>
        </div>

        {/* Ranked list */}
        <div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            REPEAT PUBLIC COMPLAINT ISSUES — EXCERPT RANKING
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            {sampleRankedQuestions.map((row, i) => (
              <div
                key={row.issue}
                className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
                  i < sampleRankedQuestions.length - 1 ? 'border-b border-border' : ''
                } bg-surface`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-mono text-foreground/40 w-5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium truncate">{row.issue}</p>
                    <p className="text-xs text-foreground/55 leading-snug mt-1">
                      &ldquo;{row.question}&rdquo;
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0 pl-8 sm:pl-0">
                  <span className="text-xs font-mono text-foreground/55">
                    {row.count} excerpt sources
                  </span>
                  <span className="hidden md:inline text-xs text-foreground/40">
                    {row.sourceType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sample answers */}
        <div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            GENERATED SELF-SERVICE ANSWER EXCERPTS — 3 ISSUE GROUPS
          </div>
          <div className="rounded-lg border border-border bg-surface overflow-hidden">
            {sampleFaqExamples.map((example, exampleIndex) => (
              <div
                key={example.issue}
                className={`p-5 ${exampleIndex > 0 ? 'border-t border-border' : ''}`}
              >
                <p className="text-[10px] font-mono text-primary/80 tracking-widest mb-2">
                  {example.issue.toUpperCase()}
                </p>
                <p className="text-sm font-medium text-white mb-3">
                  Q: {example.question}
                </p>
                <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                  {example.summary}
                </p>
                <div className="mb-4">
                  <p className="text-[11px] font-mono text-foreground/45 tracking-widest mb-2">
                    ACTION STEPS
                  </p>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/70 leading-relaxed">
                    {example.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
                <p className="text-sm text-foreground/65 leading-relaxed mb-4">
                  <span className="text-white font-medium">When to contact support: </span>
                  {example.supportGuidance}
                </p>
                <p className="text-[11px] font-mono text-foreground/45">
                  Sources:{' '}
                  {example.sources.map((id, i) => (
                    <span key={id}>
                      {i > 0 && <span className="text-foreground/30"> · </span>}
                      <span className="text-foreground/55">{id}</span>
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-foreground/45 leading-relaxed border-t border-border pt-4">
          Demo generated from a public complaint dataset. The generator passed a 1,000-row
          validation run; the on-page excerpt is intentionally compact. Customer reports use
          your uploaded CSV and analyze your full support batch.
          {' '}
          <a
            href="/systems/ai-content-ops/public-support-ticket-faq-demo.md"
            className="text-primary/90 hover:text-primary underline underline-offset-4"
          >
            View the compact Markdown demo
          </a>
          {' '}
          or{' '}
          <a
            href="/systems/ai-content-ops/public-support-ticket-faq-1000-row-validated.md"
            className="text-primary/90 hover:text-primary underline underline-offset-4"
          >
            inspect the 1,000-row validation output
          </a>
          .
        </p>
      </div>
    </div>
  );
}

const sharedCta = {
  label: 'Upload your CSV — free Deflection Snapshot',
  href: GAP_REPORT_INTAKE_HREF,
};

const privacyCopy =
  'Privacy: we delete your CSV after 30 days. No model training, no third-party sharing, no fine-tuning.';

const landingPageConfig: DiagnosticReportLandingPageConfig = {
  structuredData: faqJsonLd,
  hero: {
    eyebrow: 'SUPPORT TICKET DEFLECTION',
    eyebrowIcon: <Workflow className="w-3 h-3" />,
    kicker: 'An automated cost cutter built from the tickets your customers already opened.',
    title:
      'Stop paying your team to answer the same 15 questions over and over.',
    intro: 'Drop in your Zendesk history. We find the repeat tickets and turn them into a self-service layer built to keep avoidable questions out of the inbox.',
    body:
      'Upload a CSV of your last 90 days of support tickets. We group the repeat questions, show which ones cost the most support time, pull out the words customers actually use, and draft the self-service answers your team can review and publish. No integration. No extra data project. Just the repeat-ticket cost hiding in your inbox.',
    cta: sharedCta,
    artifact: <DeflectionReportHeroArtifact />,
  },
  problem: {
    label: 'YOUR PROBLEM',
    title: 'Repeat tickets are a support-cost problem before they are a content problem.',
    content: (
      <div className="space-y-4 text-foreground/65 leading-relaxed">
        <p>
          When customers can’t find answers, they don’t always complain. Sometimes they just leave.
        </p>
        <p>That is what makes repeat support questions expensive.</p>
        <p>At first, they look small:</p>
        <div className="rounded-xl border border-border bg-surface p-5 md:p-6">
          <div className="grid gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div>
              <p className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                SMALL AT FIRST
              </p>
              <ul className="space-y-2 text-sm text-foreground/65 leading-relaxed">
                <li>&ldquo;How do I set this up?&rdquo;</li>
                <li>&ldquo;Where do I find this?&rdquo;</li>
                <li>&ldquo;Why was I charged?&rdquo;</li>
                <li>&ldquo;Can I change this?&rdquo;</li>
                <li>&ldquo;Is this supposed to work this way?&rdquo;</li>
              </ul>
            </div>
            <div className="hidden md:flex h-full items-center justify-center px-2">
              <ArrowRight className="w-5 h-5 text-primary/60" />
            </div>
            <div className="border-t border-border pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0">
              <p className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                THEN YOU PAY FOR IT
              </p>
              <ul className="space-y-2 text-sm text-foreground/65 leading-relaxed">
                <li>One answer becomes ten replies.</li>
                <li>Ten replies become a support habit.</li>
                <li>The inbox keeps filling up.</li>
                <li>Agents spend paid time on preventable replies.</li>
                <li>Customers wait for answers they should be able to find.</li>
              </ul>
            </div>
          </div>
        </div>
        <p>
          You answer one. Then your support person answers another. Then a manager answers the same thing again next week.
        </p>
        <p>
          After a while, everyone knows these questions are expensive, but nobody has time to stop and fix the real problem.
        </p>
        <p>
          Because if the same question keeps showing up, that usually means the answer is not where customers are looking.
        </p>
        <p>
          Maybe the answer is not written yet. Maybe it is buried in an old doc. Maybe it is written in words your team uses, not words your customers use.
        </p>
        <div className="rounded-xl border border-border bg-surface p-5 md:p-6">
          <div className="space-y-5 text-sm text-foreground/65 leading-relaxed">
            <div>
              <p className="text-foreground/45 mb-1">A customer looks for:</p>
              <p className="text-white">&ldquo;how do I cancel my account&rdquo;</p>
              <p className="text-foreground/45 mt-2 mb-1">Your help center says:</p>
              <p className="text-white">&ldquo;account cancellation flow&rdquo;</p>
            </div>
            <div className="border-t border-border pt-5">
              <p className="text-foreground/45 mb-1">A customer looks for:</p>
              <p className="text-white">&ldquo;why was I charged twice?&rdquo;</p>
              <p className="text-foreground/45 mt-2 mb-1">Your help center says:</p>
              <p className="text-white">&ldquo;billing reconciliation&rdquo;</p>
            </div>
            <div className="border-t border-border pt-5">
              <p className="text-foreground/45 mb-1">A customer looks for:</p>
              <p className="text-white">&ldquo;how do I add another person?&rdquo;</p>
              <p className="text-foreground/45 mt-2 mb-1">Your product calls it:</p>
              <p className="text-white">&ldquo;seat management&rdquo;</p>
            </div>
          </div>
        </div>
        <p>
          That kind of mismatch creates support tickets because customers cannot find the answer in the words they actually use.
        </p>
        <p>
          And when customers have to wait for basic answers, they start losing patience.
        </p>
        <p>
          Some email support. Some get annoyed. Some stop using the product. Some cancel and never tell you the real reason.
        </p>
        <p>The frustrating part is that the cost cutter may already be sitting in your old tickets.</p>
        <p>
          Your customers have already told you where they are getting stuck. You just have not turned those repeat questions into answers they can find.
        </p>
      </div>
    ),
  },
  solution: {
    label: 'YOUR SOLUTION',
    title: 'Your customers have already shown you which tickets should stop reaching support.',
    content: (
      <div className="space-y-4 text-foreground/65 leading-relaxed">
        <p>The hard part is that their questions are spread across months of old tickets.</p>
        <p>That is where the Support Ticket Deflection Report comes in.</p>
        <p>
          Upload your last 90 days of support tickets. We group the repeat questions, rank the ones customers ask most, pull out the words customers actually use, and turn the biggest gaps into clear self-service answers.
        </p>
        <p>It works because your tickets show the problem in the customer’s language.</p>
        <p>
          Not your product language. Not your internal labels. Not the words your team uses after they already understand the product.
        </p>
        <p>The words customers use when they are stuck.</p>
        <p>
          That means the answers you publish are easier for customers to recognize, search for, and use before they open another ticket.
        </p>
      </div>
    ),
    processTitle: 'Here’s how the Deflection Report works.',
    processDescription:
      'You do not need to connect a new tool or clean up months of tickets by hand. Upload the CSV, and we turn it into a simple report your team can use to decide which repeat tickets to deflect first.',
    stages: pipelineStages,
  },
  comparison: {
    id: 'comparison',
    label: 'THE WEDGE',
    title: 'The answer can exist and still be invisible.',
    description:
      'Most ticket-deflection problems are not only missing-answer problems. They are language mismatch problems. The Deflection Report compares what customers ask against how your help center names the answer, then drafts the bridge your team can review and publish.',
    artifact: <HelpCenterComparison />,
  },
  sample: {
    id: 'demo',
    label: 'WHAT YOU GET',
    title: 'A real Deflection Report demo, built from a public support-ticket-style dataset.',
    description:
      'This sample uses public CFPB complaint narratives to show the report shape without exposing customer data. Your report uses your uploaded CSV: the questions your customers keep asking, the words they use, and self-service answers your team can review, edit, and publish.',
    artifact: <DeflectionReportSample />,
  },
  deliverables: {
    id: 'what-it-produces',
    label: 'WHAT\'S IN THE REPORT',
    title: 'After you upload, here\'s what comes back.',
    description:
      'You get a clear look at the repeat tickets customers keep opening, the answers they cannot find, and the self-service answers your team can review and publish first.',
    items: reportContents,
    constraintLabel: 'WHAT THIS ISN\'T',
    constraint: (
      <p className="text-sm text-foreground/65 leading-relaxed">
        This is not another tool your team has to set up. It is not a chatbot, and it does not publish anything without you. You get the repeat questions, the missing answers, and the first self-service answers to review. Your team decides what gets edited, approved, and published.
      </p>
    ),
  },
  audience: {
    label: 'WHO THIS IS FOR',
    title: 'For support teams that feel every repeat ticket.',
    description:
      'This fits a 10-50 person company where customers keep asking the same questions, the help center is behind, and every avoidable ticket either costs agent time or slows down the team.',
    items: useCases,
    constraintLabel: 'NOT A FIT FOR',
    constraint: (
      <p className="text-sm text-foreground/65 leading-relaxed">
        This works best when you have enough tickets for repeat questions to show up. It is probably not the right fit yet if support volume is still very low, you cannot export tickets, or you want someone else to run the entire help center for you.
      </p>
    ),
  },
  pricing: {
    id: 'pricing',
    label: 'PRICING',
    title: 'Start with a free snapshot. Pay when you want the full report.',
    description:
      'The free snapshot gives you enough to see whether your old tickets are hiding deflectable support work. If the pattern is there, the full Deflection Report turns that first 90-day batch into answers your team can actually review and publish.',
    tiers: pricingTiers,
    constraintLabel: 'WHAT\'S NOT INCLUDED',
    exclusions: [
      'No help-center integration — your team publishes from the tool you already use.',
      'No auto-publishing — you decide what gets edited, approved, and shipped.',
      'No guaranteed deflection percentage — the report identifies the highest-priority deflection opportunities first.',
    ],
  },
  finalCta: {
    label: 'START HERE',
    title:
      'Send us your last 90 days of support tickets, and we’ll show which repeat questions should stop hitting your inbox',
    body: [
      'Upload your last 90 days of tickets. We turn the repeat questions into self-service answers your team can review and publish.',
      'The questions that keep coming back can slow down when customers can actually find the answer before they open another ticket.',
    ],
    cta: sharedCta,
    privacy: privacyCopy,
  },
  faq: {
    id: 'faq',
    label: 'FAQ',
    title: 'Common questions before you upload the CSV.',
    description:
      'The practical stuff: what the free snapshot includes, what the paid report adds, and what happens with your ticket data.',
    items: pricingFaqs,
  },
  footerCta: {
    cta: sharedCta,
    privacy: privacyCopy,
  },
};

export default function AiContentOpsPage() {
  return <DiagnosticReportLandingPage config={landingPageConfig} />;
}
