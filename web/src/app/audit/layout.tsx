import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Book a Content Ops Audit or AI Fit Review",
  description:
    "Submit a short brief to book the Content Ops Audit ($1,500, 2 business days) or request a fit review for a larger AI automation engagement. Reviewed personally within 48 hours.",
  path: "/audit",
  keywords: [
    "Content Ops Audit",
    "AI content audit",
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
