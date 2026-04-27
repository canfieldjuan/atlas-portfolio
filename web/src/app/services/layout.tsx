import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Services & Pricing",
  description:
    "Fixed-price AI systems architecture. Phase 1 Roadmap is $4,500 flat. Phase 2 custom implementation ranges from $8,000 to $50,000+. No hourly billing, no surprise invoices.",
  path: "/services",
});

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
