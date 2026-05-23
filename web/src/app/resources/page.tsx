import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, Tag } from 'lucide-react';
import { resourceArticles } from '@/lib/resources';

export default function ResourcesPage() {
  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wide mb-6">
            <BookOpen className="w-3 h-3" />
            <span>FIELD NOTES</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            Practical notes for scoping AI automation work.
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed">
            These resources are written for buyers who are deciding whether to hire an AI automation consultant, buy another SaaS tool, or scope a custom AI development project. The goal is to make the decision sharper before any build work starts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {resourceArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/resources/${article.slug}`}
              className="group glass rounded-xl p-8 border border-border hover:border-primary/30 hover:bg-surface-hover transition-all"
            >
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/15 px-3 py-1 text-[10px] font-mono tracking-widest text-primary/90">
                  <Tag className="w-3 h-3" />
                  {article.category.toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-2 text-xs text-foreground/40">
                  <Clock className="w-3 h-3" />
                  {article.readingMinutes} min read
                </span>
              </div>
              <h2 className="text-2xl font-semibold text-foreground mb-4 group-hover:text-primary transition-colors">
                {article.title}
              </h2>
              <p className="text-sm text-foreground/60 leading-relaxed mb-6">
                {article.description}
              </p>
              <div className="flex items-center gap-2 text-sm text-primary font-medium">
                Read resource
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 rounded-xl border border-primary/20 bg-primary/5 p-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-semibold text-foreground mb-2">Need help turning this into a real scope?</h2>
            <p className="text-sm text-foreground/60 leading-relaxed">
              The Phase 1 Roadmap turns a workflow idea into architecture, proof of concept, risk notes, and a fixed-price implementation proposal.
            </p>
          </div>
          <Link
            href="/services"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
          >
            Review Services
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
