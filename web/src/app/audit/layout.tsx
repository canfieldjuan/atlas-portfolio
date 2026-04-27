import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Request an AI Systems Audit",
  description:
    "Submit a brief describing your operational bottlenecks and data landscape. I review every submission personally and respond within 48 hours.",
  path: "/audit",
});

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return children;
}
