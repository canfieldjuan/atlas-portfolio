import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "The FAQ Report — Help Docs From Your Support Tickets",
  description:
    "The FAQ Report turns your last 90 days of support tickets into repeat questions, customer wording, and FAQ entries your team can review and publish. Upload your CSV and get the first report in 24 hours.",
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
