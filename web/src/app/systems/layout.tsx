import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";
import { jsonLdScriptPayload } from "@/lib/json-ld";

export const metadata = generatePageMetadata({
  title: "Productized AI Systems",
  description:
    "Prebuilt AI system architectures, the Competitive/Vendor Intelligence Platform and AI Content Ops Station. Bring your data and workflows; we customize.",
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

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Systems", path: "/systems" },
]);

export default function SystemsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptPayload(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
