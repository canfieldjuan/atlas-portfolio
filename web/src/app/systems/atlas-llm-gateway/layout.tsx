import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Atlas LLM Gateway",
  description:
    "Atlas LLM Gateway is a hosted BYOK API for LLM cost control: exact and semantic cache, Anthropic batch, provider-billing reconciliation, budget guards, routing, usage tracking, and plan gates behind one gateway.",
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

export default function AtlasLlmGatewayLayout({ children }: { children: React.ReactNode }) {
  return children;
}
