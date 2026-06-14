import type { Metadata } from "next";

import { generatePageMetadata } from "@/lib/seo";

import HomeClient from "./HomeClient";

// Homepage-specific metadata. Without this the page inherited the generic
// site-wide title/description, so Google fell back to scraping the nav labels
// ("Architect / Services / Systems / Process / Capabilities") for the snippet.
// A tight, page-specific description gives the search snippet a real target.
export const metadata: Metadata = generatePageMetadata({
  title: "AI Automation Consultant & AI Solutions Architect",
  description:
    "Fixed-fee AI automation consulting for teams turning manual workflows, scattered data, and approval bottlenecks into production-ready AI systems.",
  path: "/",
});

export default function Page() {
  return <HomeClient />;
}
