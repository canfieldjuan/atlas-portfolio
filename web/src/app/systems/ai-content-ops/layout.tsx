import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "AI Content Ops Station",
  description:
    "AI Content Ops Station turns structured business data — CRM notes, customer reviews, sales calls, and internal docs — into approval-ready blogs, email campaigns, sales briefs, reports, landing page copy, and social content. Reasoning, quality gates, and human review built in.",
  path: "/systems/ai-content-ops",
  keywords: [
    "AI content operations",
    "AI content pipeline",
    "AI content generation system",
    "structured AI content workflow",
    "AI content automation for B2B",
    "AI sales briefs",
    "AI email campaign generation",
    "AI report generation",
    "AI landing page copy",
    "human in the loop content review",
    "evidence backed AI content",
    "productized AI content service",
  ],
});

export default function AiContentOpsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
