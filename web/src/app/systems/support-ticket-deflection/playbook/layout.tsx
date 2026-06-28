import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";
import { jsonLdScriptPayload } from "@/lib/json-ld";

export const metadata = generatePageMetadata({
  title: "Your users can Google it. So why are they opening a ticket?",
  description:
    "Ten questions every SaaS support team gets, the docs-y help-center article that quietly creates a ticket, and the customer-language rewrite that deflects it.",
  path: "/systems/support-ticket-deflection/playbook",
  keywords: [
    "support ticket deflection playbook",
    "help center rewrites",
    "self-service deflection examples",
    "reduce support tickets SaaS",
    "customer language FAQ rewrite",
  ],
});

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Systems", path: "/systems" },
  { name: "Support Ticket Deflection", path: "/systems/support-ticket-deflection" },
  { name: "Playbook", path: "/systems/support-ticket-deflection/playbook" },
]);

export default function DeflectionPlaybookLayout({ children }: { children: React.ReactNode }) {
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
