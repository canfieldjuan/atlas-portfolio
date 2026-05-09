import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Security & Compliance",
  description:
    "Security approach, customer assurance options, and practical SOC 2 pathways. See what is available today, what can be staged, and how to qualify buyers based on compliance requirements.",
  path: "/security",
  keywords: [
    "AI consulting security and compliance",
    "SOC 2 AI consulting",
    "AI vendor security questionnaire",
    "AI deployment model security",
    "AI consultant compliance",
    "AI data handling security",
    "secure AI implementation",
    "AI procurement security",
    "on-premise AI deployment",
  ],
});

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
