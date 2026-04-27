import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Privacy and Data Handling",
  description:
    "Plain-language privacy and data handling information for audit requests, AI systems roadmap work, custom AI development, third-party processing, and client-owned deliverables.",
  path: "/privacy",
  keywords: [
    "AI consultant privacy",
    "AI project data handling",
    "custom AI development privacy",
    "AI systems audit privacy",
    "AI automation data handling",
  ],
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
