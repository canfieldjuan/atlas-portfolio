import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Architecture Reference",
  description:
    "A representative production AI architecture: how ingestion, reasoning, orchestration, and outputs are scoped into one controlled, operator-trusted workflow.",
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
