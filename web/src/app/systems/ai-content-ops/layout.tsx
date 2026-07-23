import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Content Ops — Productized Content Systems From Your Own Data",
  description:
    "Content Ops turns your business data into publish-ready content your team reviews and approves. Start with the Resolution Audit, then expand.",
  path: "/systems/ai-content-ops",
  keywords: [
    "AI content operations",
    "productized content system",
    "AI content pipeline",
    "evidence backed AI content",
    "structured AI content workflow",
    "support ticket deflection",
    "content ops audit",
    "human reviewed AI content",
    "SEO content production system",
    "comparison page generation",
  ],
});

export default function AiContentOpsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
