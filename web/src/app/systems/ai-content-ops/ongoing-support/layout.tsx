import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Ongoing Optimization for AI Content Ops",
  description:
    "Productized monthly retainer that keeps an AI content workflow tuned as your business changes. Prompt and template tuning, integration updates, quality gate improvements, monthly performance reporting. Starts at $2,500/month.",
  path: "/systems/ai-content-ops/ongoing-support",
  keywords: [
    "AI content workflow maintenance",
    "AI content retainer",
    "ongoing AI optimization",
    "AI content tuning service",
    "AI prompt and workflow tuning retainer",
    "AI content operations support",
    "managed AI content workflow",
    "AI content quality gate maintenance",
  ],
});

export default function OngoingSupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
