import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Privacy and Data Handling",
  description:
    "How audit requests and AI systems work handle your data: third-party processing, retention, and client-owned deliverables, in plain language.",
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
