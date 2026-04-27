import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Architecture Reference",
  description:
    "A representative architecture pattern for production AI systems. See how ingestion, reasoning, orchestration, and downstream outputs are scoped into a controlled workflow.",
  path: "/architecture",
});

export default function ArchitectureLayout({ children }: { children: React.ReactNode }) {
  return children;
}
