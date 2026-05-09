/**
 * SEO / GEO / AEO Configuration
 *
 * Central configuration for all search optimization across the site.
 * When adding a new page, add its config here FIRST, then reference it
 * in the page's layout.tsx.
 *
 * SEO  = Search Engine Optimization (Google, Bing)
 * GEO  = Generative Engine Optimization (ChatGPT, Perplexity, Google AI Overviews)
 * AEO  = Answer Engine Optimization (Featured snippets, direct answer boxes)
 */

import type { Metadata } from "next";

// ─────────────────────────────────────────────
// Site-wide constants
// ─────────────────────────────────────────────

export const SITE_URL = "https://juancanfield.com";
export const SITE_NAME = "Juan Canfield";
export const SITE_TITLE = "Juan Canfield | AI Solutions Architect & AI Automation Consultant";
export const SITE_DESCRIPTION =
  "AI automation consultant and AI solutions architect for teams with real operational workflows. Fixed-fee AI systems roadmaps, custom AI development, proof of concept, pricing, and delivery scope are defined before build work begins.";
export const SITE_KEYWORDS = [
  "AI solutions architect",
  "AI automation consultant",
  "AI workflow automation consultant",
  "custom AI development services",
  "custom AI software development",
  "AI implementation consultant",
  "AI systems consultant",
  "AI consultant for startups",
  "remote AI consultant",
  "fixed-fee AI roadmap",
  "AI systems roadmap",
  "AI systems roadmap consultant",
  "business AI automation consultant",
  "agent workflow automation",
  "GraphRAG consultant",
  "LLM orchestration",
  "data pipeline automation",
  "revenue operations automation",
  "productized AI systems",
  "competitive intelligence platform",
  "vendor intelligence platform",
  "AI content generation pipeline",
];

// ─────────────────────────────────────────────
// Metadata helper
// ─────────────────────────────────────────────

interface PageSEO {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  /** Optional override for Open Graph title (defaults to `${title} | Juan Canfield`) */
  ogTitle?: string;
  /** Optional override for OG description (defaults to description) */
  ogDescription?: string;
}

/**
 * Generate consistent Metadata for any page.
 *
 * Usage in a page's layout.tsx:
 * ```ts
 * import { generatePageMetadata } from "@/lib/seo";
 * export const metadata = generatePageMetadata({
 *   title: "My Page Title",
 *   description: "A clear description with target keywords.",
 *   path: "/my-page",
 * });
 * ```
 */
export function generatePageMetadata({
  title,
  description,
  path,
  keywords,
  ogTitle,
  ogDescription,
}: PageSEO): Metadata {
  const url = `${SITE_URL}${path}`;
  const ogImage = `${SITE_URL}/opengraph-image`;

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: ogTitle ?? `${title} | ${SITE_NAME}`,
      description: ogDescription ?? description,
      url,
      siteName: SITE_NAME,
      locale: "en_US",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? `${title} | ${SITE_NAME}`,
      description: ogDescription ?? description,
      images: [ogImage],
    },
  };
}

// ─────────────────────────────────────────────
// JSON-LD Structured Data Generators (GEO + AEO)
// ─────────────────────────────────────────────

/**
 * Person + ProfessionalService schema.
 * Injected once in the root layout.
 */
export const rootJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Juan Canfield",
      url: SITE_URL,
      jobTitle: "AI Solutions Architect",
      description:
        "AI Solutions Architect and AI automation consultant specializing in operational workflows, data systems, agent orchestration, and fixed-fee roadmap engagements for custom AI builds.",
      knowsAbout: [
        "Artificial Intelligence",
        "AI Automation Consulting",
        "AI Workflow Automation",
        "Custom AI Development Services",
        "AI Systems Consulting",
        "AI Consultant for Startups",
        "Remote AI Consulting",
        "Systems Architecture",
        "Data Pipeline Engineering",
        "Competitive Intelligence Automation",
        "Vendor Intelligence Systems",
        "AI Content Ops Station",
        "AI Content Generation Pipelines",
        "GraphRAG",
        "LangGraph",
        "MCP Servers",
        "Workflow Automation",
        "LLM Orchestration",
        "Computer Vision",
        "Voice AI",
        "Python",
        "TypeScript",
        "FastAPI",
        "PostgreSQL",
        "Neo4j",
        "React",
        "Next.js",
      ],
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      founder: { "@id": `${SITE_URL}/#person` },
      sameAs: [`${SITE_URL}/about`],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_TITLE,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-US",
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "Juan Canfield AI Solutions",
      url: SITE_URL,
      provider: { "@id": `${SITE_URL}/#person` },
      description:
        "AI automation consulting, custom AI development services, fixed-fee AI systems roadmap engagements, and productized AI Content Ops audits. Phase 1 Roadmap ($4,500) covers custom AI scoping; Content Ops Audit ($1,500) evaluates content automation fit before pilot or full-system build work begins.",
      areaServed: ["United States", "Worldwide"],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "AI Automation and Architecture Services",
        itemListElement: [
          {
            "@type": "Offer",
            name: "AI Systems Roadmap (Phase 1)",
            description:
              "2-week flat-fee engagement including discovery session, system audit, technical blueprint, working proof of concept, and fixed-price Phase 2 proposal.",
            price: "4500",
            priceCurrency: "USD",
          },
          {
            "@type": "Offer",
            name: "Custom Implementation (Phase 2)",
            description:
              "Fixed-price build scoped from the Phase 1 blueprint. Includes milestone-based delivery, integration, documentation, and 30-60 days post-launch support.",
            priceSpecification: {
              "@type": "PriceSpecification",
              minPrice: "8000",
              maxPrice: "50000",
              priceCurrency: "USD",
            },
          },
          {
            "@type": "Offer",
            name: "Productized AI Systems",
            description:
              "Reusable AI system architectures including the Competitive / Vendor Intelligence Platform and AI Content Ops Station, customized with the buyer's data, sources, workflows, and integrations.",
          },
          {
            "@type": "Offer",
            name: "Content Ops Audit",
            description:
              "48-hour fixed-fee audit for AI Content Ops fit, source material readiness, content workflow scope, and pilot build recommendation.",
            price: "1500",
            priceCurrency: "USD",
          },
          {
            "@type": "Offer",
            name: "AI Content Ops Pilot Build",
            description:
              "Pilot build for one AI content workflow using buyer data sources, approval gates, templates, and export or delivery workflow.",
            priceSpecification: {
              "@type": "PriceSpecification",
              minPrice: "7500",
              priceCurrency: "USD",
            },
          },
        ],
      },
    },
  ],
};

/**
 * Generate FAQPage JSON-LD schema for AEO.
 *
 * Usage:
 * ```ts
 * const faqSchema = generateFaqJsonLd([
 *   { question: "How much?", answer: "$4,500 for Phase 1." },
 * ]);
 * ```
 */
export function generateFaqJsonLd(
  faqs: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function generateArticleJsonLd({
  title,
  description,
  path,
  publishedAt,
  modifiedAt,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  publishedAt: string;
  modifiedAt?: string;
  keywords?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${SITE_URL}${path}`,
    mainEntityOfPage: `${SITE_URL}${path}`,
    datePublished: publishedAt,
    dateModified: modifiedAt ?? publishedAt,
    author: {
      "@type": "Person",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Person",
      name: SITE_NAME,
      url: SITE_URL,
    },
    keywords,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "[data-speakable]"],
    },
  };
}

/**
 * Generate BreadcrumbList JSON-LD schema.
 *
 * Usage:
 * ```ts
 * const breadcrumbs = generateBreadcrumbJsonLd([
 *   { name: "Home", path: "/" },
 *   { name: "Services", path: "/services" },
 * ]);
 * ```
 */
export function generateBreadcrumbJsonLd(
  items: { name: string; path: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
