import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Process — From Inquiry to Live System",
  description:
    "Every AI systems engagement follows a transparent two-phase process: Phase 1 Roadmap (2 weeks, $4,500) and Phase 2 Custom Build (2–16 weeks, fixed price). See every step from discovery to deployment.",
  path: "/process",
});

export default function ProcessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
