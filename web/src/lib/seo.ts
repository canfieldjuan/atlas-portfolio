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
export const SITE_TITLE = "Juan Canfield | AI Solutions Architect";
export const SITE_DESCRIPTION =
  "Fixed-fee AI systems roadmaps and custom implementation for teams with real operational workflows. Architecture, proof of concept, pricing, and delivery scope are defined before build work begins.";

// ─────────────────────────────────────────────
// Metadata helper
// ─────────────────────────────────────────────

interface PageSEO {
  title: string;
  description: string;
  path: string;
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
  ogTitle,
  ogDescription,
}: PageSEO): Metadata {
  const url = `${SITE_URL}${path}`;

  return {
    title,
    description,
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
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle ?? `${title} | ${SITE_NAME}`,
      description: ogDescription ?? description,
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
        "AI Solutions Architect specializing in operational workflows, data systems, agent orchestration, and fixed-fee roadmap engagements for custom AI builds.",
      knowsAbout: [
        "Artificial Intelligence",
        "Systems Architecture",
        "Data Pipeline Engineering",
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
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: "Juan Canfield AI Solutions",
      url: SITE_URL,
      provider: { "@id": `${SITE_URL}/#person` },
      description:
        "Fixed-fee AI systems roadmap and custom implementation. Phase 1 Roadmap ($4,500) includes discovery, audit, proof of concept, and blueprint. Phase 2 custom implementation is scoped from the roadmap before build work begins.",
      areaServed: "Worldwide",
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "AI Architecture Services",
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
