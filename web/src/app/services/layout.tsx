import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "AI Automation Consulting Services & Pricing",
  description:
    "AI automation consultant services for custom AI development, workflow automation, and AI systems architecture. Phase 1 Roadmap is $4,500 flat; Phase 2 implementation is fixed-price.",
  path: "/services",
  keywords: [
    "AI automation consultant",
    "AI consulting services",
    "custom AI development services",
    "AI workflow automation consultant",
    "AI systems consultant",
    "fixed-fee AI roadmap",
  ],
});

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
