import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Podcast Repurposing Engine — One Episode, A Week of Content",
  description:
    "Turn one podcast episode into a newsletter, blog post, LinkedIn post, X thread, and Shorts script — written in your voice and built from the actual episode. Subscription pricing from $297/month. Try it on one episode for $149.",
  path: "/podcast-repurposing",
  keywords: [
    "podcast repurposing",
    "podcast content repurposing service",
    "turn podcast into newsletter",
    "podcast to blog post",
    "podcast to LinkedIn post",
    "podcast to short-form video script",
    "podcast content service",
    "voice-matched podcast content",
    "subscription podcast repurposing",
    "podcast content engine",
  ],
});

export default function PodcastRepurposingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
