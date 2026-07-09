import { generateBreadcrumbJsonLd } from "@/lib/seo";
import { jsonLdScriptPayload } from "@/lib/json-ld";

// Page metadata (incl. the personalized OG/Twitter card) is owned by
// generateMetadata in page.tsx, which needs searchParams — unavailable to
// layouts. This layout only injects the breadcrumb JSON-LD.
const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Systems", path: "/systems" },
  { name: "Support Ticket Deflection", path: "/systems/support-ticket-deflection" },
  { name: "Support Tax Calculator", path: "/systems/support-ticket-deflection/support-tax" },
]);

export default function SupportTaxCalculatorLayout({ children }: { children: React.ReactNode }) {
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
