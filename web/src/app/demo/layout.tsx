import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Representative AI Workflows",
  description:
    "Representative AI workflow automation examples across revenue automation, knowledge systems, agent operations, data pipelines, and specialized real-time AI.",
  path: "/demo",
  keywords: [
    "AI workflow automation examples",
    "AI automation consultant",
    "custom AI workflows",
    "agent workflow automation",
    "AI data pipeline examples",
    "revenue automation workflow",
  ],
});

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
