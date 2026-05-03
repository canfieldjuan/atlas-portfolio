import { generatePageMetadata } from "@/lib/seo";

export const metadata = generatePageMetadata({
  title: "Dark Story Engine — Narration Scripts For Dark / Mystery YouTube Channels",
  description:
    "Built for dark story narration channels — horror, urban legends, paranormal investigations, cryptids. Each video ships a full narration script, title variants, thumbnail brief, description with timestamps, pinned comment, and Shorts teaser. Voice-matched to your channel. Try one video for $99.",
  path: "/dark-story-engine",
  keywords: [
    "horror narration script writer",
    "youtube horror script service",
    "creepy story script writing",
    "dark youtube channel scripts",
    "paranormal investigation scripts",
    "urban legend script writing",
    "narration channel script service",
    "youtube thumbnail brief",
    "youtube title optimization service",
    "subscription script writing",
  ],
});

export default function DarkStoryEngineLayout({ children }: { children: React.ReactNode }) {
  return children;
}
