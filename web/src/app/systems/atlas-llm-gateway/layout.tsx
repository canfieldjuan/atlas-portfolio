import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Atlas LLM Gateway",
  description:
    "Atlas LLM Gateway is a hosted BYOK API for teams already using Claude. Route chat, streaming, and Anthropic batch traffic through one gateway with API keys, plan gates, usage tracking, and batch-cost visibility.",
  path: "/systems/atlas-llm-gateway",
  keywords: [
    "LLM gateway",
    "Anthropic batch API",
    "Claude API cost optimization",
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
