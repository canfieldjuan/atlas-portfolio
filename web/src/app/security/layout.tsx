import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Security & Compliance",
  description:
    "Security approach, customer assurance options, and practical SOC 2 pathways. See what is available today, what can be staged, and how to qualify buyers based on compliance requirements.",
  path: "/security",
});

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
