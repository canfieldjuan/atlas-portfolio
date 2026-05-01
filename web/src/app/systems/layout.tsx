import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Productized AI Systems",
  description:
    "Prebuilt AI system architectures: the Competitive / Vendor Intelligence Platform and AI Content Ops Station. Bring your data and workflows; customize the implementation around your business.",
  path: "/systems",
  keywords: [
    "productized AI systems",
    "competitive intelligence platform",
    "vendor intelligence platform",
    "AI content generation pipeline",
    "AI content automation",
    "competitive intelligence automation",
    "vendor intelligence automation",
    "custom AI platform implementation",
  ],
});

export default function SystemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
