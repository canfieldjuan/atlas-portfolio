'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Hash,
  Send,
  Sparkles,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { DarkStoryDemo } from '@/components/DarkStoryDemo';
import { generateFaqJsonLd } from '@/lib/seo';

type Tier = {
  id: 'cadence' | 'engine' | 'authority';
  name: string;
  price: string;
  cadence: string;
  bestFor: string;
  videos: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
};

const tiers: Tier[] = [
  {
    id: 'cadence',
    name: 'Channel Cadence',
    price: '$497',
    cadence: '/month',
    bestFor: 'Channels publishing 2× per week',
    videos: '8 video packages / month',
    features: [
      'Full narration script (10–15 min runtime)',
      '3–5 CTR-optimized title variants',
      'Thumbnail concept brief',
      'Description with timestamps + SEO tags',
      'Pinned comment',
      'Shorts / TikTok teaser script',
      'Voice-matched to your channel',
      '3 business day turnaround per package',
    ],
    cta: 'Start Channel Cadence',
  },
  {
    id: 'engine',
    name: 'Channel Engine',
    price: '$997',
    cadence: '/month',
    bestFor: 'Daily-ish cadence — most popular',
    videos: '16 video packages / month',
    features: [
      'Everything in Channel Cadence, plus:',
      'Channel voice profile (calibrated to your archive)',
      'Light content calendar',
      'Priority turnaround',
    ],
    highlighted: true,
    cta: 'Start Channel Engine',
  },
  {
    id: 'authority',
    name: 'Channel Authority',
    price: '$1,997',
    cadence: '/month',
    bestFor: 'High-volume channels with thumbnail / strategy needs',
    videos: '20+ video packages / month',
    features: [
      'Everything in Channel Engine, plus:',
      'Monthly thumbnail revisions',
      'Content strategy review',
      'Story-sourcing help (subscriber inbox triage)',
      'Optional upload / scheduling support',
    ],
    cta: 'Start Channel Authority',
  },
];

const deliverables = [
  'Full narration script (10–15 minute runtime)',
  '3–5 CTR-optimized title variants with rationale',
  'Thumbnail concept brief (visual direction + text overlays)',
  'Description with timestamps and SEO tags',
  'Pinned comment to drive engagement',
  'Shorts / Reels / TikTok teaser script',
  'Channel-voice calibration (Engine + Authority)',
  'Content calendar (Engine + Authority)',
];

const howItWorks = [
  {
    title: 'Send the topic',
    detail: 'A topic prompt, a Reddit story, a folklore reference, or a haunted-location source. We source-check and confirm scope.',
  },
  {
    title: 'We draft the full package',
    detail: 'Script + titles + thumbnail brief + description + pinned comment + Shorts teaser. All voice-matched to your channel.',
  },
  {
    title: 'You record and upload',
    detail: 'Use the script as-is or tighten where you want. The thumbnail brief goes to your designer; the title variants go to A/B testing.',
  },
  {
    title: 'We learn the channel',
    detail: 'After the first 2–3 deliveries, we calibrate against what your audience actually retains. Voice profile updates monthly.',
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: 'How does voice matching actually work for a YouTube channel?',
    a: 'For your first delivery, we work from your three most-recent uploads — pacing, narration style, recurring phrases, audience expectations. After delivery 2–3 we have a calibrated voice profile that gets updated monthly based on which scripts performed best on your channel.',
  },
  {
    q: 'Where do you source story ideas if I do not have a topic ready?',
    a: 'Authority tier includes story-sourcing help: subscriber inbox triage, public-domain folklore curation, Reddit story selection (r/LetsNotMeet, r/nosleep, r/UnresolvedMysteries depending on your niche). Lower tiers expect you to send the topic; we handle research and writing from there.',
  },
  {
    q: 'Can you keep up with daily-cadence channels?',
    a: 'Yes — Channel Engine ships 16 packages/month (about 4 per week with turnaround buffer). Channel Authority ships 20+ with priority. If your cadence is heavier than that, we scope a custom rate.',
  },
  {
    q: 'What about copyright on Reddit-sourced stories?',
    a: 'Standard practice: subscriber-submitted stories with explicit permission, plus Reddit content that falls under the platform\'s sharing terms. We flag any story where licensing is unclear and either get permission, anonymize details, or rebuild the beats from public-domain folklore. Authority tier includes more thorough source vetting.',
  },
  {
    q: 'Do you support non-horror dark channels?',
    a: 'Yes. The lane is dark / mystery storytelling broadly: horror narration, urban legends, paranormal investigation, cryptid coverage, "true scary" first-person, missing-persons-adjacent, and historical mysteries. We do NOT take true-crime channels at this stage — the legal review burden is different and we want to scope that properly before saying yes.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Month-to-month, cancel with one billing cycle of notice. We deliver any packages you have already sent topics for.',
  },
];

const faqJsonLd = generateFaqJsonLd(
  faqs.map((f) => ({ question: f.q, answer: f.a })),
);

export default function DarkStoryEnginePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-5xl mx-auto">

          {/* Hero */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
              <Hash className="w-3 h-3" />
              <span>DARK STORY ENGINE</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
              Ship a dark story video every week —{' '}
              <span className="gradient-text">without writing the script yourself.</span>
            </h1>
            <p className="text-lg text-foreground/65 leading-relaxed mb-4 max-w-3xl">
              Built for horror narration, urban-legend, paranormal, and dark-mystery YouTube channels. Every video ships a full narration script, CTR-optimized titles, a thumbnail concept brief, a timestamped description, a pinned comment, and a Shorts teaser — voice-matched to your channel.
            </p>
            <p className="text-sm text-foreground/45 leading-relaxed mb-8">
              For solo creators and small teams publishing 2–7×/week. Story-sourcing, scripting, and upload-ready metadata in one package.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/dark-story-engine/checkout?plan=trial"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
              >
                Try One Video Package for $99
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#sample-outputs"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm"
              >
                See Sample Outputs
              </Link>
            </div>
          </motion.section>

          {/* Demo / Sample outputs */}
          <section id="sample-outputs" className="mt-24 scroll-mt-24">
            <div className="max-w-3xl mb-8">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                SAMPLE OUTPUTS
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                See what one topic becomes.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                Pick a sample channel below. Each output was generated from one video topic — narration script, title variants, thumbnail brief, description, pinned comment, Shorts teaser. This is what you get back, voice-matched to your channel.
              </p>
            </div>
            <DarkStoryDemo />
          </section>

          {/* Pain section */}
          <section className="mt-32 max-w-3xl">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              THE PAIN
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-6">
              The script is what is breaking your cadence.
            </h2>
            <p className="text-foreground/65 leading-relaxed mb-4">
              You can record. You can edit. You have a thumbnail style. What kills consistency is sitting down to write.
            </p>
            <p className="text-foreground/65 leading-relaxed mb-4">
              Every week — sometimes every other day — you have to find the next story, structure it for a 12-minute runtime, write a cold open that holds, pace the body so retention does not collapse at the 4-minute mark, write a CTA that does not feel forced, and then build a thumbnail concept and four title variants and a description and tags.
            </p>
            <p className="text-foreground/55 leading-relaxed">
              That work is two-thirds of what kills small channels. Not the recording. The blank page on Sunday night.
            </p>
          </section>

          {/* Deliverables */}
          <section className="mt-32">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                DELIVERABLES
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Every video package includes…
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                Six core outputs ship in every monthly tier. Engine and Authority add channel-level support — voice profile, content calendar, and (at Authority) thumbnail revisions and story-sourcing.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {deliverables.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-white/10 bg-black/20 p-4 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground/75">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Voice consistency */}
          <section className="mt-32 max-w-3xl">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              VOICE
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
              It still sounds like your channel.
            </h2>
            <p className="text-foreground/65 leading-relaxed mb-4">
              Most AI script generators produce content that gets demonetized fast — flat narration, generic pacing, the same opening hooks. We are not that. We work from your existing uploads to calibrate pacing, narration style, recurring phrases, and audience expectations. The script gets shaped to record cleanly in your voice.
            </p>
            <p className="text-foreground/65 leading-relaxed mb-6">
              Your audience does not know the script changed who wrote it. They just see new uploads on schedule.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: 'Calibrated to your archive', detail: 'We read your last three uploads before delivery one.' },
                { title: 'Pacing, not just words', detail: 'Where to slow down, where to drop the hook.' },
                { title: 'Voice profile updates monthly', detail: 'Tighter match by month two and beyond.' },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <Sparkles className="w-4 h-4 text-primary mb-2" />
                  <div className="text-sm font-semibold text-white mb-1">{item.title}</div>
                  <div className="text-xs text-foreground/55 leading-relaxed">{item.detail}</div>
                </div>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="mt-32">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                HOW IT WORKS
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Four steps from topic to upload-ready package.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {howItWorks.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                  className="rounded-xl border border-white/10 bg-black/20 p-6"
                >
                  <div className="w-9 h-9 rounded-full border border-primary/30 bg-primary/10 text-primary flex items-center justify-center font-mono text-xs mb-5">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{step.detail}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="mt-32 scroll-mt-24">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                PRICING
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Subscription pricing built for publishing cadence.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                Sits between DIY script generators and dedicated freelance writers ($300+ per script). Pay for the cadence you actually publish at, scope up at the next quarter if your channel grows.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {tiers.map((tier, i) => (
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
                  {tier.highlighted && (
                    <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-black text-[10px] font-mono tracking-widest font-semibold whitespace-nowrap">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-white mb-1">{tier.name}</h3>
                  <p className="text-xs text-foreground/55 mb-4">{tier.bestFor}</p>
                  <div className="mb-5 flex items-baseline gap-1 flex-wrap">
                    <span className="text-3xl font-bold text-white">{tier.price}</span>
                    <span className="text-sm text-foreground/50">{tier.cadence}</span>
                  </div>

                  <div className="rounded-lg border border-white/10 bg-black/30 p-3 mb-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/55">Volume</span>
                      <span className="text-white font-medium">{tier.videos.replace(' / month', '/mo')}</span>
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6 flex-1">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-foreground/70 leading-snug"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/dark-story-engine/checkout?plan=${tier.id}`}
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

            {/* Trial offer */}
            <div className="rounded-xl border border-white/10 bg-black/20 p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-1.5">
                  NOT READY TO COMMIT MONTHLY?
                </div>
                <h3 className="text-base font-semibold text-white mb-1">
                  Try one video package for $99.
                </h3>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  Send us one topic. Get the full 6-output package back. Decide whether subscription makes sense from the actual output, not the pitch.
                </p>
              </div>
              <Link
                href="/dark-story-engine/checkout?plan=trial"
                className="group inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-colors text-sm whitespace-nowrap shrink-0"
              >
                Start With One Video
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </section>

          {/* FAQ */}
          <section className="mt-32">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                FAQ
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Common questions.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {faqs.map((faq, i) => (
                <motion.div
                  key={faq.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: 0.05 * i }}
                >
                  <h3 className="text-base font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="mt-32">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-10 md:p-12 shadow-[0_0_40px_rgba(0,255,204,0.04)] text-center">
              <div className="max-w-2xl mx-auto">
                <Send className="w-8 h-8 text-primary mx-auto mb-5" />
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                  Send us one topic.
                </h2>
                <p className="text-foreground/60 leading-relaxed mb-8">
                  Get a full upload-ready video package back — script, titles, thumbnail brief, description, pinned comment, Shorts teaser. Voice-matched to your channel. Three business days. If it does not fit, you walk with the assets and no monthly commitment.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/dark-story-engine/checkout?plan=trial"
                    className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
                  >
                    Start With One Video ($99)
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="#pricing"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 glass border border-white/10 hover:bg-white/5 transition-all rounded-md text-foreground/80 font-medium text-sm"
                  >
                    Compare Subscription Plans
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Trust footnote */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3">
              <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white mb-0.5">3-day turnaround</div>
                <div className="text-xs text-foreground/55">From topic submission to upload-ready package.</div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white mb-0.5">You own everything</div>
                <div className="text-xs text-foreground/55">Scripts, briefs, metadata. No watermarks.</div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white mb-0.5">Cancel anytime</div>
                <div className="text-xs text-foreground/55">Month-to-month, one billing cycle of notice.</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
