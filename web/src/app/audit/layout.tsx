import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Start the AI Systems Audit",
  description:
    "Submit a short AI Systems Audit brief. I review workflow, data, timeline, security, and budget fit personally before recommending a Phase 1 Roadmap.",
  path: "/audit",
  keywords: [
    "AI automation fit review",
    "AI systems audit",
    "AI automation consultant",
    "AI workflow automation consultant",
    "custom AI development services",
  ],
});

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
