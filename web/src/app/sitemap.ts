import { MetadataRoute } from "next";
import { resourceArticles } from "@/lib/resources";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;

  return [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/ai-automation-consultant`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/capabilities`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/systems`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/systems/ai-content-ops`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/systems/ai-content-ops/ongoing-support`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${baseUrl}/systems/support-ticket-deflection`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/systems/support-ticket-deflection/snapshot`, changeFrequency: "monthly", priority: 0.82 },
    { url: `${baseUrl}/systems/support-ticket-deflection/demo`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/systems/support-ticket-deflection/playbook`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/systems/support-ticket-deflection/calculator`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/systems/support-ticket-deflection/support-tax`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/systems/atlas-llm-gateway`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/proof`, changeFrequency: "monthly", priority: 0.85 },
    { url: `${baseUrl}/services`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/process`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/resources`, changeFrequency: "monthly", priority: 0.75 },
    ...resourceArticles.map((article) => ({
      url: `${baseUrl}/resources/${article.slug}`,
      lastModified: new Date(article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.65,
    })),
    { url: `${baseUrl}/privacy`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/security`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${baseUrl}/architecture`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/demo`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/audit`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
