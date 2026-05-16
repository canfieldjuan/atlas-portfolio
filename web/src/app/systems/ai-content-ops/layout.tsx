import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "The Gap Report — Help Docs From Your Support Tickets",
  description:
    "The Gap Report turns your last 90 days of support tickets into a ranked priority list of which help docs to build first — written in your customers' own words. Upload a CSV; we cluster questions by intent, rank by ticket volume, and generate publish-ready FAQ entries with source ticket IDs cited per claim. 48 hours to first report.",
  path: "/systems/ai-content-ops",
  keywords: [
    "help docs from support tickets",
    "Zendesk help center automation",
    "ranked FAQ generator",
    "help center gap analysis",
    "support ticket deflection",
    "AI help doc generator",
    "customer question ranking",
    "FAQ from tickets",
    "AI content operations",
    "AI content pipeline",
    "evidence backed AI content",
    "structured AI content workflow",
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
