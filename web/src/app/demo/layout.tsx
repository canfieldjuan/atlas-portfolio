import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Representative AI Workflows",
  description:
    "Representative AI workflow examples across revenue automation, knowledge systems, agent operations, data pipelines, and specialized real-time AI.",
  path: "/demo",
});

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
