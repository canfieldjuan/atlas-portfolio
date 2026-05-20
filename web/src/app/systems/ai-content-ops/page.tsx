'use client';

import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calculator,
  CheckCircle2,
  Clock,
  FileText,
  HelpCircle,
  Repeat,
  Workflow,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { generateFaqJsonLd } from '@/lib/seo';

// All on-page CTAs route to the focused FAQ Report intake (CSV upload),
// not the broader /audit form. Kept as a single constant so future renames
// or per-CTA tracking params are one-edit-one-file.
const GAP_REPORT_INTAKE_HREF = '/systems/ai-content-ops/intake';

const pipelineStages = [
  { label: 'Support Tickets', sub: 'CSV • Last 90 days' },
  { label: 'Cluster by Intent' },
  { label: 'Rank by Volume' },
  { label: 'Extract Customer Wording' },
  { label: 'Generate FAQ Entries' },
  { label: 'Review & Publish', sub: 'You approve, edit, ship' },
];

const reportContents = [
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Questions Ranked by Volume',
    desc: 'The questions customers keep asking, sorted by how often they show up. That way you can see which answers should get fixed first.',
  },
  {
    icon: <AlertTriangle className="w-5 h-5" />,
    title: 'Missing or Hard-to-Find Answers',
    desc: 'The repeat questions that do not have a clear answer yet, or where the answer exists but customers still cannot find it.',
  },
  {
    icon: <Clock className="w-5 h-5" />,
    title: 'Customer Wording',
    desc: 'The words customers actually use when they are stuck. This matters because customers search in their own language, not your internal labels.',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'FAQ Entries to Review',
    desc: 'Plain-spoken help-center answers for the repeat questions your team should handle first. Review, edit, and publish.',
  },
  {
    icon: <Calculator className="w-5 h-5" />,
    title: 'Why This Answer Matters',
    desc: 'Short notes that explain why the answer is worth fixing now, based on repeat volume and the confusion showing up in the tickets.',
  },
  {
    icon: <Repeat className="w-5 h-5" />,
    title: 'What Changed Next Time',
    desc: 'If you run it again, the next report shows which questions are still coming back, what changed, and what your help center should handle next.',
  },
];

const useCases = [
  {
    title: `Founder or owner still close to support`,
    detail:
      `You still see the customer emails, Slack pings, and support replies because the team is small. You know the same questions keep coming back, but no one has had time to turn them into answers customers can find.`,
  },
  {
    title: `Support lead answering the same questions`,
    detail:
      `You can feel the repeat work every week. The problem is that the inbox is too busy to stop and sort 90 days of tickets by hand. You need a short list of what customers keep asking and which answers should get fixed first.`,
  },
  {
    title: `Small team without a full-time docs person`,
    detail:
      `You have enough customers to need better help docs, but not enough people to keep the help center current. You need the first answers written so someone on the team can review, edit, and publish.`,
  },
];

type PricingTier = {
  id: string;
  badge?: string;
  title: string;
  price: string;
  priceDetail?: string;
  sla?: string;
  description: string;
  includes: string[];
  note: string;
  cta: string;
  href: string;
  highlighted?: boolean;
};

const pricingTiers: PricingTier[] = [
  {
    id: `snapshot`,
    badge: `FIRST 5 DESIGN PARTNERS`,
    title: `FAQ Snapshot`,
    price: `Free`,
    sla: `Delivered in 24 hours after CSV upload`,
    description:
      `Upload your last 90 days of tickets. We send back enough to show you the pattern: the repeat questions, customer wording, and one FAQ entry so you can see if the full report is worth doing.`,
    includes: [
      `Top 5-10 repeat questions`,
      `Customer wording examples`,
      `1 sample FAQ entry`,
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
    title: `Full FAQ Report`,
    price: `$1,500`,
    description:
      `For the first 90-day batch. We turn the repeat questions into a full FAQ Report your team can use to decide what to fix and publish first.`,
    includes: [
      `Top 25-50 repeat questions`,
      `Customer wording clusters`,
      `Missing or hard-to-find answer list`,
      `3-5 FAQ entries to review and publish`,
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
      `Full FAQ Report every 90 days`,
      `What changed since the last report`,
      `Questions that are still coming back`,
      `New FAQ entries to review and publish`,
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
    a: `You get the top repeat questions we can see, a few examples of the words customers use, and one sample FAQ entry. It is enough to show whether your old tickets are worth turning into a full FAQ Report. It is not the full report.`,
  },
  {
    q: `What do I get in the full FAQ Report?`,
    a: `The full report gives you the bigger working list: 25-50 repeat questions, customer wording clusters, missing or hard-to-find answers, 3-5 FAQ entries, priority notes, and source ticket IDs.`,
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
    q: `How much editing will the FAQ entries need?`,
    a: `Plan on light editing. Most teams adjust tone, add a product link, confirm the exact steps, and publish. The point is that you are not starting from a blank page.`,
  },
  {
    q: `What if we do not have enough tickets?`,
    a: `Then we will tell you. The report works best when repeat questions show up clearly. If the export is too thin to be useful, we will not pretend there is a pattern that is not there.`,
  },
  {
    q: `Do we have to sign up for quarterly reports?`,
    a: `No. Start with the free snapshot. If the snapshot is useful, you can pay for the full FAQ Report. Quarterly refreshes are only for teams that want to keep the help center updated as new repeat questions show up.`,
  },
];

const faqJsonLd = generateFaqJsonLd(
  pricingFaqs.map((faq) => ({ question: faq.q, answer: faq.a })),
);

const sampleRankedQuestions: {
  question: string;
  count: number;
  hasDoc: boolean;
  docNote?: string;
}[] = [
  { question: `How do I reset my password?`, count: 247, hasDoc: false },
  { question: `Can I downgrade my plan?`, count: 198, hasDoc: false },
  {
    question: `Why am I getting permission errors?`,
    count: 156,
    hasDoc: true,
    docNote: `Last updated 2024`,
  },
  { question: `Where do I find my API keys?`, count: 142, hasDoc: false },
  {
    question: `How do I export my data?`,
    count: 121,
    hasDoc: true,
    docNote: `Last updated 2023`,
  },
  { question: `What does the audit log show?`, count: 98, hasDoc: false },
  { question: `How do I add a team member?`, count: 84, hasDoc: false },
  { question: `Why did my integration break?`, count: 73, hasDoc: false },
];

const sampleFaqExamples = [
  {
    question: `How do I reset my password?`,
    answer:
      `If you have forgotten your password, click Forgot password on the login screen. We will send a reset link to the email on your account. The link expires in 30 minutes. If you do not see it, check spam and make sure you are looking at the inbox tied to your account, not the billing address.`,
    sources: [`#4521`, `#4782`, `#5103`, `#5247`, `#5390`],
  },
  {
    question: `Can I downgrade my plan?`,
    answer:
      `Yes. Go to Billing, choose Manage plan, and select the plan you want to move to. The change starts on your next billing cycle. If you do not see the downgrade option, your account may have an open invoice or a feature that only exists on your current plan.`,
    sources: [`#4618`, `#4874`, `#4933`, `#5188`],
  },
  {
    question: `Where do I find my API keys?`,
    answer:
      `Open Settings, then choose API keys. Admins can create, copy, or revoke keys from that page. If you cannot see API keys, ask an admin to check your role because some accounts hide developer settings from non-admin users.`,
    sources: [`#4699`, `#5012`, `#5220`, `#5411`],
  },
];

function FAQReportSample() {
  const undocumented = sampleRankedQuestions.filter((row) => !row.hasDoc).length;

  return (
    <div className="glass rounded-xl border border-white/10 overflow-hidden">
      <div className="border-b border-white/10 px-6 py-4 flex flex-wrap items-center justify-between gap-3 bg-black/20">
        <div className="flex items-center gap-2">
          <Workflow className="w-4 h-4 text-primary/80" />
          <span className="text-sm font-medium text-white">The FAQ Report</span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-foreground/40">
            · Sample / Mock
          </span>
        </div>
        <div className="text-[11px] font-mono text-foreground/45">
          Range: last 90 days · 12,400 tickets ingested
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Headline number */}
        <div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-2">
            HEADLINE FINDING
          </div>
          <p className="text-base text-foreground/75 leading-relaxed">
            <span className="text-white font-medium">{undocumented} of your top 10 repeat questions</span>{' '}
            do not have a clear answer customers can find. Turning those into FAQs could save an estimated{' '}
            <span className="text-white font-medium">~38 hours of support time / month</span>.
          </p>
        </div>

        {/* Ranked list */}
        <div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            REPEAT CUSTOMER QUESTIONS — RANKED BY VOLUME
          </div>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            {sampleRankedQuestions.map((row, i) => (
              <div
                key={row.question}
                className={`flex items-center justify-between gap-4 px-4 py-3 ${
                  i < sampleRankedQuestions.length - 1 ? 'border-b border-white/5' : ''
                } ${!row.hasDoc ? 'bg-white/[0.015]' : ''}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-mono text-foreground/40 w-5 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm text-foreground/80 truncate">
                    &ldquo;{row.question}&rdquo;
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-mono text-foreground/55 hidden sm:inline">
                    {row.count} tickets
                  </span>
                  {row.hasDoc ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-foreground/45">
                      <CheckCircle2 className="w-3.5 h-3.5 text-foreground/40" />
                      <span className="hidden sm:inline">Answer exists</span>
                      <span className="sm:hidden">Doc</span>
                      {row.docNote && (
                        <span className="text-foreground/35 hidden md:inline">
                          · {row.docNote}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-primary/90">
                      <X className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">No answer</span>
                      <span className="sm:hidden">No answer</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sample FAQs */}
        <div>
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            SAMPLE FAQ ENTRIES — 3 OUTPUT EXAMPLES
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 overflow-hidden">
            {sampleFaqExamples.map((example, exampleIndex) => (
              <div
                key={example.question}
                className={`p-5 ${exampleIndex > 0 ? 'border-t border-white/10' : ''}`}
              >
                <p className="text-sm font-medium text-white mb-2">
                  Q: {example.question}
                </p>
                <p className="text-sm text-foreground/70 leading-relaxed mb-4">
                  {example.answer}
                </p>
                <p className="text-[11px] font-mono text-foreground/45">
                  Sources:{' '}
                  {example.sources.map((id, i) => (
                    <span key={id}>
                      {i > 0 && <span className="text-foreground/30"> · </span>}
                      <span className="text-foreground/55">Ticket {id}</span>
                    </span>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-foreground/45 leading-relaxed border-t border-white/5 pt-4">
          Mock data shown. Your version is built from your actual tickets — same
          structure, your repeat questions, your customer wording, your source IDs.
        </p>
      </div>
    </div>
  );
}

export default function AiContentOpsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <style>{`
        .faq-report-light {
          --background: #f4f7f2;
          --foreground: #17231f;
          --color-background: #f4f7f2;
          --color-foreground: #17231f;
          --color-primary: #3c6f8f;
          background:
            radial-gradient(circle at top left, rgba(60, 111, 143, 0.14), transparent 34rem),
            linear-gradient(180deg, #fbfcf8 0%, #f2f6ef 52%, #edf3ea 100%);
          color: var(--foreground);
        }

        .faq-report-light .glass,
        .faq-report-light [class*="bg-black/"],
        .faq-report-light [class*="bg-white/["] {
          background: rgba(255, 255, 255, 0.72) !important;
          box-shadow: 0 18px 50px rgba(31, 45, 39, 0.08);
        }

        .faq-report-light [class*="border-white/"],
        .faq-report-light [class*="border-primary/20"],
        .faq-report-light [class*="border-primary/30"] {
          border-color: rgba(23, 35, 31, 0.12) !important;
        }

        .faq-report-light .text-white {
          color: #11231f !important;
        }

        .faq-report-light .text-black {
          color: #041310 !important;
        }

        .faq-report-light [class*="text-foreground/"] {
          color: rgba(23, 35, 31, 0.68) !important;
        }

        .faq-report-light [class*="text-primary/"],
        .faq-report-light .text-primary {
          color: #315f7b !important;
        }

        .faq-report-light [class*="bg-primary/"] {
          background-color: rgba(60, 111, 143, 0.1) !important;
        }

        .faq-report-light .bg-primary {
          background-color: #3c6f8f !important;
        }

        .faq-report-light .bg-primary.text-black,
        .faq-report-light .bg-primary .text-black {
          color: #ffffff !important;
        }

        .faq-report-light .section-band {
          margin-left: calc(50% - 50vw);
          margin-right: calc(50% - 50vw);
          padding-left: max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem));
          padding-right: max(1.5rem, calc((100vw - 72rem) / 2 + 1.5rem));
          padding-top: 6rem;
          padding-bottom: 6rem;
        }

        .faq-report-light .section-band-muted {
          background: rgba(255, 255, 255, 0.42);
        }

        .faq-report-light .section-band-blue {
          background: rgba(60, 111, 143, 0.055);
        }

        @media (min-width: 768px) {
          .faq-report-light .section-band {
            padding-top: 8rem;
            padding-bottom: 8rem;
          }
        }
      `}</style>
      <main className="faq-report-light min-h-screen pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">

        {/* Hero */}
        <section className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-3">
              <Workflow className="w-3 h-3" />
              <span>THE FAQ REPORT</span>
            </div>
            <p className="text-sm text-foreground/50 mb-6">
              Built from the support questions your customers already asked.
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
              In 24 hours, we’ll turn the support questions customers keep asking into clear help-center answers they can actually use.
            </h1>
            <p className="text-lg text-foreground/65 leading-relaxed mb-5">
              Stop making your small team answer the same questions one ticket at a time.
            </p>
            <p className="text-base text-foreground/65 leading-relaxed mb-5">
              Upload a CSV of your last 90 days of support tickets. We’ll group the repeat questions, show you which ones come up most, pull out the words customers actually use, and turn the biggest gaps into help-center answers your team can review and publish. No integration. No extra data project. Just the answers your customers keep needing.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={GAP_REPORT_INTAKE_HREF}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
              >
                Upload your CSV — free FAQ Snapshot
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Problem */}
        <section className="section-band section-band-muted mt-32">
          <div className="max-w-4xl">
          <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
            YOUR PROBLEM
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-6">
            Support problems don&apos;t stay support problems. They become cancellations.
          </h2>
          <div className="space-y-4 text-foreground/65 leading-relaxed">
            <p>
              When customers can’t find answers, they don’t always complain. Sometimes they just leave.
            </p>
            <p>
              That is what makes repeat support questions dangerous.
            </p>
            <p>
              At first, they look small:
            </p>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
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
                <div className="border-t border-white/10 pt-5 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                  <p className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                    THEN IT BUILDS
                  </p>
                  <ul className="space-y-2 text-sm text-foreground/65 leading-relaxed">
                    <li>One answer becomes ten replies.</li>
                    <li>Ten replies become a support habit.</li>
                    <li>The help center stays behind.</li>
                    <li>Customers wait for answers they should be able to find.</li>
                    <li>Some stop asking.</li>
                  </ul>
                </div>
              </div>
            </div>
            <p>
              You answer one. Then your support person answers another. Then a manager answers the same thing again next week.
            </p>
            <p>
              After a while, everyone knows these questions are annoying, but nobody has time to stop and fix the real problem.
            </p>
            <p>
              Because if the same question keeps showing up, that usually means the answer is not where customers are looking.
            </p>
            <p>
              Maybe the answer is not written yet. Maybe it is buried in an old doc. Maybe it is written in words your team uses, not words your customers use.
            </p>
            <div className="rounded-xl border border-white/10 bg-black/20 p-5 md:p-6">
              <div className="space-y-5 text-sm text-foreground/65 leading-relaxed">
                <div>
                  <p className="text-foreground/45 mb-1">A customer looks for:</p>
                  <p className="text-white">&ldquo;how do I cancel my account&rdquo;</p>
                  <p className="text-foreground/45 mt-2 mb-1">Your help center says:</p>
                  <p className="text-white">&ldquo;account cancellation flow&rdquo;</p>
                </div>
                <div className="border-t border-white/10 pt-5">
                  <p className="text-foreground/45 mb-1">A customer looks for:</p>
                  <p className="text-white">&ldquo;why was I charged twice?&rdquo;</p>
                  <p className="text-foreground/45 mt-2 mb-1">Your help center says:</p>
                  <p className="text-white">&ldquo;billing reconciliation&rdquo;</p>
                </div>
                <div className="border-t border-white/10 pt-5">
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
            <p>
              The frustrating part is that the fix may already be sitting in your old tickets.
            </p>
            <p>
              Your customers have already told you where they are getting stuck. You just have not turned those repeat questions into answers they can find.
            </p>
          </div>
          </div>
        </section>

        {/* Solution */}
        <section className="section-band">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              YOUR SOLUTION
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-6">
              Your customers have already shown you what needs to be answered.
            </h2>
            <div className="space-y-4 text-foreground/65 leading-relaxed">
              <p>
                The hard part is that their questions are spread across months of old tickets.
              </p>
              <p>
                That is where the FAQ Report comes in.
              </p>
              <p>
                Upload your last 90 days of support tickets. We group the repeat questions, rank the ones customers ask most, pull out the words customers actually use, and turn the biggest gaps into clear help-center answers.
              </p>
              <p>
                It works because your tickets show the problem in the customer’s language.
              </p>
              <p>
                Not your product language. Not your internal labels. Not the words your team uses after they already understand the product.
              </p>
              <p>
                The words customers use when they are stuck.
              </p>
              <p>
                That means the answers you publish are easier for customers to recognize, search for, and use.
              </p>
            </div>
          </div>

          <div className="max-w-3xl mb-6">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-white mb-3">
              Here’s how the FAQ Report works.
            </h3>
            <p className="text-foreground/65 leading-relaxed">
              You do not need to connect a new tool or clean up months of tickets by hand. Upload the CSV, and we turn it into a simple report your team can use to decide which answers to publish first.
            </p>
          </div>

          <div className="glass rounded-xl border border-white/10 p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
              {pipelineStages.map((stage, index) => (
                <div key={stage.label} className="relative">
                  <div className="rounded-lg border border-white/10 bg-black/30 p-4 h-full">
                    <div className="text-[10px] font-mono text-primary/70 mb-2">
                      STEP {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="text-sm font-medium text-white leading-snug">{stage.label}</div>
                    {stage.sub && (
                      <div className="text-[11px] text-foreground/45 mt-1 font-mono">{stage.sub}</div>
                    )}
                  </div>
                  {index < pipelineStages.length - 1 && (
                    <div className="hidden md:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-3.5 h-3.5 text-primary/60" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Demo / Sample report */}
        <section id="demo" className="section-band section-band-blue scroll-mt-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-start">
          <div className="max-w-3xl lg:sticky lg:top-24">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              WHAT YOU GET
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              A FAQ Report built from your last 90 days of support tickets.
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              The report shows the questions customers keep asking, which answers are missing or hard to find, and the exact words customers use when they get stuck. It also includes FAQ entries your team can review, edit, and publish, so you are not starting from a blank page or guessing which help-center answer to fix first.
            </p>
          </div>
          <FAQReportSample />
          </div>
        </section>

        {/* What's in the report */}
        <section id="what-it-produces" className="section-band scroll-mt-24">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              WHAT&apos;S IN THE REPORT
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              After you upload, here&apos;s what comes back.
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              You get a clear look at the questions customers keep asking, the answers they cannot find, and the FAQ entries your team can review and publish first.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportContents.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="glass rounded-xl border border-white/10 p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-6 max-w-3xl">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              WHAT THIS ISN&apos;T
            </div>
            <p className="text-sm text-foreground/65 leading-relaxed">
              This is not another tool your team has to set up. It is not a chatbot, and it does not publish anything without you. You get the repeat questions, the missing answers, and the first FAQ entries to review. Your team decides what gets edited, approved, and published.
            </p>
          </div>
        </section>

        {/* Best-fit customers */}
        <section className="section-band section-band-muted">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              WHO THIS IS FOR
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              For small teams that feel every repeat ticket.
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              This fits a 10-50 person company where customers keep asking the same questions, the help center is behind, and the people closest to the business still feel the support load.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((useCase, i) => (
              <motion.div
                key={useCase.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className="glass rounded-xl border border-white/10 p-6"
              >
                <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-3">
                  GOOD FIT 0{i + 1}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{useCase.title}</h3>
                <p className="text-sm text-foreground/60 leading-relaxed">{useCase.detail}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-6 max-w-3xl">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              NOT A FIT FOR
            </div>
            <p className="text-sm text-foreground/65 leading-relaxed">
              This works best when you have enough tickets for repeat questions to show up. It is probably not the right fit yet if support volume is still very low, you cannot export tickets, or you want someone else to run the entire help center for you.
            </p>
          </div>
        </section>

        {/* Pricing / Engagement Path */}
        <section id="pricing" className="section-band scroll-mt-24">
          <div className="max-w-3xl mb-12">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              PRICING
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              Start with a free snapshot. Pay when you want the full report.
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              The free snapshot gives you enough to see whether your old tickets are hiding useful FAQ work. If the pattern is there, the full FAQ Report turns that first 90-day batch into answers your team can actually review and publish.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
                className={`relative rounded-xl p-6 md:p-7 flex flex-col ${
                  tier.highlighted
                    ? 'border border-primary/30 bg-primary/[0.04] shadow-[0_0_40px_rgba(0,255,204,0.04)]'
                    : 'glass border border-white/10'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-black text-[10px] font-mono tracking-widest font-semibold whitespace-nowrap">
                    {tier.badge}
                  </div>
                )}
                <h3 className="text-lg font-semibold text-white mb-3">{tier.title}</h3>
                <div className="mb-1 flex items-baseline gap-2 flex-wrap">
                  <span className="text-3xl font-bold text-white">{tier.price}</span>
                  {tier.priceDetail && (
                    <span className="text-sm text-foreground/50">{tier.priceDetail}</span>
                  )}
                </div>
                {tier.sla && (
                  <p className="text-xs text-primary/80 font-mono mb-4">{tier.sla}</p>
                )}
                <p className={`text-sm text-foreground/65 leading-relaxed mb-5 ${tier.sla ? '' : 'mt-3'}`}>
                  {tier.description}
                </p>

                <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-3">
                  INCLUDES
                </div>
                <ul className="space-y-2 mb-5">
                  {tier.includes.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-sm text-foreground/70 leading-snug"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-foreground/45 leading-relaxed mb-5 italic flex-1">
                  {tier.note}
                </p>

                <Link
                  href={tier.href}
                  className={`group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium transition-colors text-sm ${
                    tier.highlighted
                      ? 'bg-primary text-black hover:bg-primary/90'
                      : 'border border-white/10 text-white hover:bg-white/5'
                  }`}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            ))}
          </div>

          {/* What's not included */}
          <div className="mt-8 rounded-xl border border-white/10 bg-black/20 p-6 max-w-3xl">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              WHAT&apos;S NOT INCLUDED
            </div>
            <ul className="space-y-2 text-sm text-foreground/65 leading-relaxed">
              <li className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-foreground/40 shrink-0 mt-1" />
                <span>No help-center integration — your team publishes from the tool you already use.</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-foreground/40 shrink-0 mt-1" />
                <span>No auto-publishing — you decide what gets edited, approved, and shipped.</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-3.5 h-3.5 text-foreground/40 shrink-0 mt-1" />
                <span>No full help-center rebuild — the report starts with the highest-priority answers first.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Final CTA */}
        <section className="section-band section-band-blue">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-10 md:p-12 shadow-[0_0_40px_rgba(0,255,204,0.04)] text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                START HERE
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Send us your last 90 days of support tickets, and we’ll turn the repeat questions into answers your customers can use before they email, complain, or cancel
              </h2>
              <div className="text-foreground/65 leading-relaxed mb-8 space-y-4">
                <p>
                  Upload your last 90 days of tickets. We turn the repeat questions into FAQ entries your team can review and publish.
                </p>
                <p>
                  The questions that keep coming back slow down when customers can actually find the answer.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={GAP_REPORT_INTAKE_HREF}
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
                >
                  Upload your CSV — free FAQ Snapshot
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <p className="text-xs text-foreground/45 mt-6 leading-relaxed">
                Privacy: we delete your CSV after 30 days. No model training, no third-party sharing, no fine-tuning.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section-band scroll-mt-24">
          <div className="max-w-3xl mb-10">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              FAQ
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              Common questions before you upload the CSV.
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              The practical stuff: what the free snapshot includes, what the paid report adds, and what happens with your ticket data.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
            {pricingFaqs.map((faq, i) => (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.4, delay: 0.05 * i }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                  <h3 className="text-base font-semibold text-white">{faq.q}</h3>
                </div>
                <p className="text-sm text-foreground/60 leading-relaxed pl-6">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mt-16 text-center">
          <Link
            href={GAP_REPORT_INTAKE_HREF}
            className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
          >
            Upload your CSV — free FAQ Snapshot
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-xs text-foreground/45 mt-6 leading-relaxed">
            Privacy: we delete your CSV after 30 days. No model training, no third-party sharing, no fine-tuning.
          </p>
        </section>
        </div>
      </main>
    </>
  );
}
