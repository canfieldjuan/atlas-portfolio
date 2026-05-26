'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, HelpCircle, X } from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

export type DiagnosticLandingCta = {
  label: string;
  href: string;
};

export type DiagnosticPipelineStage = {
  label: string;
  sub?: string;
};

export type DiagnosticCard = {
  icon?: ReactNode;
  title: string;
  desc: string;
};

export type DiagnosticUseCase = {
  title: string;
  detail: string;
};

export type DiagnosticPricingTier = {
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

export type DiagnosticFaqItem = {
  q: string;
  a: string;
};

export type DiagnosticReportLandingPageConfig = {
  structuredData?: unknown;
  hero: {
    eyebrow: string;
    eyebrowIcon?: ReactNode;
    kicker?: string;
    title: string;
    intro: string;
    body: string;
    cta: DiagnosticLandingCta;
    artifact?: ReactNode;
  };
  featuredAnswer?: {
    id: string;
    label: string;
    title: string;
    description: string;
    artifact: ReactNode;
  };
  problem: {
    label: string;
    title: string;
    content: ReactNode;
  };
  solution: {
    label: string;
    title: string;
    content: ReactNode;
    processTitle: string;
    processDescription: string;
    stages: DiagnosticPipelineStage[];
  };
  comparison?: {
    id: string;
    label: string;
    title: string;
    description: string;
    artifact: ReactNode;
  };
  sample: {
    id: string;
    label: string;
    title: string;
    description: string;
    artifact: ReactNode;
  };
  deliverables: {
    id: string;
    label: string;
    title: string;
    description: string;
    items: DiagnosticCard[];
    constraintLabel: string;
    constraint: ReactNode;
  };
  audience: {
    label: string;
    title: string;
    description: string;
    items: DiagnosticUseCase[];
    constraintLabel: string;
    constraint: ReactNode;
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
  finalCta: {
    label: string;
    title: string;
    body: string[];
    cta: DiagnosticLandingCta;
    privacy: string;
  };
  faq: {
    id: string;
    label: string;
    title: string;
    description: string;
    items: DiagnosticFaqItem[];
  };
  footerCta: {
    cta: DiagnosticLandingCta;
    privacy: string;
  };
};

function jsonLdPayload(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
      {children}
    </div>
  );
}

function PrimaryCta({ cta }: { cta: DiagnosticLandingCta }) {
  return (
    <Link
      href={cta.href}
      className="group inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
    >
      {cta.label}
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </Link>
  );
}

function AnimatedCard({
  children,
  index,
  className = 'glass rounded-xl border border-border p-6',
}: {
  children: ReactNode;
  index: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, delay: 0.05 * index }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Pipeline({ stages }: { stages: DiagnosticPipelineStage[] }) {
  const gridStyle = { '--stage-count': stages.length } as CSSProperties;

  return (
    <div className="glass rounded-xl border border-border p-6 md:p-8">
      <div
        className="grid grid-cols-1 md:[grid-template-columns:repeat(var(--stage-count),minmax(0,1fr))] gap-3"
        style={gridStyle}
      >
        {stages.map((stage, index) => (
          <div key={stage.label} className="relative">
            <div className="rounded-lg border border-border bg-surface p-4 h-full">
              <div className="text-[10px] font-mono text-primary/70 mb-2">
                STEP {String(index + 1).padStart(2, '0')}
              </div>
              <div className="text-sm font-medium text-foreground leading-snug">{stage.label}</div>
              {stage.sub && (
                <div className="text-[11px] text-foreground/45 mt-1 font-mono">{stage.sub}</div>
              )}
            </div>
            {index < stages.length - 1 && (
              <div className="hidden md:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10">
                <ArrowRight className="w-3.5 h-3.5 text-primary/60" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PricingTierCard({
  tier,
  index,
}: {
  tier: DiagnosticPricingTier;
  index: number;
}) {
  const cardClassName = [
    'relative rounded-xl p-6 md:p-7 flex flex-col',
    tier.highlighted
      ? 'border border-primary/30 bg-primary/[0.04] shadow-[var(--primary-glow)]'
      : 'glass border border-border',
  ].join(' ');
  const descriptionClassName = [
    'text-sm text-foreground/65 leading-relaxed mb-5',
    tier.sla ? '' : 'mt-3',
  ].join(' ');
  const linkClassName = [
    'group inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md font-medium transition-colors text-sm',
    tier.highlighted
      ? 'bg-primary text-black hover:bg-primary/90'
      : 'border border-border text-foreground hover:bg-surface-hover',
  ].join(' ');

  return (
    <AnimatedCard index={index} className={cardClassName}>
      {tier.badge && (
        <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-primary text-black text-[10px] font-mono tracking-widest font-semibold whitespace-nowrap">
          {tier.badge}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-3">{tier.title}</h3>
      <div className="mb-1 flex items-baseline gap-2 flex-wrap">
        <span className="text-3xl font-bold text-foreground">{tier.price}</span>
        {tier.priceDetail && (
          <span className="text-sm text-foreground/50">{tier.priceDetail}</span>
        )}
      </div>
      {tier.sla && <p className="text-xs text-primary/80 font-mono mb-4">{tier.sla}</p>}
      <p className={descriptionClassName}>{tier.description}</p>

      <div className="text-[10px] font-mono text-foreground/40 tracking-widest mb-3">
        INCLUDES
      </div>
      <ul className="space-y-2 mb-5">
        {tier.includes.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-foreground/70 leading-snug">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="text-xs text-foreground/45 leading-relaxed mb-5 italic flex-1">
        {tier.note}
      </p>

      <Link href={tier.href} className={linkClassName}>
        {tier.cta}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </AnimatedCard>
  );
}

export function DiagnosticReportLandingPage({
  config,
}: {
  config: DiagnosticReportLandingPageConfig;
}) {
  return (
    <>
      {config.structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdPayload(config.structuredData) }}
        />
      )}
      <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <section
            className={
              config.hero.artifact
                ? 'grid gap-10 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)] lg:items-center'
                : 'max-w-4xl'
            }
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-3">
                {config.hero.eyebrowIcon}
                <span>{config.hero.eyebrow}</span>
              </div>
              {config.hero.kicker && (
                <p className="text-sm text-foreground/50 mb-6">{config.hero.kicker}</p>
              )}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6">
                {config.hero.title}
              </h1>
              <p className="text-lg text-foreground/65 leading-relaxed mb-5">{config.hero.intro}</p>
              <p className="text-base text-foreground/65 leading-relaxed mb-5">{config.hero.body}</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <PrimaryCta cta={config.hero.cta} />
              </div>
            </motion.div>

            {config.hero.artifact && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="min-w-0"
              >
                {config.hero.artifact}
              </motion.div>
            )}
          </section>

          {config.featuredAnswer && (
            <section
              id={config.featuredAnswer.id}
              className="section-band section-band-blue mt-32 scroll-mt-24"
            >
              <div className="max-w-3xl mb-10">
                <SectionLabel>{config.featuredAnswer.label}</SectionLabel>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
                  {config.featuredAnswer.title}
                </h2>
                <p className="text-foreground/65 leading-relaxed">
                  {config.featuredAnswer.description}
                </p>
              </div>
              {config.featuredAnswer.artifact}
            </section>
          )}

          <section className="section-band section-band-muted">
            <div className="max-w-4xl">
              <SectionLabel>{config.problem.label}</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
                {config.problem.title}
              </h2>
              {config.problem.content}
            </div>
          </section>

          <section className="section-band">
            <div className="max-w-3xl mb-10">
              <SectionLabel>{config.solution.label}</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-6">
                {config.solution.title}
              </h2>
              {config.solution.content}
            </div>

            <div className="max-w-3xl mb-6">
              <h3 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-3">
                {config.solution.processTitle}
              </h3>
              <p className="text-foreground/65 leading-relaxed">
                {config.solution.processDescription}
              </p>
            </div>

            <Pipeline stages={config.solution.stages} />
          </section>

          {config.comparison && (
            <section
              id={config.comparison.id}
              className="section-band section-band-muted scroll-mt-24"
            >
              <div className="grid gap-10 lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] lg:items-start">
                <div className="max-w-3xl lg:sticky lg:top-24">
                  <SectionLabel>{config.comparison.label}</SectionLabel>
                  <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
                    {config.comparison.title}
                  </h2>
                  <p className="text-foreground/65 leading-relaxed">
                    {config.comparison.description}
                  </p>
                </div>
                {config.comparison.artifact}
              </div>
            </section>
          )}

          <section id={config.sample.id} className="section-band section-band-blue scroll-mt-24">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-start">
              <div className="max-w-3xl lg:sticky lg:top-24">
                <SectionLabel>{config.sample.label}</SectionLabel>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
                  {config.sample.title}
                </h2>
                <p className="text-foreground/65 leading-relaxed">{config.sample.description}</p>
              </div>
              {config.sample.artifact}
            </div>
          </section>

          <section id={config.deliverables.id} className="section-band scroll-mt-24">
            <div className="max-w-3xl mb-10">
              <SectionLabel>{config.deliverables.label}</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
                {config.deliverables.title}
              </h2>
              <p className="text-foreground/65 leading-relaxed">{config.deliverables.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.deliverables.items.map((item, index) => (
                <AnimatedCard key={item.title} index={index}>
                  {item.icon && (
                    <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-5">
                      {item.icon}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{item.desc}</p>
                </AnimatedCard>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-border bg-surface p-6 max-w-3xl">
              <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
                {config.deliverables.constraintLabel}
              </div>
              {config.deliverables.constraint}
            </div>
          </section>

          <section className="section-band section-band-muted">
            <div className="max-w-3xl mb-10">
              <SectionLabel>{config.audience.label}</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
                {config.audience.title}
              </h2>
              <p className="text-foreground/65 leading-relaxed">{config.audience.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.audience.items.map((item, index) => (
                <AnimatedCard key={item.title} index={index}>
                  <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-3">
                    GOOD FIT {String(index + 1).padStart(2, '0')}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{item.detail}</p>
                </AnimatedCard>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-border bg-surface p-6 max-w-3xl">
              <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
                {config.audience.constraintLabel}
              </div>
              {config.audience.constraint}
            </div>
          </section>

          <section id={config.pricing.id} className="section-band scroll-mt-24">
            <div className="max-w-3xl mb-12">
              <SectionLabel>{config.pricing.label}</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
                {config.pricing.title}
              </h2>
              <p className="text-foreground/65 leading-relaxed">{config.pricing.description}</p>
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
              <ul className="space-y-2 text-sm text-foreground/65 leading-relaxed">
                {config.pricing.exclusions.map((exclusion) => (
                  <li key={exclusion} className="flex items-start gap-2">
                    <X className="w-3.5 h-3.5 text-foreground/40 shrink-0 mt-1" />
                    <span>{exclusion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="section-band section-band-blue">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-10 md:p-12 shadow-[var(--primary-glow)] text-center">
              <div className="max-w-2xl mx-auto">
                <SectionLabel>{config.finalCta.label}</SectionLabel>
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
                  {config.finalCta.title}
                </h2>
                <div className="text-foreground/65 leading-relaxed mb-8 space-y-4">
                  {config.finalCta.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <PrimaryCta cta={config.finalCta.cta} />
                </div>
                <p className="text-xs text-foreground/45 mt-6 leading-relaxed">
                  {config.finalCta.privacy}
                </p>
              </div>
            </div>
          </section>

          <section id={config.faq.id} className="section-band scroll-mt-24">
            <div className="max-w-3xl mb-10">
              <SectionLabel>{config.faq.label}</SectionLabel>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4">
                {config.faq.title}
              </h2>
              <p className="text-foreground/65 leading-relaxed">{config.faq.description}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              {config.faq.items.map((faq, index) => (
                <AnimatedCard key={faq.q} index={index} className="">
                  <div className="flex items-start gap-2 mb-2">
                    <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <h3 className="text-base font-semibold text-foreground">{faq.q}</h3>
                  </div>
                  <p className="text-sm text-foreground/60 leading-relaxed pl-6">{faq.a}</p>
                </AnimatedCard>
              ))}
            </div>
          </section>

          <section className="mt-16 text-center">
            <PrimaryCta cta={config.footerCta.cta} />
            <p className="text-xs text-foreground/45 mt-6 leading-relaxed">
              {config.footerCta.privacy}
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
