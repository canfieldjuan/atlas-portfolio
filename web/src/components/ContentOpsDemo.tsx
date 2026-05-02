'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  FileText,
  LayoutTemplate,
  Loader2,
  Mail,
  Megaphone,
  Play,
  RotateCcw,
  ScrollText,
} from 'lucide-react';
import Link from 'next/link';
import { buildAuditHref } from '@/lib/audit-routing';

type StageId = 'extract' | 'angles' | 'approval' | 'assets';

const stages: { id: StageId; label: string; detail: string }[] = [
  { id: 'extract', label: 'Signal Extraction', detail: 'Pulling pain points, language, and themes' },
  { id: 'angles', label: 'Reasoning + Synthesis', detail: 'Turning signals into content angles' },
  { id: 'approval', label: 'Approval Queue', detail: 'Flagging claims for human review' },
  { id: 'assets', label: 'Final Assets', detail: 'Rendering blogs, emails, briefs, and posts' },
];

type Scenario = {
  id: string;
  tab: string;
  title: string;
  summary: string;
  inputLabel: string;
  inputs: string[];
  signals: string[];
  angles: string[];
  approvalNotes: string[];
  assets: {
    blog: { title: string; outline: string[] };
    email: { name: string; touches: { subject: string; preview: string }[] };
    brief: { title: string; bullets: string[] };
    landing: { eyebrow: string; headline: string; body: string };
    social: { platform: string; post: string };
  };
};

const postDemoAuditHref = buildAuditHref({
  interest: 'content-generation',
  source: 'ai-content-ops-demo',
  offer: 'content-ops-audit',
});

const privateDemoHref = buildAuditHref({
  interest: 'content-generation',
  source: 'ai-content-ops-demo',
  offer: 'content-ops-private-demo',
});

const scenarios: Scenario[] = [
  {
    id: 'saas',
    tab: 'B2B SaaS feedback',
    title: 'B2B SaaS customer feedback',
    summary:
      'A project management SaaS pulled three months of churn-survey responses and NPS comments from accounts that downgraded or left.',
    inputLabel: 'Anonymized churn-survey excerpts',
    inputs: [
      '"We outgrew it once we hit 60+ users. Permissioning got painful and we needed real audit logs."',
      '"Honestly, the AI features felt bolted on. We needed structured workflows, not a chat sidebar."',
      '"Pricing jumped 40% at renewal with no new value. We had to justify that to finance and could not."',
      '"Reporting was the dealbreaker. Exec team wanted dashboards, not CSV exports."',
    ],
    signals: [
      'Pain: scaling past 50 seats breaks permissions and audit',
      'Objection: AI features feel surface-level, not workflow-deep',
      'Pricing trigger: 40% renewal increase without value delta',
      'Decision driver: exec dashboard requirements, not feature parity',
    ],
    angles: [
      'Comparison: scaling-team workflow tooling at 50+ seats',
      'Education: how AI features should be embedded vs bolted on',
      'Procurement: how to justify renewal pricing internally',
    ],
    approvalNotes: [
      'Pricing claims need finance review before publishing',
      'Competitor names redacted in public-facing assets',
    ],
    assets: {
      blog: {
        title: 'Why mid-market teams outgrow chat-style PM tools (and what they switch to)',
        outline: [
          'The 50-seat wall: permissions, audit, and ownership',
          'When AI sidebars stop being useful',
          'What dashboards exec teams actually need',
          'Three signs your renewal pricing is no longer defensible',
        ],
      },
      email: {
        name: '3-touch reactivation sequence for downgraded accounts',
        touches: [
          {
            subject: 'The exec-dashboard request you flagged at renewal',
            preview: 'You mentioned reporting was the dealbreaker. Here is what changed in Q4...',
          },
          {
            subject: 'Audit logs and seat-level permissioning, finally',
            preview: 'For teams running past 50 users, the access model now matches enterprise expectations.',
          },
          {
            subject: 'A 20-minute walkthrough on the workflow side',
            preview: 'No demo theater. Just the 4 workflows that the AI actually drives end-to-end.',
          },
        ],
      },
      brief: {
        title: 'Top 5 churn drivers and counter-positions',
        bullets: [
          'Permissioning at scale — point to seat-level audit + role inheritance',
          'AI surface vs workflow depth — show the 4 native workflows, not the chat sidebar',
          'Renewal pricing — lead with usage-based credit toward the new tier',
          'Reporting depth — open the exec-dashboard view in the first call',
          'Procurement justification — provide the ROI worksheet, not a quote',
        ],
      },
      landing: {
        eyebrow: 'BUILT FOR SCALING TEAMS',
        headline: 'Workflows that hold up past 50 seats.',
        body: 'Real role-based permissioning, audit logs your security team will sign off on, and AI features that drive the workflow instead of sitting next to it.',
      },
      social: {
        platform: 'LinkedIn thread',
        post: 'Three months of churn survey data from a mid-market SaaS. The #1 reason teams leave is not what the product team thinks. It is the 50-seat wall: permissions, audit, and exec reporting all break at the same point. Here is the pattern we kept seeing...',
      },
    },
  },
  {
    id: 'local',
    tab: 'Local service reviews',
    title: 'Local service business reviews',
    summary:
      'A residential HVAC company in the Pacific Northwest pulled six months of Google and Yelp reviews — the three- and four-star ones, where customers had specific concerns.',
    inputLabel: 'Three- and four-star review excerpts',
    inputs: [
      '"Tech was great but I had no idea what the service call would cost until the invoice. A range up front would have helped."',
      '"They came same day which was huge. Just wish the dispatch window had been tighter — I waited four hours."',
      '"Honest people. Showed me the failed part and explained why it failed. I just wish they offered a maintenance plan."',
      '"Quote was fair but the financing options were not clear on the website. Found them on the call."',
    ],
    signals: [
      'Pain: pricing opacity before the visit',
      'Pain: dispatch window too wide',
      'Praise: technician transparency about failed parts',
      'Gap: maintenance plan and financing not surfaced on web',
    ],
    angles: [
      'Trust: what an HVAC visit actually costs and why',
      'Operational: how same-day service really works behind the scenes',
      'Offer: introducing the maintenance plan customers keep asking for',
    ],
    approvalNotes: [
      'Pricing ranges need owner sign-off before publishing on web',
      'Customer quotes anonymized in social posts',
    ],
    assets: {
      blog: {
        title: 'What an HVAC service visit actually costs (and what you are paying for)',
        outline: [
          'The diagnostic fee: what it covers and why it exists',
          'Parts vs labor: a real invoice, broken down',
          'Why same-day service has a wider dispatch window',
          'When a maintenance plan pays for itself',
        ],
      },
      email: {
        name: 'Post-service follow-up + 6-month maintenance reminder',
        touches: [
          {
            subject: 'Quick follow-up on yesterday\'s service call',
            preview: 'A short note on what we replaced, why it failed, and what to watch for next.',
          },
          {
            subject: 'A maintenance plan that would have caught this',
            preview: 'Two visits a year, priority dispatch, and a flat rate on diagnostics.',
          },
          {
            subject: 'It is the 6-month mark — time for a tune-up',
            preview: 'Same-day slots open this week if you want to get on the calendar.',
          },
        ],
      },
      brief: {
        title: 'Top 5 reasons customers choose us over the big-box guys',
        bullets: [
          'Technicians explain failed parts, not just replace them',
          'Same-day service in 90% of zip codes we cover',
          'Diagnostic fee credited toward the repair, not added on top',
          'Owner-operated, not a national franchise',
          'Financing on repairs over $1,500 with no application fee',
        ],
      },
      landing: {
        eyebrow: 'HONEST PRICING. SAME-DAY SERVICE.',
        headline: 'You should know what an HVAC visit costs before we show up.',
        body: 'Diagnostic fees are flat, repair quotes are itemized, and our technicians walk you through the failed part before recommending a fix. No surprises on the invoice.',
      },
      social: {
        platform: 'Instagram post',
        post: 'A customer asked us this week why an HVAC diagnostic costs what it does. Fair question. Here is what is in that fee — and why we credit it toward the repair if you go ahead. (Carousel: 4 slides.)',
      },
    },
  },
  {
    id: 'crm',
    tab: 'Sales CRM notes',
    title: 'Sales team CRM notes',
    summary:
      'A B2B sales team exported the call-note field from their CRM for 47 deals from last quarter — 22 closed-won and 25 closed-lost — anonymized.',
    inputLabel: 'Anonymized CRM call-note excerpts',
    inputs: [
      '"Procurement is asking for SOC 2 evidence and a DPA before they will pass to legal. Stalling deal."',
      '"Champion loves it but their VP wants to see how we compare to [competitor] on data residency."',
      '"They went with [other vendor] because we could not commit to an EU-hosted instance in Q3."',
      '"Closed-won. The signal extraction demo flipped them — that is what they had been trying to build internally."',
    ],
    signals: [
      'Blocker: SOC 2 + DPA gate procurement on most enterprise deals',
      'Competitive: data residency is a deciding factor for EU-exposed buyers',
      'Win driver: live demo of signal extraction outperforms slide-based pitches',
      'Loss pattern: hosting commitments lost three deals in Q3 alone',
    ],
    angles: [
      'Procurement: a vendor evaluation kit for security review teams',
      'Competitive: how data residency commitments actually work in practice',
      'Win/loss: what flipped 22 closed-won deals last quarter',
    ],
    approvalNotes: [
      'Competitor names removed from any public-facing asset',
      'Win-rate numbers verified against CRM before publishing',
    ],
    assets: {
      blog: {
        title: 'What enterprise procurement actually asks before passing a deal to legal',
        outline: [
          'The four documents that come up on every security review',
          'Where SOC 2 stops being enough',
          'Data residency: contract language vs operational reality',
          'How to get on the approved-vendor list before the RFP closes',
        ],
      },
      email: {
        name: '4-touch sequence for procurement-blocked deals',
        touches: [
          {
            subject: 'The SOC 2 packet your security team is going to ask for',
            preview: 'Pre-loaded with the eight artifacts that come up most often. Saves a week.',
          },
          {
            subject: 'EU-hosted instance — confirmed timeline',
            preview: 'Q1 GA, with an early-access waitlist for deals stalled on residency.',
          },
          {
            subject: 'A DPA your legal team will not redline',
            preview: 'Built from the standard clauses your peers have already approved.',
          },
          {
            subject: 'Want a 20-minute demo focused on the procurement side?',
            preview: 'Skip the product tour. We walk through the security and audit surface.',
          },
        ],
      },
      brief: {
        title: 'Top 3 competitor counter-positions for Q4',
        bullets: [
          'On data residency: lead with EU-hosted GA timeline + early-access slot',
          'On SOC 2 depth: send the artifact packet before the security call',
          'On price: anchor on procurement cycle time saved, not feature parity',
        ],
      },
      landing: {
        eyebrow: 'FOR REGULATED INDUSTRIES',
        headline: 'Pass procurement without the six-week stall.',
        body: 'SOC 2 evidence pre-loaded, DPA built from clauses your peers already signed, and an EU-hosted instance landing in Q1. Your security team will not be the bottleneck.',
      },
      social: {
        platform: 'LinkedIn post',
        post: 'We pulled CRM notes from 47 deals last quarter — 22 closed-won, 25 closed-lost. The single biggest predictor of a closed-won was not feature fit. It was how fast we got through procurement. Here is what the winning deals had in common...',
      },
    },
  },
];

const STEP_INTERVAL_MS = 850;

export function ContentOpsDemo() {
  const [selectedId, setSelectedId] = useState(scenarios[0].id);
  const [runState, setRunState] = useState<'idle' | 'running' | 'done'>('idle');
  const [activeStep, setActiveStep] = useState<number>(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scenario = scenarios.find((s) => s.id === selectedId) ?? scenarios[0];

  function clearTimer() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  function handleScenarioChange(id: string) {
    if (id === selectedId) return;
    clearTimer();
    setSelectedId(id);
    setRunState('idle');
    setActiveStep(-1);
  }

  function runPipeline() {
    clearTimer();
    setRunState('running');
    setActiveStep(0);
    let step = 0;
    intervalRef.current = setInterval(() => {
      step += 1;
      if (step >= stages.length) {
        clearTimer();
        setActiveStep(stages.length - 1);
        setRunState('done');
      } else {
        setActiveStep(step);
      }
    }, STEP_INTERVAL_MS);
  }

  const showAssets = runState === 'done';

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
      {/* Scenario selector — plain button group, not a full ARIA tab pattern */}
      <div role="group" aria-label="Demo scenarios" className="flex flex-col sm:flex-row border-b border-white/10">
        {scenarios.map((s) => {
          const isActive = s.id === selectedId;
          return (
            <button
              key={s.id}
              type="button"
              aria-current={isActive ? 'true' : undefined}
              onClick={() => handleScenarioChange(s.id)}
              className={`flex-1 px-5 py-4 text-left text-sm transition-colors border-b sm:border-b-0 sm:border-r border-white/10 last:border-r-0 last:border-b-0 ${
                isActive
                  ? 'bg-primary/[0.06] text-white'
                  : 'text-foreground/60 hover:bg-white/[0.02] hover:text-foreground/80'
              }`}
            >
              <div className="text-[10px] font-mono tracking-widest mb-1 text-primary/70">
                SCENARIO
              </div>
              <div className="font-medium">{s.tab}</div>
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="p-6 md:p-8">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2">{scenario.title}</h3>
          <p className="text-sm text-foreground/65 leading-relaxed">{scenario.summary}</p>
        </div>

        {/* Input panel */}
        <div className="rounded-lg border border-white/10 bg-black/30 p-5 mb-6">
          <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-3">
            INPUT — {scenario.inputLabel.toUpperCase()}
          </div>
          <div className="space-y-2">
            {scenario.inputs.map((line, i) => (
              <p key={i} className="text-sm text-foreground/70 leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Run controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          {runState === 'idle' && (
            <button
              type="button"
              onClick={runPipeline}
              className="group inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-colors text-sm"
            >
              <Play className="w-4 h-4" />
              Run Sample Pipeline
            </button>
          )}
          {runState === 'running' && (
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-md bg-white/[0.04] border border-white/10 text-sm text-foreground/70">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Running pipeline…
            </div>
          )}
          {runState === 'done' && (
            <button
              type="button"
              onClick={runPipeline}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-white/10 hover:bg-white/5 transition-colors rounded-md text-sm text-foreground/80"
            >
              <RotateCcw className="w-4 h-4" />
              Run again
            </button>
          )}
          <p className="text-xs text-foreground/40 font-mono">
            Preloaded scenario · No live model calls · No user input accepted
          </p>
        </div>

        {/* Pipeline stages */}
        <div className="space-y-2 mb-6">
          {stages.map((stage, i) => {
            const isActive = i === activeStep && runState === 'running';
            const isComplete =
              (runState === 'running' && i < activeStep) || runState === 'done';
            const isPending = runState === 'idle' || (runState === 'running' && i > activeStep);

            return (
              <div
                key={stage.id}
                className={`rounded-lg border px-4 py-3 transition-colors ${
                  isActive
                    ? 'border-primary/40 bg-primary/[0.06]'
                    : isComplete
                    ? 'border-white/10 bg-white/[0.03]'
                    : 'border-white/5 bg-black/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-primary/20 text-primary'
                        : isComplete
                        ? 'bg-primary/10 text-primary'
                        : 'bg-white/5 text-foreground/35'
                    }`}
                  >
                    {isActive ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : isComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <span className="text-[10px] font-mono">{String(i + 1).padStart(2, '0')}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium ${
                        isPending ? 'text-foreground/45' : 'text-white'
                      }`}
                    >
                      {stage.label}
                    </div>
                    <div
                      className={`text-xs ${
                        isPending ? 'text-foreground/30' : 'text-foreground/55'
                      }`}
                    >
                      {stage.detail}
                    </div>
                  </div>
                </div>

                {/* Mid-stage payload reveals */}
                {isComplete && stage.id === 'extract' && (
                  <div className="mt-3 pl-10 space-y-1">
                    {scenario.signals.map((s) => (
                      <p key={s} className="text-xs text-foreground/60 leading-relaxed">
                        — {s}
                      </p>
                    ))}
                  </div>
                )}
                {isComplete && stage.id === 'angles' && (
                  <div className="mt-3 pl-10 space-y-1">
                    {scenario.angles.map((a) => (
                      <p key={a} className="text-xs text-foreground/60 leading-relaxed">
                        — {a}
                      </p>
                    ))}
                  </div>
                )}
                {isComplete && stage.id === 'approval' && (
                  <div className="mt-3 pl-10 space-y-1">
                    {scenario.approvalNotes.map((n) => (
                      <p key={n} className="text-xs text-foreground/60 leading-relaxed">
                        — {n}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Final assets */}
        {showAssets && (
          <div className="border-t border-white/10 pt-6">
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <div className="text-[10px] font-mono text-primary/80 tracking-widest">
                FINAL ASSETS — APPROVED FOR REVIEW
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Blog */}
              <div className="rounded-lg border border-white/10 bg-black/30 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-primary" />
                  <div className="text-[10px] font-mono text-foreground/45 tracking-widest">
                    SEO BLOG OUTLINE
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-white mb-3 leading-snug">
                  {scenario.assets.blog.title}
                </h4>
                <ul className="space-y-1.5">
                  {scenario.assets.blog.outline.map((h) => (
                    <li key={h} className="text-xs text-foreground/60 leading-relaxed">
                      · {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Email */}
              <div className="rounded-lg border border-white/10 bg-black/30 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-4 h-4 text-primary" />
                  <div className="text-[10px] font-mono text-foreground/45 tracking-widest">
                    EMAIL CAMPAIGN
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-white mb-3 leading-snug">
                  {scenario.assets.email.name}
                </h4>
                <div className="space-y-2.5">
                  {scenario.assets.email.touches.map((t, i) => (
                    <div key={t.subject} className="border-l border-white/10 pl-3">
                      <div className="text-[10px] font-mono text-foreground/40 mb-0.5">
                        TOUCH {i + 1}
                      </div>
                      <div className="text-xs font-medium text-foreground/80 mb-0.5">
                        {t.subject}
                      </div>
                      <div className="text-xs text-foreground/50 leading-relaxed">
                        {t.preview}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sales brief */}
              <div className="rounded-lg border border-white/10 bg-black/30 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <div className="text-[10px] font-mono text-foreground/45 tracking-widest">
                    SALES BRIEF
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-white mb-3 leading-snug">
                  {scenario.assets.brief.title}
                </h4>
                <ul className="space-y-1.5">
                  {scenario.assets.brief.bullets.map((b) => (
                    <li key={b} className="text-xs text-foreground/60 leading-relaxed">
                      · {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Landing page section */}
              <div className="rounded-lg border border-white/10 bg-black/30 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <LayoutTemplate className="w-4 h-4 text-primary" />
                  <div className="text-[10px] font-mono text-foreground/45 tracking-widest">
                    LANDING PAGE SECTION
                  </div>
                </div>
                <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-2">
                  {scenario.assets.landing.eyebrow}
                </div>
                <h4 className="text-base font-semibold text-white mb-2 leading-snug">
                  {scenario.assets.landing.headline}
                </h4>
                <p className="text-xs text-foreground/60 leading-relaxed">
                  {scenario.assets.landing.body}
                </p>
              </div>

              {/* Social — full width */}
              <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Megaphone className="w-4 h-4 text-primary" />
                  <div className="text-[10px] font-mono text-foreground/45 tracking-widest">
                    SOCIAL CONTENT — {scenario.assets.social.platform.toUpperCase()}
                  </div>
                </div>
                <p className="text-sm text-foreground/75 leading-relaxed italic">
                  &ldquo;{scenario.assets.social.post}&rdquo;
                </p>
              </div>
            </div>

            {/* Post-demo CTA */}
            <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-white mb-0.5">
                  Want to see this using your own business data?
                </div>
                <p className="text-xs text-foreground/55">
                  The audit produces a real workflow map, not a sample one.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                <Link
                  href={postDemoAuditHref}
                  className="group inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-colors text-sm"
                >
                  Book a Content Ops Audit
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href={privateDemoHref}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-white/10 hover:bg-white/5 transition-colors rounded-md text-sm text-foreground/80"
                >
                  Request a Private Demo
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 text-[11px] text-foreground/35 mt-6 leading-relaxed">
          <ScrollText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Demo data is illustrative. Real engagements run on your own business data with the same pipeline shape.
          </span>
        </div>
      </div>
    </div>
  );
}
