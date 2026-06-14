import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "About Juan Canfield",
  description:
    "About Juan Canfield, AI solutions architect and AI automation consultant. Fixed-fee AI systems roadmaps, custom AI development, and operator-led delivery.",
  path: "/about",
  keywords: [
    "Juan Canfield",
    "AI solutions architect",
    "AI automation consultant",
    "custom AI development consultant",
    "AI systems consultant",
    "workflow automation consultant",
  ],
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
