import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Representative AI Build Proof",
  description:
    "Representative AI automation and custom AI development builds: the problem, inputs, system, outputs, and implementation scope for each.",
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
