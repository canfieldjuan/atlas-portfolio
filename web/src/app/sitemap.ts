import { MetadataRoute } from "next";
import { resourceArticles } from "@/lib/resources";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/ai-automation-consultant`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/capabilities`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/systems`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/systems/ai-content-ops`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/systems/ai-content-ops/ongoing-support`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${baseUrl}/systems/support-ticket-deflection`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/systems/support-ticket-deflection/demo`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/systems/support-ticket-deflection/playbook`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/systems/support-ticket-deflection/calculator`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/systems/atlas-llm-gateway`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/proof`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/process`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/resources`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    ...resourceArticles.map((article) => ({
      url: `${baseUrl}/resources/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    { url: `${baseUrl}/privacy`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/architecture`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/demo`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/audit`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}
