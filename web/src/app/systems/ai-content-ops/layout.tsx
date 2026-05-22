import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Support Ticket Deflection Report — Cut Repeat Support Tickets",
  description:
    "The Support Ticket Deflection Report turns your last 90 days of support tickets into repeat-ticket rankings, customer wording, and self-service answers your team can review and publish.",
  path: "/systems/ai-content-ops",
  keywords: [
    "support ticket deflection",
    "reduce support ticket volume",
    "Zendesk ticket deflection",
    "support cost reduction",
    "help docs from support tickets",
    "Zendesk help center automation",
    "ranked support ticket analysis",
    "help center gap analysis",
    "AI help doc generator",
    "customer question ranking",
    "self service support answers",
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
