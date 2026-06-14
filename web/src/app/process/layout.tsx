import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Process — From Inquiry to Live System",
  description:
    "The transparent two-phase AI engagement: Phase 1 Roadmap (2 weeks, $4,500) and Phase 2 Custom Build (fixed price), every step from discovery to deployment.",
  path: "/process",
  keywords: [
    "AI consulting engagement process",
    "Phase 1 AI roadmap",
    "AI systems roadmap engagement",
    "fixed-fee AI build process",
    "AI consulting milestones",
    "AI scoping process",
    "custom AI development process",
    "AI proof of concept timeline",
    "AI project delivery process",
  ],
});

export default function ProcessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
