import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Business Podcast Repurposing — One Episode, A Week of Authority Content",
  description:
    "Built for business, consultant, and founder-led podcasts. Turn each episode into a newsletter, blog post, LinkedIn post, X thread, short-form script, and pull-quote pack — voice-matched and built from the actual episode. Try one episode for $149. Subscriptions from $497/month.",
  path: "/podcast-repurposing",
  keywords: [
    "business podcast repurposing",
    "consultant podcast content",
    "founder-led podcast marketing",
    "podcast authority content",
    "podcast to newsletter service",
    "podcast to blog post",
    "podcast to LinkedIn post",
    "podcast pull quotes service",
    "voice-matched podcast content",
    "subscription podcast repurposing",
  ],
});

export default function PodcastRepurposingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
