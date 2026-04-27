import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Capabilities — What I Build",
  description:
    "GTM automation, GraphRAG knowledge engines, agentic workflow orchestration, data pipelines, monitoring dashboards, edge AI, and voice systems. See the full range of AI systems I architect and deliver.",
  path: "/capabilities",
});

export default function CapabilitiesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
