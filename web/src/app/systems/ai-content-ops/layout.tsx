import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Content Ops — Productized Content Systems From Your Own Data",
  description:
    "Content Ops turns your business data into publish-ready content your team reviews and approves. Start with the Support Ticket Deflection Report, then expand.",
  path: "/systems/ai-content-ops",
  keywords: [
    "AI content operations",
    "productized content system",
    "AI content pipeline",
    "evidence backed AI content",
    "structured AI content workflow",
    "support ticket deflection",
    "content ops audit",
    "human reviewed AI content",
    "SEO content production system",
    "comparison page generation",
  ],
});

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Systems", path: "/systems" },
  { name: "AI Content Ops", path: "/systems/ai-content-ops" },
]);

export default function AiContentOpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
