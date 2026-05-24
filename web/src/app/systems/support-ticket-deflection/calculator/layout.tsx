import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Support Tax Calculator — what repeat tickets cost you",
  description:
    "Estimate the monthly and annual cost of repeat Tier-1 support tickets from your own ticket volume and cost per ticket. Adjust the repeat-rate assumption to your reality.",
  path: "/systems/support-ticket-deflection/calculator",
  keywords: [
    "support ticket cost calculator",
    "support tax calculator",
    "cost of repeat support tickets",
    "ticket deflection ROI",
    "support cost estimate",
  ],
});

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Systems", path: "/systems" },
  { name: "Support Ticket Deflection", path: "/systems/support-ticket-deflection" },
  { name: "Calculator", path: "/systems/support-ticket-deflection/calculator" },
]);

export default function DeflectionCalculatorLayout({ children }: { children: React.ReactNode }) {
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
