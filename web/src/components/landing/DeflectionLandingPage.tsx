'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  AnimatedCard,
  Pipeline,
  PricingTierCard,
  PrimaryCta,
  SectionLabel,
  type DiagnosticFaqItem,
  type DiagnosticLandingCta,
  type DiagnosticPipelineStage,
  type DiagnosticPricingTier,
} from './LandingPrimitives';
import { DeflectionDemo } from '@/components/deflection-demo/DeflectionDemo';
import { SupportTaxMiniCalculator } from '@/components/deflection-demo/SupportTaxMiniCalculator';

// ── Config type ────────────────────────────────────────────────────────────

export type DeflectionLandingPageConfig = {
  structuredData?: unknown;
  hero: {
    eyebrow: string;
    eyebrowIcon?: ReactNode;
    title: string;
    intro: string;
    body: string;
    cta: DiagnosticLandingCta;
  };
  problemAgitation: {
    label: string;
    title: string;
    content: ReactNode;
  };
  problemCost: {
    label: string;
    title: string;
    content: ReactNode;
  };
  calculator?: boolean;
  currentWayVsThisWay: {
    label: string;
    title: string;
    content: ReactNode;
  };
  mechanism: {
    label: string;
    title: string;
    content: ReactNode;
    processTitle: string;
    processDescription: string;
    stages: DiagnosticPipelineStage[];
  };
  demo: {
    label: string;
    title: string;
    description: string;
  };
  seoVisibility: {
    label: string;
    title: string;
    content: ReactNode;
  };
  proofStack: {
    label: string;
    title: string;
    content: ReactNode;
  };
  offer: {
    label: string;
    title: string;
    content: ReactNode;
  };
  riskReversal: {
    label: string;
    title: string;
    content: ReactNode;
  };
  finalCta: {
    label: string;
    title: string;
    body: string[];
    cta: DiagnosticLandingCta;
    privacy: string;
  };
  pricing: {
    id: string;
    label: string;
    title: string;
    description: string;
    tiers: DiagnosticPricingTier[];
    constraintLabel: string;
    exclusions: string[];
  };
  faq: {
    id: string;
    label: string;
    title: string;
    description: string;
    items: DiagnosticFaqItem[];
  };
};

function jsonLdPayload(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

// ── Component ──────────────────────────────────────────────────────────────

export function DeflectionLandingPage({
  config,
  bare = false,
}: {
  config: DeflectionLandingPageConfig;
  // When true the global menu/footer are hidden for this route (see SiteChrome),
  // so drop the nav-clearance top padding that would otherwise leave a gap.
  bare?: boolean;
}) {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  return (
    <>
      {config.structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdPayload(config.structuredData) }}
        />
      )}
      <main className={`deflection-landing min-h-screen ${bare ? 'pt-16' : 'pt-32'} pb-20 px-6 relative z-10`}>
        <div className="max-w-6xl mx-auto">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              data-smoke="productEyebrow"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-3"
            >
              {config.hero.eyebrowIcon}
              <span>{config.hero.eyebrow}</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
              {config.hero.title}
            </h1>
            <p className="text-lg text-foreground/65 leading-relaxed mb-5">
              {config.hero.intro}
            </p>
            <p className="text-base text-foreground/65 leading-relaxed mb-5">
              {config.hero.body}
            </p>
            <div data-smoke="snapshotCta" className="flex flex-col sm:flex-row gap-3">
              <PrimaryCta cta={config.hero.cta} />
            </div>
          </motion.div>
        </section>

        {/* ── Problem Agitation ─────────────────────────────────────── */}
        <section className="section-band section-band-muted mt-32">
          <div className="max-w-4xl">
            <SectionLabel>{config.problemAgitation.label}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              {config.problemAgitation.title}
            </h2>
            {config.problemAgitation.content}
          </div>
        </section>

        {/* ── Problem Cost ──────────────────────────────────────────── */}
        <section className="section-band">
          <div className="max-w-4xl">
            <SectionLabel>{config.problemCost.label}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              {config.problemCost.title}
            </h2>
            {config.problemCost.content}
          </div>
        </section>

        {config.calculator && (
          <section className="section-band !py-12 md:!py-16">
            <SupportTaxMiniCalculator />
          </section>
        )}

        {/* ── Current Way vs This Way ───────────────────────────────── */}
        <section className="section-band section-band-muted">
          <div className="max-w-4xl">
            <SectionLabel>{config.currentWayVsThisWay.label}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              {config.currentWayVsThisWay.title}
            </h2>
            {config.currentWayVsThisWay.content}
          </div>
        </section>

        {/* ── Mechanism ─────────────────────────────────────────────── */}
        <section className="section-band">
          <div className="max-w-3xl mb-10">
            <SectionLabel>{config.mechanism.label}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              {config.mechanism.title}
            </h2>
            {config.mechanism.content}
          </div>

          <div className="max-w-3xl mb-6">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
              {config.mechanism.processTitle}
            </h3>
            <p className="text-foreground/65 leading-relaxed">
              {config.mechanism.processDescription}
            </p>
          </div>

          <Pipeline stages={config.mechanism.stages} />
        </section>

        {/* ── Demo ─────────────────────────────────────────────────── */}
        <section className="section-band">
          <div className="max-w-3xl mb-10">
            <SectionLabel>{config.demo.label}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              {config.demo.title}
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              {config.demo.description}
            </p>
          </div>

          <DeflectionDemo />
        </section>

        {/* ── Offer ─────────────────────────────────────────────────── */}
        <section className="section-band section-band-muted">
          <div className="max-w-4xl">
            <SectionLabel>{config.offer.label}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              {config.offer.title}
            </h2>
            {config.offer.content}
          </div>
        </section>

        {/* ── SEO / Search Visibility ───────────────────────────────── */}
        <section className="section-band section-band-blue">
          <div className="max-w-4xl">
            <SectionLabel>{config.seoVisibility.label}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              {config.seoVisibility.title}
            </h2>
            {config.seoVisibility.content}
          </div>
        </section>

        {/* ── Proof Stack ───────────────────────────────────────────── */}
        <section className="section-band">
          <div className="max-w-4xl">
            <SectionLabel>{config.proofStack.label}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              {config.proofStack.title}
            </h2>
            {config.proofStack.content}
          </div>
        </section>

        {/* ── Risk Reversal ─────────────────────────────────────────── */}
        <section className="section-band">
          <div className="max-w-4xl">
            <SectionLabel>{config.riskReversal.label}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              {config.riskReversal.title}
            </h2>
            {config.riskReversal.content}
          </div>
        </section>

        {/* ── Final CTA ─────────────────────────────────────────────── */}
        <section className="section-band section-band-blue">
          <div className="max-w-3xl mx-auto text-center">
            <SectionLabel>{config.finalCta.label}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
              {config.finalCta.title}
            </h2>
            {config.finalCta.body.map((p, i) => (
              <p key={i} className="text-foreground/65 leading-relaxed mb-4">
                {p}
              </p>
            ))}
            <div className="flex justify-center mt-6">
              <PrimaryCta cta={config.finalCta.cta} />
            </div>
            <p className="text-xs text-foreground/40 mt-4">{config.finalCta.privacy}</p>
          </div>
        </section>

        {/* ── Pricing ───────────────────────────────────────────────── */}
        <section id={config.pricing.id} data-smoke="pricing" className="section-band scroll-mt-24">
          <div className="max-w-3xl mb-12">
            <SectionLabel>{config.pricing.label}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              {config.pricing.title}
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              {config.pricing.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {config.pricing.tiers.map((tier, index) => (
              <PricingTierCard key={tier.id} tier={tier} index={index} />
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-border bg-surface p-6 max-w-3xl">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              {config.pricing.constraintLabel}
            </div>
            <ul className="space-y-1.5">
              {config.pricing.exclusions.map((item) => (
                <li key={item} className="text-sm text-foreground/55 leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────── */}
        <section id={config.faq.id} className="section-band section-band-muted scroll-mt-24">
          <div className="max-w-3xl mb-10">
            <SectionLabel>{config.faq.label}</SectionLabel>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
              {config.faq.title}
            </h2>
            <p className="text-foreground/65 leading-relaxed">
              {config.faq.description}
            </p>
          </div>

          <div className="max-w-3xl space-y-3">
            {config.faq.items.map((item, index) => {
              const isOpen = openFaqIndex === index;
              const buttonId = `${config.faq.id}-question-${index}`;
              const answerId = `${config.faq.id}-answer-${index}`;

              return (
                <AnimatedCard key={item.q} index={index}>
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      className="flex w-full items-start justify-between gap-4 text-left text-base font-semibold text-foreground"
                      aria-expanded={isOpen}
                      aria-controls={answerId}
                      onClick={() => setOpenFaqIndex(isOpen ? -1 : index)}
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`mt-0.5 h-4 w-4 shrink-0 text-foreground/45 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>
                  <div
                    id={answerId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                    className="mt-3 border-t border-border/70 pt-3"
                  >
                    <p className="text-sm text-foreground/60 leading-relaxed">{item.a}</p>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        </section>

        {/* ── Footer CTA ────────────────────────────────────────────── */}
        <div className="mt-20 text-center">
          <PrimaryCta cta={config.finalCta.cta} />
          <p className="text-xs text-foreground/40 mt-4">{config.finalCta.privacy}</p>
        </div>
        </div>
      </main>
    </>
  );
}
