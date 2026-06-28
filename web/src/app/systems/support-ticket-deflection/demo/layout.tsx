import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";
import { jsonLdScriptPayload } from "@/lib/json-ld";

export const metadata = generatePageMetadata({
  title: "Support Ticket Deflection, Interactive Demo",
  description:
    "Type a question your customers keep asking and see the jargon-y help-center article they hit today beside the customer-language answer a Resolution Audit would surface for review.",
  path: "/systems/support-ticket-deflection/demo",
  keywords: [
    "support ticket deflection demo",
    "help center answer comparison",
    "customer language FAQ",
    "self-service deflection example",
    "ticket deflection interactive",
  ],
});

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Systems", path: "/systems" },
  { name: "Support Ticket Deflection", path: "/systems/support-ticket-deflection" },
  { name: "Demo", path: "/systems/support-ticket-deflection/demo" },
]);

export default function DeflectionDemoLayout({ children }: { children: React.ReactNode }) {
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
