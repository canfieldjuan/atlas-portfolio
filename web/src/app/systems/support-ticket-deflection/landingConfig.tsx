import { type DiagnosticPricingTier } from '@/components/landing/LandingPrimitives';
import { DEFLECTION_DEFAULT_PRICE_VARIANT } from '@/lib/deflection-pricing';

// All on-page CTAs route to the focused deflection report intake (CSV upload),
// not the broader /audit form. Kept as a single constant so future renames
// or per-CTA tracking params are one-edit-one-file.
const GAP_REPORT_INTAKE_HREF = '/systems/support-ticket-deflection/intake';

export const pricingTiers: DiagnosticPricingTier[] = [
  {
    id: `snapshot`,
    badge: `FREE · NO CARD`,
    title: `Resolution Audit Snapshot`,
    price: `Free`,
    sla: `Delivered in seconds after CSV upload`,
    description:
      `Upload your 30-day ticket export. We send back enough to show whether the repeat pattern is real: top questions, customer wording, and one source-backed answer when evidence exists.`,
    includes: [
      `Your top 5 repeat questions, ranked by how often they were asked`,
      `Customer wording examples`,
      `1 review-ready answer when your tickets contain resolution evidence`,
      `No card required, no contract`,
    ],
    note: `The free Snapshot shows whether the pattern is there. It is not the full audit.`,
    cta: `Start Your Forensic Audit`,
    href: GAP_REPORT_INTAKE_HREF,
    highlighted: true,
  },
  {
    id: `full-report`,
    badge: `FULL REPORT`,
    title: `Full Resolution Audit`,
    price: DEFLECTION_DEFAULT_PRICE_VARIANT.priceLabel,
    description:
      `For the first 30-day batch. We turn the repeat questions into a full Resolution Audit your team can use to decide what to fix and publish first.`,
    includes: [
      `Every recurring question, ranked by how often it was asked (typically 50+)`,
      `Customer wording clusters and self-service title targets`,
      `A review-ready draft for every gap your tickets already solve, using your team's resolved replies`,
      `A "no proven answer yet" list, the frequent questions you have not cracked`,
      `Priority ranking and source ticket IDs on every finding`,
    ],
    note: `This is the paid expansion: enough detail to actually update the help center.`,
    cta: `Start the full audit`,
    href: GAP_REPORT_INTAKE_HREF,
  },
  {
    id: `quarterly-refresh`,
    title: `Quarterly Refresh`,
    price: DEFLECTION_DEFAULT_PRICE_VARIANT.priceLabel,
    priceDetail: `/ quarter`,
    description:
      `Run the report every 90 days so your help center keeps up as customer questions change. Good for teams that keep seeing new repeat issues.`,
    includes: [
      `Full Resolution Audit every 90 days`,
      `What changed since the last report`,
      `Questions that are still coming back`,
      `New self-service answers to review and publish`,
      `Cancel any time after the next report`,
    ],
    note: `Best after the first full audit proves the work is useful.`,
    cta: `Keep it updated`,
    href: GAP_REPORT_INTAKE_HREF,
  },
];

export const pricingFaqs: { q: string; a: string }[] = [
  {
    q: `What do I get in the free Snapshot?`,
    a: `You get your top 5 repeat questions ranked from your ticket history, examples of the exact customer wording, and one review-ready answer when your tickets contain resolution evidence. It is enough to show whether the repeat pattern is real before you pay for the full audit. It is not the full audit.`,
  },
  {
    q: `What do I get in the full Resolution Audit?`,
    a: `You get the working list: every recurring question ranked by volume, customer wording clusters, documentation gaps, source ticket IDs, review-ready drafts for gaps your tickets already solve, and a "no proven answer yet" list for frequent questions without enough answer evidence.`,
  },
  {
    q: `How many tickets should I export?`,
    a: `About 30 days of closed tickets is the sweet spot. A few hundred tickets is usually enough for the snapshot to show whether repeat patterns are there. If the export is too thin, we will say so.`,
  },
  {
    q: `What if my tickets are messy?`,
    a: `Messy is expected. Customers do not ask in clean tags or perfect categories. We group tickets by what the customer was trying to do and the words they used, not by how neatly the export is labeled.`,
  },
  {
    q: `What about private customer data?`,
    a: `If your export tool can remove names, emails, phone numbers, or other private details, do that first, we recommend it. The intake minimizes common contact identifiers in the CSV body before upload, and the backend redacts supported PII patterns from generated Snapshot and report outputs. We do not need PII to find repeat questions. Your file is deleted after 30 days. The analysis is 100% deterministic, no AI, no model training, no fine-tuning, no sharing.`,
  },
  {
    q: `Why use customer wording?`,
    a: `Because customers search in their own words. If support tickets say one thing and your help center says another, the answer can exist and still fail to surface. Customer wording closes that gap.`,
  },
  {
    q: `We just updated our help center, do we still need this?`,
    a: `Maybe not, and the free Snapshot will tell you. If customers still ask questions your updated docs already cover, the gap is usually wording or findability. If the Snapshot does not find a repeat pattern, it will say so.`,
  },
  {
    q: `How much editing will the answers need?`,
    a: `Plan on light review. Most teams confirm the steps, adjust tone, add product links, and approve the draft before publishing. You are not starting from a blank page, and nothing goes live without you.`,
  },
  {
    q: `What if we do not have enough tickets?`,
    a: `Then we will tell you. The report works best when repeat questions show up clearly. If the export is too thin or too scattered to support a useful finding, we will not pretend there is a pattern.`,
  },
  {
    q: `Do you replace our help desk?`,
    a: `No. The report does not touch Zendesk, Intercom, Help Scout, or your live queue. It works from a CSV export and hands your team reviewed self-service work to publish in the help center you already control.`,
  },
  {
    q: `Do we have to sign up for quarterly reports?`,
    a: `No. Start with the free Snapshot. If it shows a useful repeat-question pattern, you can pay for the full Resolution Audit. Quarterly refreshes are only for teams that want to keep updating the help center as new repeat questions appear.`,
  },
  {
    q: `How do you reduce repeat support tickets?`,
    a: `We identify the repeat questions customers ask most, capture the words they use, and draft self-service answers from replies your team already used. You review and publish what you approve, giving the next customer a better path before opening a ticket. No percentage is guaranteed.`,
  },
  {
    q: `Will this help if our knowledge base is not working?`,
    a: `Usually yes. A struggling knowledge base often has a wording problem, not just a content problem. The answer may exist, but customers cannot find it because the article uses internal product language. We use ticket language to show what needs to be rewritten or added.`,
  },
  {
    q: `Why is our self-service resolution rate so low?`,
    a: `Often because the answer exists in the wrong words or is missing from the places customers search. Gartner found 73% of customers try self-service first, but only 14% fully resolve there. Your tickets show the terms and questions your self-service layer is missing.`,
  },
  {
    q: `How is this different from a chatbot or AI agent?`,
    a: `A chatbot answers customers in the moment and can guess wrong. This does not answer customers. It is a 100% deterministic analysis of past tickets that gives your team FAQ drafts and evidence to review. No AI talks to your customers here.`,
  },
];
