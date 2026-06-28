import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";
import { jsonLdScriptPayload } from "@/lib/json-ld";

export const metadata = generatePageMetadata({
  title: "Atlas LLM Gateway",
  description:
    "Hosted BYOK API for LLM cost control: exact and semantic cache, Anthropic batch, billing reconciliation, budget guards, routing, and usage tracking.",
  path: "/systems/atlas-llm-gateway",
  keywords: [
    "LLM gateway",
    "Anthropic batch API",
    "Claude API cost optimization",
    "LLM cost control",
    "LLM semantic cache",
    "LLM exact cache",
    "LLM provider billing reconciliation",
    "LLM budget guards",
    "BYOK AI gateway",
    "LLM usage tracking",
    "multi tenant LLM API",
    "OpenAI compatible LLM gateway",
    "Anthropic API wrapper",
    "LLM billing infrastructure",
    "AI API gateway",
  ],
});

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Systems", path: "/systems" },
  { name: "Atlas LLM Gateway", path: "/systems/atlas-llm-gateway" },
]);

export default function AtlasLlmGatewayLayout({ children }: { children: React.ReactNode }) {
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
