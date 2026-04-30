import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { generateArticleJsonLd, generateBreadcrumbJsonLd, generatePageMetadata } from '@/lib/seo';
import { getResourceArticle, resourceArticles } from '@/lib/resources';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return resourceArticles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getResourceArticle(slug);

  if (!article) {
    return generatePageMetadata({
      title: 'Resource Not Found',
      description: 'The requested AI automation resource could not be found.',
      path: '/resources',
    });
  }

  return generatePageMetadata({
    title: article.title,
    description: article.description,
    path: `/resources/${article.slug}`,
    keywords: article.keywords,
  });
}

export default async function ResourceArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = getResourceArticle(slug);

  if (!article) {
    notFound();
  }

  const articleJsonLd = generateArticleJsonLd({
    title: article.title,
    description: article.description,
    path: `/resources/${article.slug}`,
    publishedAt: article.publishedAt,
    keywords: article.keywords,
  });
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Resources', path: '/resources' },
    { name: article.title, path: `/resources/${article.slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
        <article className="max-w-4xl mx-auto">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-primary transition-colors mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to resources
          </Link>

          <header className="mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-[10px] font-mono tracking-widest text-primary/90">
                {article.category.toUpperCase()}
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-foreground/40">
                <Clock className="w-3 h-3" />
                {article.readingMinutes} min read
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-white mb-6">
              {article.title}
            </h1>
            <p className="text-lg text-foreground/60 leading-relaxed">
              {article.description}
            </p>
          </header>

          <section className="glass rounded-xl p-8 border border-white/10 mb-12">
            <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-5">
              KEY TAKEAWAYS
            </div>
            <div className="space-y-4">
              {article.takeaways.map((takeaway) => (
                <div key={takeaway} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/70 leading-relaxed">{takeaway}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="space-y-12">
            {article.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold text-white mb-5">{section.heading}</h2>
                <div className="space-y-5">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-base text-foreground/65 leading-8">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {article.relatedLinks && article.relatedLinks.length > 0 ? (
            <section className="mt-14 glass rounded-xl p-8 border border-white/10">
              <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-5">
                RELATED NEXT STEP
              </div>
              <div className="space-y-4">
                {article.relatedLinks.map((related) => (
                  <Link
                    key={related.href}
                    href={related.href}
                    className="block rounded-lg border border-white/10 bg-black/20 p-5 hover:border-primary/30 hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-white mb-2">{related.label}</h2>
                        <p className="text-sm text-foreground/60 leading-relaxed">{related.detail}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-1" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <footer className="mt-16 rounded-xl border border-primary/20 bg-primary/5 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-2xl">
                <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
                  NEXT STEP
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Turn the idea into a scoped build decision.
                </h2>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  Phase 1 maps the workflow, validates the riskiest assumption, and defines a fixed-price implementation scope before build work begins.
                </p>
              </div>
              <Link
                href="/audit"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary text-black font-medium rounded-md hover:bg-primary/90 transition-all text-sm"
              >
                Start Systems Audit
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </footer>
        </article>
      </main>
    </>
  );
}
