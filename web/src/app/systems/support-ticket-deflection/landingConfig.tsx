'use client';

import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  FileText,
  Repeat,
  Search,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';
import { type DiagnosticPricingTier } from '@/components/landing/LandingPrimitives';
import {
  type DiagnosticReportLandingPageConfig,
} from '@/components/landing/DiagnosticReportLandingPage';
import { generateFaqJsonLd } from '@/lib/seo';

// All on-page CTAs route to the focused deflection report intake (CSV upload),
// not the broader /audit form. Kept as a single constant so future renames
// or per-CTA tracking params are one-edit-one-file.
export const GAP_REPORT_INTAKE_HREF = '/systems/support-ticket-deflection/intake';

const pipelineStages = [
  { label: 'Upload your tickets', sub: 'CSV export • 3–6 months • no integration' },
  {
    label: 'We find & draft the answers',
    sub: 'Group repeat questions, rank by volume, draft step-by-step FAQs in your customers’ words',
  },
  { label: 'You review & publish', sub: 'Your team edits and ships — nothing goes live without you' },
];

const reportContents = [
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Repeat questions, ranked',
    desc: 'Every recurring question your customers ask, ranked by how often it hits your inbox and which is worth fixing first.',
  },
  {
    icon: <Search className="w-5 h-5" />,
    title: 'Your customer-word term map',
    desc: 'The exact words customers search vs. the words your docs use — with the wording fix for each. The language findable answers are built from.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Step-by-step drafted answers',
    desc: 'A drafted answer for each: summary, steps, action items, and when to point someone to support. Your team reviews and publishes — nothing goes live without you.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Your findability gaps',
    desc: 'The questions customers searched for and found nothing — the zero-result gaps driving the most avoidable contacts.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Grounded and cited — nothing invented',
    desc: 'Every answer is labeled grounded-in-a-real-resolution or draft-to-review, and cited to the tickets it came from.',
  },
  {
    icon: <Repeat className="w-5 h-5" />,
    title: 'What changed, next time',
    desc: 'Run it again to see which repeat questions still reach the inbox and what your self-service layer should handle next.',
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
      `Your KPI is not “write more FAQs.” It is fewer avoidable tickets. The problem is that the inbox is too busy to stop and sort 3–6 months of tickets by hand.`,
  },
  {
    title: `Small team without a full-time docs person`,
    detail:
      `You have enough customers to need self-service, but not enough people to keep the help center current. You need the first answers written so someone on the team can review, edit, and publish.`,
  },
];

export const pricingTiers: DiagnosticPricingTier[] = [
  {
    id: `snapshot`,
    badge: `FREE · NO CARD`,
    title: `Deflection Snapshot`,
    price: `Free`,
    sla: `Delivered in 24 hours after CSV upload`,
    description:
      `Upload your last 3–6 months of tickets. We send back enough to show you the pattern: the repeat questions, customer wording, and one self-service answer so you can see if the full report is worth doing.`,
    includes: [
      `Your top 5 repeat questions, ranked by how often they were asked`,
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
      `For the first 3–6 month batch. We turn the repeat questions into a full Support Ticket Deflection Report your team can use to decide what to fix and publish first.`,
    includes: [
      `Every recurring question, ranked by how often it was asked (typically 50+)`,
      `Customer wording clusters — the long-tail keywords needed to rank`,
      `A drafted, publishable answer for every gap your tickets already solve — your team's own resolved replies, 100% deterministic, no AI`,
      `A "no proven answer yet" list — the frequent questions you have not cracked`,
      `Priority ranking and source ticket IDs on every finding`,
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

export const pricingFaqs: { q: string; a: string }[] = [
  {
    q: `What do I get in the free snapshot?`,
    a: `You get your top 5 repeat questions ranked by how often they were asked, a few examples of the words customers use, and one sample step-by-step self-service answer. It is enough to show whether your old tickets are worth turning into a full Support Ticket Deflection Report. It is not the full report.`,
  },
  {
    q: `What do I get in the full Deflection Report?`,
    a: `The full report gives you the complete working list: every recurring question ranked by how often it was asked (typically 50+), customer wording clusters, a drafted self-service answer for every gap your tickets already solve, a "no proven answer yet" list for the questions you have not cracked, plus priority ranking and source ticket IDs.`,
  },
  {
    q: `How many tickets should I export?`,
    a: `Three to six months of closed tickets is the sweet spot. A few hundred is enough for the free snapshot to show whether repeat patterns are there; more history lets the full report rank the repeats more confidently. If the export is too thin, we will tell you what would make it useful.`,
  },
  {
    q: `What if my tickets are messy?`,
    a: `Messy is fine. Customers do not ask questions in neat categories. We group tickets by what the customer was trying to do, not by perfect tags or clean labels.`,
  },
  {
    q: `What about private customer data?`,
    a: `If your export tool can remove names, emails, phone numbers, or other private details, do that first — we recommend it; we do not need PII to find your repeat questions. Your file is deleted after 30 days. The analysis is 100% deterministic — no AI, no model training, no fine-tuning, no sharing.`,
  },
  {
    q: `Why use customer wording?`,
    a: `Because customers search for the problem in their own words. If they ask support one way and your help center says it another way, the answer can exist and still be hard to find.`,
  },
  {
    q: `We just updated our help center — do we still need this?`,
    a: `Maybe not, and the free snapshot will tell you. If your tickets show customers still asking things your updated docs already cover, the gap is usually wording: the answer exists, but not in the words customers search. If the snapshot does not find that, we will say so.`,
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
    q: `Do you replace our help desk?`,
    a: `No. The report does not touch your help desk — Zendesk, Intercom, Help Scout, whatever you run — or your live support queue. It works from a CSV export and hands back self-service answers your team publishes in the help center you already use, so fewer repeat questions reach the desk in the first place.`,
  },
  {
    q: `Do we have to sign up for quarterly reports?`,
    a: `No. Start with the free snapshot. If the snapshot is useful, you can pay for the full Deflection Report. Quarterly refreshes are only for teams that want to keep the help center updated as new repeat questions show up.`,
  },
];

const faqJsonLd = generateFaqJsonLd(
  pricingFaqs.map((faq) => ({ question: faq.q, answer: faq.a })),
);

const saasDemoStats = [
  { value: `36`, label: `tickets analyzed` },
  { value: `6`, label: `FAQs generated` },
  { value: `✓`, label: `in their words` },
  { value: `✓`, label: `action items` },
];

const saasDemoQuestions: {
  topic: string;
  question: string;
  ticketCount: string;
  signals?: string;
}[] = [
  {
    topic: `Reporting friction`,
    question: `How do I export attribution reports before our board meeting?`,
    ticketCount: `8 tickets`,
    signals: `blocked access · failed workflow`,
  },
  {
    topic: `Integration setup`,
    question: `Where can I see failed webhook delivery attempts?`,
    ticketCount: `7 tickets`,
    signals: `failed workflow`,
  },
  {
    topic: `Data import`,
    question: `Which CSV columns are required for account imports?`,
    ticketCount: `4 tickets`,
    signals: `failed workflow · incorrect record`,
  },
  {
    topic: `Manual follow-up`,
    question: `How do I send workflow alerts to a different Slack channel?`,
    ticketCount: `5 tickets`,
  },
  {
    topic: `Billing & payments`,
    question: `Where can I download invoices for the annual subscription?`,
    ticketCount: `4 tickets`,
  },
  {
    topic: `Other support issues`,
    question: `How do I let managers edit workflows without full admin access?`,
    ticketCount: `8 tickets`,
  },
];

const saasDemoFaq = {
  question: `How do I export attribution reports before our board meeting?`,
  termMappings: [
    { customer: `export`, doc: `Download report` },
    { customer: `reports`, doc: `Dashboard analytics` },
  ],
  termSuggestion: `add “export” and “reports” to the FAQ heading so customers find it`,
  whenToContactSupport: `if the export is missing, locked by plan or role, or still unavailable after an admin checks permissions`,
  citedCount: 8,
  evidenceQuotes: [
    `How do I export attribution reports before our board meeting?`,
    `Why is the campaign CSV export missing source and owner columns?`,
    `Can I schedule a weekly attribution report export for finance?`,
  ],
};

const heroReportRows: {
  topic: string;
  ticketCount: string;
  question: string;
  signal?: string;
}[] = [
  {
    topic: `Billing`,
    ticketCount: `38 tickets`,
    question: `why was I charged twice?`,
    signal: `“charged twice” → 0 results in your help center`,
  },
  {
    topic: `Team access`,
    ticketCount: `29 tickets`,
    question: `how do I add another person?`,
  },
  {
    topic: `Cancellation`,
    ticketCount: `18 tickets`,
    question: `how do I cancel my account?`,
  },
];

const termMappings = [
  {
    customerTerm: `export`,
    docTerm: `Download report`,
    zeroResults: `6 searches → 0 results`,
    suggestion: `add “export” as alternate phrasing in the FAQ heading`,
  },
  {
    customerTerm: `add another person`,
    docTerm: `Seat management`,
    zeroResults: `4 searches → 0 results`,
    suggestion: `lead the heading with “add a teammate”`,
  },
  {
    customerTerm: `charged twice`,
    docTerm: `Billing reconciliation`,
    zeroResults: `9 searches → 0 results`,
    suggestion: `title the FAQ “why was I charged twice?”`,
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
            [`3–6 months`, `ticket window`],
            [`412 tickets`, `analyzed`],
            [`✓ Their words`, `not your jargon`],
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
              <div key={row.topic} className="rounded-md bg-[var(--artifact-paper)] px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--artifact-paper-text)]">
                    {String(index + 1).padStart(2, '0')} · {row.topic}
                  </p>
                  <p className="shrink-0 text-[11px] font-mono text-[var(--artifact-success-muted)]">{row.ticketCount}</p>
                </div>
                <p className="mt-1 text-xs text-[var(--artifact-paper-muted)]">&ldquo;{row.question}&rdquo;</p>
                {row.signal && (
                  <p className="mt-1 text-[11px] text-[var(--artifact-danger)]">⚠ {row.signal}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeflectionDraftedAnswer() {
  return (
    <div className="glass overflow-hidden rounded-xl border border-border">
      <div className="border-b border-border bg-surface px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-foreground">
            Billing · <span className="text-foreground/55">38 tickets</span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-primary">
              Priority · High
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground/55">
              in customers’ words
            </span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground/55">
              draft · needs review
            </span>
          </div>
        </div>
        <p className="mt-1 text-[11px] font-mono text-foreground/45">↑ flagged: zero-result search</p>
        <h3 className="mt-3 text-lg font-semibold text-foreground">
          &ldquo;Why do I see two charges after changing my plan?&rdquo;
        </h3>
      </div>

      <div className="space-y-6 p-5 md:p-6">
        <div>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">Summary</p>
          <p className="text-sm leading-relaxed text-foreground/70">
            Customers report a second charge after a mid-cycle plan change and aren’t sure whether they were double-billed.
          </p>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">Steps</p>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/70">
            <li>Check the invoice date on your billing page.</li>
            <li>A mid-cycle plan change creates a prorated charge alongside the renewal.</li>
            <li>If both posted, send support the two invoice IDs to confirm the adjustment.</li>
          </ol>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">Action items</p>
          <ul className="space-y-1.5 text-sm leading-relaxed text-foreground/70">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-foreground/30">&#9744;</span> Confirm the proration math against the plan-change date.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-foreground/30">&#9744;</span> Link this answer from the billing FAQ.
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">When to contact support</p>
          <p className="text-sm leading-relaxed text-foreground/70">
            If the charge is still unexplained after checking the invoice, reply with both invoice IDs and we’ll confirm the adjustment.
          </p>
        </div>
        <div className="border-t border-border pt-4">
          <p className="text-xs text-foreground/55">
            Drafted from <span className="font-medium text-foreground/80">4 cited tickets</span> · you approve &amp; publish — nothing goes live without you.
          </p>
          <p className="mt-2 text-[11px] font-mono leading-relaxed text-foreground/40">
            &ldquo;charged me twice after I upgraded&rdquo; · &ldquo;two charges, same day&rdquo; · &ldquo;did I get double billed?&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

function TermMap() {
  return (
    <div className="glass overflow-hidden rounded-xl border border-border">
      <div className="divide-y divide-border">
        {termMappings.map((m) => (
          <div key={m.customerTerm} className="px-5 py-4 md:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <p className="text-sm font-medium text-foreground">
                A customer searches &ldquo;{m.customerTerm}&rdquo;
              </p>
              <p className="whitespace-nowrap text-[11px] font-mono text-[var(--artifact-danger)]">
                {m.zeroResults}
              </p>
            </div>
            <p className="mt-1 text-xs text-foreground/55">
              your help center files it under{' '}
              <span className="text-foreground/75">&ldquo;{m.docTerm}&rdquo;</span>
            </p>
            <p className="mt-2 text-xs leading-relaxed text-foreground/70">
              <span className="text-primary/80">↳ fix:</span> {m.suggestion}
            </p>
          </div>
        ))}
      </div>
      <div className="border-t border-border bg-surface px-5 py-3 text-xs leading-relaxed text-foreground/55 md:px-6">
        The fix is wording, not new docs — these are the words your customers already search, and the words your help center should answer in.
      </div>
    </div>
  );
}

function DeflectionReportSample() {
  return (
    <div className="glass rounded-xl border border-border overflow-hidden">
      <div className="border-b border-border px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-surface">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-primary/80" />
          <span className="text-sm font-medium text-foreground">Support Ticket Deflection Report</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            · Live Demo / B2B SaaS sample
          </span>
        </div>
        <Link
          href="/systems/support-ticket-deflection/demo"
          className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
        >
          Try it live
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {saasDemoStats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-surface px-3 py-3">
              <p className="text-lg font-semibold text-foreground">{stat.value}</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <p className="text-sm text-foreground/65 leading-relaxed">
          Real output from the Atlas FAQ generator on a representative labeled-synthetic B2B SaaS support set — no customer tickets shown. Your report runs on your own uploaded CSV.
        </p>

        {/* Ranked list */}
        <div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            REPEAT QUESTIONS FOUND — RANKED
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            {saasDemoQuestions.map((row, i) => (
              <div
                key={row.question}
                className={`px-4 py-3 ${
                  i < saasDemoQuestions.length - 1 ? 'border-b border-border' : ''
                } bg-surface`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-foreground/40 w-5 shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p className="text-sm text-foreground font-medium">{row.topic}</p>
                  </div>
                  <span className="shrink-0 text-xs font-mono text-foreground/55">{row.ticketCount}</span>
                </div>
                <p className="mt-1 pl-8 text-xs text-foreground/55 leading-snug">&ldquo;{row.question}&rdquo;</p>
                {row.signals && (
                  <p className="mt-1 pl-8 text-[11px] text-[var(--artifact-danger)]">⚠ {row.signals}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* One expanded FAQ */}
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-primary/80 tracking-widest">ONE FAQ, EXPANDED</span>
            <span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground/55">
              draft · needs your review
            </span>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5 space-y-4">
            <p className="text-sm font-semibold text-foreground">&ldquo;{saasDemoFaq.question}&rdquo;</p>
            <div>
              <p className="text-[11px] font-mono text-foreground/45 tracking-widest mb-2">TERM MAP</p>
              <ul className="space-y-1 text-sm text-foreground/70">
                {saasDemoFaq.termMappings.map((m) => (
                  <li key={m.customer}>
                    customers say &ldquo;{m.customer}&rdquo; · your docs say &ldquo;{m.doc}&rdquo;
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-foreground/65">↳ fix: {saasDemoFaq.termSuggestion}</p>
            </div>
            <p className="text-sm text-foreground/65 leading-relaxed">
              <span className="text-foreground font-medium">When to contact support: </span>
              {saasDemoFaq.whenToContactSupport}.
            </p>
            <div className="border-t border-border pt-3">
              <p className="text-[11px] font-mono text-foreground/45 mb-2">
                Cited from {saasDemoFaq.citedCount} tickets:
              </p>
              <ul className="space-y-1 text-xs text-foreground/55 leading-relaxed">
                {saasDemoFaq.evidenceQuotes.map((q) => (
                  <li key={q}>&ldquo;{q}&rdquo;</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <p className="text-xs text-foreground/45 leading-relaxed border-t border-border pt-4">
          A compact excerpt of a real generator run on a labeled-synthetic B2B SaaS support set. Answers come back as drafts your team reviews and publishes — nothing goes live without you. Your report runs on your own uploaded CSV.
        </p>
      </div>
    </div>
  );
}

const sharedCta = {
  label: 'Upload your export — free',
  href: GAP_REPORT_INTAKE_HREF,
};

const privacyCopy =
  'Privacy: we delete your CSV after 30 days. No model training, no third-party sharing, no fine-tuning.';

export const landingPageConfig: DiagnosticReportLandingPageConfig = {
  structuredData: faqJsonLd,
  hero: {
    eyebrow: 'SUPPORT TICKET DEFLECTION',
    eyebrowIcon: <Workflow className="w-3 h-3" />,
    title:
      'Turn 3–6 months of messy support tickets into a clean help-center fix list.',
    intro:
      'Upload your closed tickets. We hand back the repeat questions — in your customers’ words — ranked, with drafted, cited answers your team reviews and publishes. The first analysis is free.',
    body:
      'Right now those answers are buried across months of tickets — too much to sort by hand. We turn the mess into a clean, prioritized list: the questions customers keep asking in their own words, the wording gaps where your help center comes up empty, and a drafted, cited answer for each — yours to review and publish. No integration, no new platform, no data project.',
    cta: {
      label: 'Upload your tickets — get a free Deflection Snapshot',
      href: GAP_REPORT_INTAKE_HREF,
    },
    artifact: <DeflectionReportHeroArtifact />,
  },
  featuredAnswer: {
    id: 'drafted-answer',
    label: 'A DRAFTED ANSWER',
    title: 'Every repeat question comes back as a drafted answer your team reviews.',
    description:
      'Grounded in your own tickets, in your customers’ words — with the steps, the action items, and exactly when to point someone to support. You approve and publish; nothing goes live without you.',
    artifact: <DeflectionDraftedAnswer />,
  },
  problem: {
    label: 'YOUR PROBLEM',
    title: 'Repeat tickets aren’t a missing-answer problem — they’re a wording problem.',
    content: (
      <div className="space-y-4 text-foreground/65 leading-relaxed">
        <p>
          Customers who can’t find an answer don’t always complain — sometimes they just leave. That’s what makes a repeat question expensive: it’s never one ticket, it’s the same one, over and over.
        </p>
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
          Everyone knows these are expensive. Nobody has time to stop, dig through months of tickets, and fix the real cause — which is almost always this: the answer exists, but not in the words your customers search for.
        </p>
        <div className="rounded-xl border border-border bg-surface p-5 md:p-6">
          <div className="space-y-5 text-sm text-foreground/65 leading-relaxed">
            <div>
              <p className="text-foreground/45 mb-1">A customer looks for:</p>
              <p className="text-foreground">&ldquo;how do I cancel my account&rdquo;</p>
              <p className="text-foreground/45 mt-2 mb-1">Your help center says:</p>
              <p className="text-foreground">&ldquo;account cancellation flow&rdquo;</p>
            </div>
            <div className="border-t border-border pt-5">
              <p className="text-foreground/45 mb-1">A customer looks for:</p>
              <p className="text-foreground">&ldquo;why was I charged twice?&rdquo;</p>
              <p className="text-foreground/45 mt-2 mb-1">Your help center says:</p>
              <p className="text-foreground">&ldquo;billing reconciliation&rdquo;</p>
            </div>
            <div className="border-t border-border pt-5">
              <p className="text-foreground/45 mb-1">A customer looks for:</p>
              <p className="text-foreground">&ldquo;how do I add another person?&rdquo;</p>
              <p className="text-foreground/45 mt-2 mb-1">Your product calls it:</p>
              <p className="text-foreground">&ldquo;seat management&rdquo;</p>
            </div>
          </div>
        </div>
        <p>
          So they open a ticket — or worse, they don’t: they get annoyed, give up, and a few quietly cancel. Your customers have already told you exactly where they get stuck; you just haven’t turned those repeat questions into answers they can find.
        </p>
      </div>
    ),
  },
  solution: {
    label: 'YOUR SOLUTION',
    title: 'The fix is already in your tickets — you just can’t see it yet.',
    content: (
      <div className="space-y-4 text-foreground/65 leading-relaxed">
        <p>
          Those answers are buried across months of tickets, too much to read by hand. Upload 3–6 months of closed tickets and we pull the pattern out: the repeat questions ranked by volume, the exact words customers use when they’re stuck (not your internal labels), and a drafted answer for each.
        </p>
        <p>
          Because each answer is written in the words customers actually search, they find it on their own — and stop opening the ticket.
        </p>
      </div>
    ),
    processTitle: 'Here’s how it works — three steps.',
    processDescription:
      'No new tool to connect, no months of tickets to sort by hand. Upload the CSV; we turn it into ranked repeat questions and step-by-step FAQ drafts your team reviews and publishes.',
    stages: pipelineStages,
  },
  comparison: {
    id: 'comparison',
    label: 'YOUR TERM MAP',
    title: 'The answer can exist and still be invisible.',
    description:
      'Repeat tickets usually aren’t missing-answer problems — they’re wording problems. The report hands you the term map: the exact words customers search, the words your help center uses instead, and the wording fix. We don’t promise rankings — but these are the words findable answers are built from.',
    artifact: <TermMap />,
  },
  sample: {
    id: 'demo',
    label: 'WHAT YOU GET',
    title: 'A real Deflection Report demo, built from a B2B SaaS support set.',
    description:
      'Real output from the Atlas FAQ generator on a representative labeled-synthetic B2B SaaS support set — no customer tickets shown. Your report uses your uploaded CSV: the questions your customers keep asking, the words they use, and drafted answers your team reviews and publishes.',
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
      'This fits best at a 15–75-person B2B SaaS team: big enough that the same questions repeat across months of tickets, small enough that every avoidable ticket still costs real agent time. If you can export 3–6 months of tickets and already run a help center, you have what the report needs.',
    items: useCases,
    constraintLabel: 'NOT A FIT FOR',
    constraint: (
      <p className="text-sm text-foreground/65 leading-relaxed">
        Probably not a fit if you’re enterprise (a one-time report like this sits below procurement), a pure high-volume consumer (B2C) app, or pre-product with no months of tickets to export yet — or if you want someone to run the whole help center for you rather than answers your team publishes.
      </p>
    ),
  },
  pricing: {
    id: 'pricing',
    label: 'PRICING',
    title: 'Start with a free snapshot. Pay when you want the full report.',
    description:
      'The free snapshot gives you enough to see whether your old tickets are hiding deflectable support work. If the pattern is there, the full Deflection Report turns that first 3–6 month batch into answers your team can actually review and publish.',
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
    title: 'See which repeat questions should stop hitting your inbox.',
    body: [
      'Upload 3–6 months of closed tickets. Your free Deflection Snapshot comes back within 24 hours — no integration required.',
      'Your team reviews and publishes every answer — nothing goes live without you.',
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
