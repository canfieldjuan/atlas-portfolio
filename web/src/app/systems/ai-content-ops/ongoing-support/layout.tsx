import { generateBreadcrumbJsonLd, generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Ongoing Optimization for AI Content Ops",
  description:
    "A productized monthly retainer that keeps your AI content workflow tuned: prompt and template tuning, integration updates, and quality gates. From $2,500/mo.",
  path: "/systems/ai-content-ops/ongoing-support",
  keywords: [
    "AI content workflow maintenance",
    "AI content retainer",
    "ongoing AI optimization",
    "AI content tuning service",
    "AI prompt and workflow tuning retainer",
    "AI content operations support",
    "managed AI content workflow",
    "AI content quality gate maintenance",
  ],
});

const breadcrumbJsonLd = generateBreadcrumbJsonLd([
  { name: "Home", path: "/" },
  { name: "Systems", path: "/systems" },
  { name: "AI Content Ops", path: "/systems/ai-content-ops" },
  { name: "Ongoing Support", path: "/systems/ai-content-ops/ongoing-support" },
]);

export default function OngoingSupportLayout({ children }: { children: React.ReactNode }) {
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
