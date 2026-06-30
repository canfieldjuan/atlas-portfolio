import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";
import { jsonLdScriptPayload } from "@/lib/json-ld";
import { ShieldCheck } from "lucide-react";

export const metadata = generatePageMetadata({
  title: "Resolution Audit: Find Repeat Support Ticket Cost Exposure",
  description:
    "The Resolution Audit turns your support-ticket export into repeat-question rankings, customer wording, review-ready drafts, and operational gaps your team can inspect before committing to a full audit.",
  path: "/systems/support-ticket-deflection",
  keywords: [
    "support ticket deflection",
    "reduce support ticket volume",
    "Zendesk ticket deflection",
    "support cost reduction",
    "help docs from support tickets",
    "Zendesk help center automation",
    "ranked support ticket analysis",
    "support ticket self service",
    "help doc generator",
    "customer question ranking",
    "self service support answers",
    "support content operations",
    "deterministic content pipeline",
    "evidence backed help content",
    "structured help content workflow",
    "how to reduce support tickets",
    "reduce repeat tickets",
    "ticket deflection tools",
    "support deflection software",
    "self-service failure rate",
    "knowledge base failing",
    "knowledge base not working",
    "knowledge gap analysis",
    "knowledge management gap analysis",
    "knowledge gap assessment",
  ],
});

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Systems", path: "/systems" },
  { name: "Support Ticket Deflection", path: "/systems/support-ticket-deflection" },
]);

export default function SupportTicketDeflectionLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptPayload(breadcrumbJsonLd) }}
      />
      <div className="border-b border-primary/10 bg-primary/[0.045] px-4 py-2 text-center">
        <p className="inline-flex max-w-full items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-primary sm:text-xs">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
          <span>ZERO Generative AI Models - Private encrypted storage + browser and backend PII controls</span>
        </p>
      </div>
      {children}
    </>
  );
}
