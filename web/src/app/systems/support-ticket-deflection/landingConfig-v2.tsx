'use client';

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  FileSearch,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
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
      <div className="space-y-px bg-border md:hidden">
        {rows.map((row) => (
          <div key={row.current} className="bg-background">
            <div className="border-b border-border px-5 py-4">
              <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-foreground/45">
                The current way
              </p>
              <p className="text-sm leading-relaxed text-foreground/62">{row.current}</p>
            </div>
            <div className="px-5 py-4">
              <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-primary/80">
                Support Ticket Deflection
              </p>
              <p className="text-sm leading-relaxed text-foreground/78">{row.next}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden gap-px bg-border md:grid md:grid-cols-2">
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
          <Fragment key={row.current}>
            <div key={`${row.current}-current`} className="bg-background px-5 py-4 text-sm leading-relaxed text-foreground/62">
              {row.current}
            </div>
            <div key={`${row.current}-next`} className="bg-background px-5 py-4 text-sm leading-relaxed text-foreground/78">
              {row.next}
            </div>
          </Fragment>
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

// The calculator link is parameterized so it renders only on the public page.
// The partner-priced twin (partner/page.tsx) reuses this config but passes no
// href to the cost section: the public /calculator's back link returns to the
// public $1,500 page, which would leak a design partner out of the noindex
// $1,000 funnel.
export function makeProblemAgitation(): DeflectionLandingPageConfig['problemAgitation'] {
  return {
    label: 'THE BROKEN LOOP',
    title: 'Stop paying agents to act like search engines.',
    content: (
      <CopyBlock>
        <p>
          Repeat tickets keep coming back for one simple reason: your answers never reach the next customer. Gartner data is clear: <strong className="text-foreground">73%</strong> of customers attempt self-service, but only <strong className="text-foreground">14%</strong> succeed. The answer often exists, but it is not written in the words customers actually search for. So they miss it, open a ticket, and your team answers something your help center should have handled.
        </p>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="mb-3 text-[10px] font-mono uppercase tracking-widest text-primary/80">
            The loop destroying your queue
          </p>
          <SectionList
            items={[
              <><strong className="text-foreground">The miss:</strong> A customer searches their exact problem, finds nothing useful, and opens a ticket.</>,
              <><strong className="text-foreground">The waste:</strong> Your team answers it manually. The fix gets buried in a private support thread.</>,
              <><strong className="text-foreground">The repeat:</strong> The same question comes back next week. Another agent repeats the work.</>,
            ]}
          />
        </div>
        <p>
          Industry benchmarks show that <strong className="text-foreground">40% to 60%</strong> of support inbox volume is repetitive questions. Every one of those tickets is more than a support request. It is evidence of the customer wording your help center is missing.
        </p>
      </CopyBlock>
    ),
  };
}

export function makeProblemCost(
  calculatorHref?: string,
): DeflectionLandingPageConfig['problemCost'] {
  return {
    label: 'WHAT IT COSTS',
    title: 'Repeat questions are bleeding your support budget.',
    content: (
      <CopyBlock>
        <p>
          That wording gap is not a content problem. It is a cost leak. Gartner benchmarks self-service at <strong className="text-foreground">$1.84</strong> versus <strong className="text-foreground">$13.50</strong> for an assisted contact. That is <strong className="text-foreground">$11.66 more</strong> every time a repeat question your help center could have answered reaches a person instead.
        </p>
        <p>
          Run that against your own repeat volume. The cost is real, not theoretical.
        </p>
        {calculatorHref && (
          <div>
            <Link
              href={calculatorHref}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-dark transition-colors"
            >
              Run the numbers on your own volume
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
        <p>This is not just about money. It is what repeat work does to the team:</p>
        <SectionList
          items={[
            <>Agents spend only <strong className="text-foreground">39%</strong> of their time actually servicing customers — Salesforce.</>,
            <><strong className="text-foreground">Five hours a week</strong> disappear into repetitive tickets — Gorgias.</>,
            <>The same grind contributes to burnout, low morale, and the turnover costs leaders keep budgeting around — Insignia.</>,
          ]}
        />
        <p>
          Customers feel the cost too. CEB found <strong className="text-foreground">94%</strong> of low-effort customers intend to repurchase, compared with only <strong className="text-foreground">4%</strong> of high-effort customers (<em>The Effortless Experience</em>). Every failed search adds effort before the conversation even starts.
        </p>
      </CopyBlock>
    ),
  };
}

export const landingPageConfigV2: DeflectionLandingPageConfig = {
  structuredData: faqJsonLd,
  hero: {
    eyebrow: 'SUPPORT TICKET DEFLECTION',
    eyebrowIcon: <Workflow className="h-3 w-3" />,
    title: 'Your support tickets already contain the keywords your help center is missing.',
    intro:
      'Stop guessing what customers search for. We mine your support tickets for the exact words they use and draft FAQs your team can review.',
    body:
      'Upload 3–6 months of support tickets. In 24 hours, get a ranked list of repeat questions, the wording gaps you’re missing, and ready-to-publish FAQ drafts.',
    cta: {
      label: 'Find my repeat-ticket gaps',
      href: GAP_REPORT_INTAKE_HREF,
    },
  },
  problemAgitation: makeProblemAgitation(),
  problemCost: makeProblemCost('/systems/support-ticket-deflection/calculator'),
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
          Within 24 hours you get a ranked fix list: every repeat-question cluster ordered by frequency, customer-term-to-doc-term gaps, source-ticket evidence, a drafted FAQ for every gap your tickets already answer, and a flagged list of the ones they do not. You review, edit, and publish what you approve.
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
  seoVisibility: {
    label: 'SEO / SEARCH VISIBILITY',
    title: 'Every answer you publish is a page written in the words people actually search.',
    content: (
      <CopyBlock>
        <p>
          The phrases your customers use in tickets are the phrases they type into Google — and your own volume tells you which ones matter most. Today your help-center page misses on wording: it answers in your internal product language, not the words customers search. We hand you their own search wording, validated by your queue, so the answer finally gets published in the same words customers search — not your internal jargon.
        </p>
        <p>
          Service leaders surveyed by Gartner estimate that as much as <strong className="text-foreground">40%</strong> of the issues reaching a live agent could have been resolved in self-service — if the answer existed and was findable. Findable is the whole game, and findable means matching the words people search.
        </p>
        <p>
          And it is an asset, not a one-off reply. A published answer sits there for every future customer who searches that question — one page doing work your team would otherwise repeat by hand, so the next person with that question can find the answer instead of writing in.
        </p>
        <p>
          You review and publish every word, so the visibility is yours to earn. We supply the keywords and the drafts; what gets found is the work you ship.
        </p>
      </CopyBlock>
    ),
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
    title: 'You get a list of data-backed fixes for your most expensive repeat questions.',
    content: (
      <CopyBlock>
        <p>
          The report pinpoints which repeat questions are draining your team&rsquo;s support time, ranked by your own ticket history.
        </p>
        <p>For each question, you&rsquo;ll see:</p>
        <SectionList
          items={[
            <><strong className="text-foreground">Customer wording:</strong> the exact phrases customers use.</>,
            <><strong className="text-foreground">Documentation gap:</strong> where your current answers fall short.</>,
            <><strong className="text-foreground">Source tickets:</strong> the evidence behind each finding.</>,
            <><strong className="text-foreground">FAQ draft or no-proven-answer flag:</strong> for questions your tickets already solve, ready-to-review answers built from resolved replies. If tickets do not support an answer, the report marks &ldquo;no proven answer yet&rdquo; instead. The output is 100% deterministic, with no LLM-generated answers.</>,
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
            <>You control everything. Nothing goes live without your approval. The system does not publish or touch your help center.</>,
            <>Every finding is verifiable. If it appears in the report, it is backed by a real ticket and a real quote.</>,
            <>No hidden costs or surprises. No per-resolution pricing, no hidden rollout, and no AI talking to your customers.</>,
            <>Simple workflow: upload a CSV, receive the report, review the drafts, publish what you approve.</>,
          ]}
        />
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-foreground/55">
            <CircleHelp className="h-4 w-4" />
            What you&rsquo;re not buying
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
    title: 'Find the gaps fueling your ticket volume.',
    body: [
      'Every day you wait, your team spends hours answering the same preventable questions. Upload your CSV today, and within 24 hours, you will see exactly which repeat questions and wording gaps are costing you the most time — complete with publishable drafts.',
      'If the repetition is not there, the data will prove it. If it is, you will have a prioritized list of exactly what to publish first to start clearing the repeats.',
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
    title: 'Start with the snapshot. Upgrade when the repeat pattern is clear.',
    description:
      'The free snapshot shows whether your tickets contain enough repeated questions to justify the full report. If the pattern is real, the full report gives your team the ranked questions, customer wording, documentation gaps, source evidence, and review-ready drafts to publish first.',
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
