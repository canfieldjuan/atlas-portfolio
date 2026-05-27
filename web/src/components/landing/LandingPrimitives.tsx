'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────

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

// ── Shared UI primitives ───────────────────────────────────────────────────

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
      {children}
    </div>
  );
}

export function PrimaryCta({ cta }: { cta: DiagnosticLandingCta }) {
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

export function AnimatedCard({
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

export function Pipeline({ stages }: { stages: DiagnosticPipelineStage[] }) {
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

export function PricingTierCard({
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