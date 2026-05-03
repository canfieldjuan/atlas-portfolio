'use client';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Mic,
  Send,
  Sparkles,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { PodcastDemo } from '@/components/PodcastDemo';
import { generateFaqJsonLd } from '@/lib/seo';

type Tier = {
  id: 'starter' | 'growth' | 'authority';
  name: string;
  price: string;
  cadence: string;
  bestFor: string;
  episodes: string;
  assetsPerEpisode: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
};

const tiers: Tier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$497',
    cadence: '/month',
    bestFor: 'Biweekly business shows',
    episodes: '2 episodes / month',
    assetsPerEpisode: '6 assets per episode',
    features: [
      'Newsletter',
      'SEO blog post',
      'LinkedIn post',
      'X / Twitter thread',
      'Short-form script',
      'Pull quotes + promo captions',
      'Voice-matched delivery',
      '3 business day turnaround',
    ],
    cta: 'Start Starter',
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '$997',
    cadence: '/month',
    bestFor: 'Weekly business shows — most popular',
    episodes: '4 episodes / month',
    assetsPerEpisode: '6 assets per episode',
    features: [
      'Everything in Starter, plus:',
      'Voice profile (calibrated to your archive)',
      'Light content calendar',
      'Priority turnaround',
    ],
    highlighted: true,
    cta: 'Start Growth',
  },
  {
    id: 'authority',
    name: 'Authority',
    price: '$1,997',
    cadence: '/month',
    bestFor: 'Founder-led brands and authority-driven shows',
    episodes: '4–6 episodes / month',
    assetsPerEpisode: '8–10 assets per episode',
    features: [
      'Everything in Growth, plus:',
      'SEO keyword targeting',
      'LinkedIn carousel outline',
      'Monthly content strategy review',
      'Optional publishing / scheduling support',
    ],
    cta: 'Start Authority',
  },
];

const deliverables = [
  'Email newsletter',
  'SEO-friendly blog post',
  'LinkedIn post or carousel outline',
  'X / Twitter thread',
  'Short-form script (Shorts / Reels / TikTok)',
  'Pull quotes + promo captions',
  'Show notes',
  'Episode summary',
];

const howItWorks = [
  {
    title: 'Send the episode',
    detail: 'Paste your YouTube, Spotify, Apple Podcast, or RSS episode link. No upload required.',
  },
  {
    title: 'We pull out the strongest ideas',
    detail: 'We identify the episode’s best takeaways, arguments, stories, and quotable moments.',
  },
  {
    title: 'You get publish-ready assets',
    detail: 'Receive content formatted for email, blog, LinkedIn, X, and short-form video.',
  },
  {
    title: 'Review, edit, publish',
    detail: 'Use the assets as-is or make light edits. Voice-matched before delivery, every time.',
  },
];

const faqs: { q: string; a: string }[] = [
  {
    q: 'How does voice matching actually work?',
    a: 'We use the actual episode audio and transcript as the source — your phrasing, examples, and tone are pulled directly from what you said. Where we have to write transitional copy (subject lines, hooks, intros), it is calibrated against your previous episodes and sample posts. The result reads like you, because it was built from you.',
  },
  {
    q: 'Do you support video podcasts?',
    a: 'Yes. We work from any episode link — YouTube, Spotify Video, Riverside exports, RSS feeds with audio, or direct file uploads. Short-form scripts include shot direction notes when relevant.',
  },
  {
    q: 'What if I do not like an asset?',
    a: 'Every delivery includes one round of revisions per asset. If something does not match your voice or angle, send it back with notes and we refresh it. If a particular asset never works for your show, we drop it from your delivery package.',
  },
  {
    q: 'How fast can you turn around an episode?',
    a: 'Standard turnaround is 3 business days from when you send the link. Authority tier moves to priority turnaround (typically 1–2 business days). Rush is available for an add-on fee.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. The subscription is month-to-month. Cancel with one billing cycle of notice and we will deliver any episodes you have already sent us.',
  },
  {
    q: 'Do I keep ownership of the content?',
    a: 'Fully. Everything we deliver is yours — text, scripts, formats. No watermarks, no attribution required, no licensing tail.',
  },
];

const faqJsonLd = generateFaqJsonLd(
  faqs.map((f) => ({ question: f.q, answer: f.a })),
);

export default function PodcastRepurposingPage() {
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
              <Mic className="w-3 h-3" />
              <span>PODCAST REPURPOSING ENGINE</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05] mb-6">
              Turn one business podcast episode into{' '}
              <span className="gradient-text">a week of authority content.</span>
            </h1>
            <p className="text-lg text-foreground/65 leading-relaxed mb-4 max-w-3xl">
              Built for consultants, founders, and operators running business podcasts. We turn each episode into a newsletter, blog post, LinkedIn post, X thread, short-form script, and pull-quote pack — written in your voice and built from the actual episode.
            </p>
            <p className="text-sm text-foreground/45 leading-relaxed mb-8">
              For business, consulting, and founder-led shows where authority and trust are the buying signal — not vanity metrics.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/podcast-repurposing/checkout?plan=trial"
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
              >
                Try One Episode for $149
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

          {/* Demo / Sample outputs (the sales engine) */}
          <section id="sample-outputs" className="mt-24 scroll-mt-24">
            <div className="max-w-3xl mb-8">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                SAMPLE OUTPUTS
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                See what one episode becomes.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                Pick a sample show below. Each output below was generated from the actual episode — newsletter copy, blog post, LinkedIn, X thread, Shorts script. This is what you get back, voice-matched to your show.
              </p>
            </div>
            <PodcastDemo />
          </section>

          {/* Pain section */}
          <section className="mt-32 max-w-3xl">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
              THE PAIN
            </div>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-6">
              You already did the hard part.
            </h2>
            <p className="text-foreground/65 leading-relaxed mb-4">
              You recorded the episode. You had the conversation. You shared the insight.
            </p>
            <p className="text-foreground/65 leading-relaxed mb-4">
              But then the episode gets posted once… and dies. Maybe you share the link. Maybe you post a quick caption. Maybe you mean to turn it into more content later.
            </p>
            <p className="text-foreground/65 leading-relaxed mb-4">
              Later rarely happens.
            </p>
            <p className="text-foreground/55 leading-relaxed">
              That means your best ideas are trapped inside the episode — invisible to everyone who did not listen. That is what this fixes.
            </p>
          </section>

          {/* Deliverables */}
          <section className="mt-32">
            <div className="max-w-3xl mb-10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                DELIVERABLES
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4">
                Every episode can become…
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                Each tier ships a defined slice of the deliverable list below. Mix matches your show — coaching shows lean on LinkedIn carousels, news shows lean on X threads, founder shows lean on newsletter and Shorts.
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
              It still sounds like you.
            </h2>
            <p className="text-foreground/65 leading-relaxed mb-4">
              Most AI repurposing sounds like it was written by the same bland robot. We are not that. We use your episode, your phrasing, your positioning, and your preferred tone to create content that still sounds like you — just cleaned up, structured, and ready to publish.
            </p>
            <p className="text-foreground/65 leading-relaxed mb-6">
              Your voice stays intact. The content just becomes easier to publish.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: 'Built from the episode', detail: 'Not guessed from a prompt.' },
                { title: 'Your tone, not GPT’s', detail: 'Calibrated against your archive.' },
                { title: 'Voice-matched before delivery', detail: 'Reviewed before it ships.' },
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
                Four steps from episode to publish-ready assets.
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
                Simple monthly repurposing.
              </h2>
              <p className="text-foreground/60 leading-relaxed">
                Predictable monthly delivery. Cancel anytime with one billing cycle of notice. Every plan includes voice matching and one round of revisions per asset.
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
                      <span className="text-foreground/55">Episodes</span>
                      <span className="text-white font-medium">{tier.episodes.replace(' / month', '/mo')}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1.5">
                      <span className="text-foreground/55">Assets per episode</span>
                      <span className="text-white font-medium">{tier.assetsPerEpisode}</span>
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
                    href={`/podcast-repurposing/checkout?plan=${tier.id}`}
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
                  Try one episode for $149.
                </h3>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  Send us one episode. Get the full 5-asset package back. Decide whether subscription makes sense from the actual output, not the pitch.
                </p>
              </div>
              <Link
                href="/podcast-repurposing/checkout?plan=trial"
                className="group inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-colors text-sm whitespace-nowrap shrink-0"
              >
                Start With One Episode
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
                  Give us one episode.
                </h2>
                <p className="text-foreground/60 leading-relaxed mb-8">
                  Get a week of content back. Voice-matched, publish-ready, delivered in 3 business days. If it does not feel like a fit, you walk with the assets and no monthly commitment.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/podcast-repurposing/checkout?plan=trial"
                    className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
                  >
                    Start With One Episode ($149)
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
                <div className="text-xs text-foreground/55">Standard delivery from episode link to assets.</div>
              </div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-white mb-0.5">You own everything</div>
                <div className="text-xs text-foreground/55">No watermarks, no attribution required.</div>
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
