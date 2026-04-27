import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Representative AI Build Proof",
  description:
    "Representative AI automation and custom AI development build examples showing problems, inputs, systems, outputs, roadmap deliverables, and implementation scope.",
  path: "/proof",
  keywords: [
    "AI automation examples",
    "custom AI development examples",
    "AI workflow automation proof",
    "AI systems roadmap examples",
    "AI consultant case studies",
    "AI implementation examples",
  ],
});

export default function ProofLayout({ children }: { children: React.ReactNode }) {
  return children;
}
