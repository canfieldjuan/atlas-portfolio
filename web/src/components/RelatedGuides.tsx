import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";

import { getResourceArticle } from "@/lib/resources";

/**
 * Contextual internal links from a money page to the relevant resource
 * articles. Server-compatible (no client hooks), so it renders inside both
 * server and client pages. Passing internal links from the high-intent pages
 * is how the resource articles earn link equity and funnel buyers -- several
 * articles previously had zero links from any money page.
 */
export function RelatedGuides({
  slugs,
  heading = "Related guides",
}: {
  slugs: string[];
  heading?: string;
}) {
  const articles = slugs
    .map((slug) => getResourceArticle(slug))
    .filter((article): article is NonNullable<typeof article> => Boolean(article));

  if (articles.length === 0) {
    return null;
  }

  return (
    <section aria-label={heading} className="mt-24 max-w-5xl mx-auto">
      <h2 className="text-[10px] font-mono text-foreground/40 tracking-widest mb-6">
        {heading.toUpperCase()}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/resources/${article.slug}`}
            className="group glass rounded-xl p-6 border border-border hover:border-primary/30 hover:bg-surface-hover transition-all"
          >
            <div className="flex items-center gap-2 text-xs text-foreground/40 mb-3">
              <Clock className="w-3 h-3" />
              {article.readingMinutes} min read
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            <p className="text-sm text-foreground/60 leading-relaxed mb-4">
              {article.description}
            </p>
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              Read guide
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
