import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Leaky Bucket Calculator, repeat ticket cost estimate",
  description:
    "Estimate the annual budget leaking through repeated support questions, context gathering, agent churn, and low self-service resolution.",
  path: "/systems/support-ticket-deflection/calculator",
  keywords: [
    "support ticket cost calculator",
    "leaky bucket support calculator",
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
