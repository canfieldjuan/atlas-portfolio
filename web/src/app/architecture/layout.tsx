import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Architecture Reference",
  description:
    "A representative architecture pattern for production AI systems. See how ingestion, reasoning, orchestration, and downstream outputs are scoped into a controlled workflow.",
  path: "/architecture",
  keywords: [
    "AI system architecture",
    "production AI pipeline architecture",
    "AI workflow architecture",
    "AI ingestion and retrieval architecture",
    "AI system blueprint",
    "evidence-backed AI retrieval",
    "AI orchestration architecture",
    "LLM system design",
    "production AI design pattern",
  ],
});

export default function ArchitectureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
