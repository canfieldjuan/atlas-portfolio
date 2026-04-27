import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Capabilities — What I Build",
  description:
    "Custom AI development capabilities for GTM automation, GraphRAG knowledge engines, agentic workflow orchestration, data pipelines, monitoring dashboards, edge AI, and voice systems.",
  path: "/capabilities",
  keywords: [
    "custom AI development services",
    "AI workflow automation",
    "GraphRAG consultant",
    "agentic workflow orchestration",
    "data pipeline automation",
    "revenue operations automation",
    "edge AI systems",
  ],
});

export default function CapabilitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
