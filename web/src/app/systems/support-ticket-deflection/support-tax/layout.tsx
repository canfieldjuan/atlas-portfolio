import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Support Tax Calculator: the cost of repeat support tickets",
  description:
    "A 30-second estimate of the monthly cost and agent hours your team spends re-answering repeat Tier-1 support questions, from two inputs.",
  path: "/systems/support-ticket-deflection/support-tax",
  keywords: [
    "support tax calculator",
    "cost of repeat support tickets",
    "support agent time calculator",
    "tier-1 ticket cost",
    "support cost estimate",
  ],
});

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
