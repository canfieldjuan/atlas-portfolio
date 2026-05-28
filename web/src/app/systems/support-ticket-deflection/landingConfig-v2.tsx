'use client';

import {
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  FileSearch,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { type DeflectionLandingPageConfig } from '@/components/landing/DeflectionLandingPage';
import {
  GAP_REPORT_INTAKE_HREF,
  pricingFaqs,
  pricingTiers,
} from './landingConfig';
import { generateFaqJsonLd } from '@/lib/seo';

const faqJsonLd = generateFaqJsonLd(
  pricingFaqs.map((faq) => ({ question: faq.q, answer: faq.a })),
);

function CopyBlock({ children }: { children: ReactNode }) {
  return <div className="space-y-5 text-base leading-relaxed text-foreground/68">{children}</div>;
}

function SectionList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-3 text-sm leading-relaxed text-foreground/68">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ComparisonGrid() {
  const rows = [
    {
      current: 'Scan tags. Poll agents. Chase the loudest complaint.',
      next: 'Upload a CSV. Get a ranked fix list in 24 hours, ordered by how often each question reaches support.',
    },
    {
      current: 'Write docs from internal assumptions and product jargon.',
      next: 'Write docs from the exact words customers already use in tickets and on Google.',
    },
    {
      current: 'Guess which fixes matter most.',
      next: 'Rank fixes by queue frequency, not opinion.',
    },
    {
      current: 'Hope customers find the answer.',
      next: 'Close the wording gap so Google and your help center can actually match the query.',
    },
    {
      current: 'Answers disappear back into the queue.',
      next: 'Every recommendation links back to source tickets and quoted evidence.',
    },
    {
      current: 'Macros and bots go stale, then send the wrong article.',
      next: 'You review every draft. Nothing goes live without you.',
    },
  ];

  return (
    <div className="glass overflow-hidden rounded-xl border border-border">
      <div className="grid gap-px bg-border md:grid-cols-2">
        <div className="bg-surface px-5 py-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-foreground/45">
            The current way
          </p>
        </div>
        <div className="bg-surface px-5 py-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-primary/80">
            Support Ticket Deflection
          </p>
        </div>
        {rows.map((row) => (
          <>
            <div key={`${row.current}-current`} className="bg-background px-5 py-4 text-sm leading-relaxed text-foreground/62">
              {row.current}
            </div>
            <div key={`${row.current}-next`} className="bg-background px-5 py-4 text-sm leading-relaxed text-foreground/78">
              {row.next}
            </div>
          </>
        ))}
      </div>
    </div>
  );
}

function ProofCards() {
  const cards = [
    {
      icon: <FileSearch className="h-4 w-4" />,
      title: 'Every recommendation links to a real ticket.',
      body:
        'Not a model guess. Not a synthetic summary. The report points back to the original ticket language and the quote that produced the finding.',
    },
    {
      icon: <Workflow className="h-4 w-4" />,
      title: 'The queue sets the priority.',
      body:
        'Fixes are frequency-ranked by how often they hit support, not by which complaint felt loudest in Slack this week.',
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      title: 'The draft is grounded in answers your team already used.',
      body:
        'The FAQ draft is assembled from real responses that already resolved the issue for a real customer. You are publishing proven language, not inventing it.',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card, index) => (
        <div key={card.title} className="glass rounded-xl border border-border p-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-primary/80">
            {card.icon}
            Proof {index + 1}
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">{card.title}</h3>
          <p className="text-sm leading-relaxed text-foreground/65">{card.body}</p>
        </div>
      ))}
    </div>
  );
}

export const landingPageConfigV2: DeflectionLandingPageConfig = {
  structuredData: faqJsonLd,
  hero: {
    eyebrow: 'SUPPORT TICKET DEFLECTION',
    eyebrowIcon: <Workflow className="h-3 w-3" />,
    title: "Your repeat support tickets are search queries your help center can't answer.",
    intro:
      "We mine them for the exact words your customers type into Google, and draft the FAQs you publish — so the answer is finally written where search can find it.",
    body:
      'Upload 3–6 months of support tickets. In 24 hours, get the repeat questions ranked, the wording gaps surfaced, and drafted FAQs your team reviews and publishes.',
    cta: {
      label: 'Upload your CSV — get a free Deflection Snapshot',
      href: GAP_REPORT_INTAKE_HREF,
    },
  },
  problemAgitation: {
    label: 'THE COST OF STAYING HERE',
    title: 'Repeat tickets are not a small inefficiency. They are an operating cost line.',
    content: (
      <CopyBlock>
        <p>
          Before a customer ever contacts you, they Google it. <strong className="text-foreground">73%</strong> try to answer their own question that way; only <strong className="text-foreground">14%</strong> succeed (Gartner). The answer usually exists — your help center just is not written in the words they searched, so it never surfaces. Every ticket in your queue is a list of the exact <strong className="text-foreground">search terms you are missing</strong>.
        </p>
        <p>
          That wording gap is expensive. Gartner benchmarked it plainly: a self-service resolution costs <strong className="text-foreground">$1.84</strong> versus <strong className="text-foreground">$13.50</strong> for an assisted contact. However you cut it, a question gets dramatically more expensive the moment it reaches a human queue.
        </p>
        <p>
          The volume is not hypothetical. Industry benchmarks consistently put repetitive support volume at 40% to 60% of the inbox. Gartner also found that 74% of issues that reach a live agent could have been resolved through self-service if the answer existed and was findable.
        </p>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-primary/80">
            The loop support leads already know
          </p>
          <SectionList
            items={[
              <><strong className="text-foreground">Customer searches, fails, opens a ticket.</strong> The answer may exist, but not in the language they used.</>,
              <><strong className="text-foreground">Your team answers it manually.</strong> The fix lives inside a reply thread, not where the next customer will find it.</>,
              <><strong className="text-foreground">The same question comes back next week.</strong> Another agent repeats the work.</>,
            ]}
          />
        </div>
        <p>That repetition taxes the team twice:</p>
        <SectionList
          items={[
            <>Agents spend only <strong className="text-foreground">39%</strong> of their time actually servicing customers — Salesforce.</>,
            <><strong className="text-foreground">Five hours a week</strong> disappear into repetitive tickets — Gorgias.</>,
            <>The same grind drives burnout, low morale, and the turnover costs leaders budget around instead of removing — Insignia.</>,
          ]}
        />
        <p>
          And the customers who never find the answer do not just cost more to handle — they leave. CEB found <strong className="text-foreground">94%</strong> of low-effort customers intend to repurchase, against only <strong className="text-foreground">4%</strong> of high-effort ones (<em>The Effortless Experience</em>).
        </p>
      </CopyBlock>
    ),
  },
  currentWayVsThisWay: {
    label: 'WHY THE USUAL FIXES UNDERPERFORM',
    title: 'You probably already tried the obvious things.',
    content: (
      <CopyBlock>
        <p>
          More agents, a bigger knowledge base, macros, chatbots, outsourcing. None of those fail because the team is careless. They fail because they do not close the loop between what customers ask and what your help center actually says.
        </p>
        <ComparisonGrid />
        <p>
          The mechanism here is extraction, not automation. Support Ticket Deflection does not answer tickets, modify your help desk, or auto-publish anything. It reads the queue, finds the repeated questions, and hands you a prioritized publishing plan.
        </p>
      </CopyBlock>
    ),
  },
  mechanism: {
    label: 'HOW IT WORKS',
    title: 'Three steps. No rollout. No new platform.',
    content: (
      <CopyBlock>
        <p>
          Export a CSV from Zendesk, Intercom, Help Scout, or any desk that gives you one. That file already contains the language customers use, the answers agents write, and the evidence needed to rank what should be fixed first.
        </p>
        <p>
          Within 24 hours you get a ranked fix list: repeat-question clusters, customer-term-to-doc-term gaps, source-ticket evidence, and a drafted FAQ for each gap. You review, edit, and publish what you approve.
        </p>
        <p>
          That fix list is also your SEO list. The phrases customers use in tickets are the phrases they type into Google, and your own volume tells you which ones matter most. Publish the answer in that language and your page finally matches the search instead of missing it on wording — which is how a help-center page gets found, and how a question gets answered before it turns into a ticket. You review and publish, so the visibility is yours to earn; the keywords are already validated by your queue.
        </p>
      </CopyBlock>
    ),
    processTitle: 'From inbox history to publishable self-service.',
    processDescription:
      'The report isolates the questions worth fixing, shows the exact wording gap behind each one, and returns drafts your team can ship without starting from a blank page.',
    stages: [
      { label: 'Upload your tickets', sub: 'CSV export • 3–6 months • no integration' },
      { label: 'We rank the repeat questions', sub: 'Question clusters • wording gaps • source-ticket evidence' },
      { label: 'You review and publish', sub: 'Drafted FAQs • no auto-publish • nothing goes live without you' },
    ],
  },
  proofStack: {
    label: 'WHY THIS IS BELIEVABLE',
    title: 'Proof comes from the queue first, and the benchmarks second.',
    content: (
      <CopyBlock>
        <ProofCards />
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-primary/80">
            Industry benchmarks that support the argument
          </p>
          <SectionList
            items={[
              <>Gartner: <strong className="text-foreground">$1.84 self-service vs. $13.50 assisted</strong>.</>,
              <>SQM Group: <strong className="text-foreground">a 1% improvement in FCR reduces operating costs by 1%</strong>.</>,
            ]}
          />
        </div>
        <blockquote className="rounded-xl border border-primary/20 bg-primary/5 p-5 text-sm leading-relaxed text-foreground/72">
          “While 73% of customers use self-service at some point in their customer service journey, it’s concerning to see that so few fully resolve there.”
          <footer className="mt-3 text-[11px] font-mono uppercase tracking-widest text-foreground/45">
            Eric Keller, Gartner
          </footer>
        </blockquote>
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-amber-300">
            <AlertTriangle className="h-4 w-4" />
            The Klarna lesson
          </div>
          <p className="text-sm leading-relaxed text-foreground/68">
            Klarna’s public AI rollout is useful for one reason: the walk-back. The company proved that cost-focused deflection without quality creates a different kind of support problem. That is why this product stops at extraction and drafting. Human review stays in the loop.
          </p>
        </div>
      </CopyBlock>
    ),
  },
  offer: {
    label: 'WHAT YOU GET',
    title: 'A report your team can act on this week.',
    content: (
      <CopyBlock>
        <SectionList
          items={[
            <>A ranked list of the repeat questions your customers keep asking, in their own words.</>,
            <>The customer-term-to-doc-term mismatches making existing answers hard to find.</>,
            <>The exact search terms your customers use — the keywords your help-center pages should target.</>,
            <>Source tickets and quoted evidence behind every recommendation.</>,
            <>A drafted FAQ for each high-priority gap, built from language your team already used to resolve the issue.</>,
          ]}
        />
        <p>
          Best fit: support leads at 15–75-person B2B SaaS companies with an exportable help desk and a help center they control. Not a fit if you want a live-answering bot or an enterprise implementation program.
        </p>
      </CopyBlock>
    ),
  },
  riskReversal: {
    label: 'WHY THIS IS SAFE',
    title: 'The risk is deliberately capped.',
    content: (
      <CopyBlock>
        <SectionList
          items={[
            <>Nothing goes live without you. The system does not publish or touch your help center.</>,
            <>Every finding is verifiable. If it appears in the report, it is backed by a real ticket and a real quote.</>,
            <>There is no per-resolution pricing, no hidden rollout, and no AI talking to your customers.</>,
            <>The workflow is short: upload a CSV, receive the report, review the drafts, publish what you approve.</>,
          ]}
        />
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground/55">
            <CircleHelp className="h-4 w-4" />
            What you are not buying
          </div>
          <p className="text-sm leading-relaxed text-foreground/68">
            Not a chatbot. Not a replacement for agents. Not a black-box content writer. This is a ticket-history analysis that turns repeated questions into reviewed self-service.
          </p>
        </div>
      </CopyBlock>
    ),
  },
  finalCta: {
    label: 'START HERE',
    title: 'See what your tickets are telling you.',
    body: [
      'Upload your CSV. Get the repeat questions, wording gaps, and drafted answers in 24 hours.',
      'If the pattern is not there, the snapshot will make that clear. If it is, you will know what to publish first.',
    ],
    cta: {
      label: 'Upload your tickets — get a free Deflection Snapshot',
      href: GAP_REPORT_INTAKE_HREF,
    },
    privacy:
      'Privacy: we delete your CSV after 30 days. No model training, no third-party sharing, no fine-tuning.',
  },
  pricing: {
    id: 'pricing',
    label: 'PRICING',
    title: 'Start free. Pay when the queue proves the opportunity is real.',
    description:
      'The free snapshot is enough to confirm whether your old tickets are hiding deflectable work. If the pattern is there, the full report gives your team the ranked list and drafts to act on it.',
    tiers: pricingTiers,
    constraintLabel: 'WHAT IS NOT INCLUDED',
    exclusions: [
      'No help-center integration. Your team publishes in the tool you already use.',
      'No auto-publishing. You review, edit, and approve every FAQ.',
      'No guaranteed deflection percentage. The report identifies the highest-priority opportunities first.',
    ],
  },
  faq: {
    id: 'faq',
    label: 'FAQ',
    title: 'Questions support leads usually ask before uploading tickets.',
    description:
      'The mechanics are deliberately simple: export the CSV, receive the report, review the output, and publish what you approve.',
    items: pricingFaqs,
  },
};