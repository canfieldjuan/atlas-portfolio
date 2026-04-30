export interface ResourceArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  publishedAt: string;
  readingMinutes: number;
  keywords: string[];
  takeaways: string[];
  sections: {
    heading: string;
    body: string[];
  }[];
  relatedLinks?: {
    href: string;
    label: string;
    detail: string;
  }[];
}

export const resourceArticles: ResourceArticle[] = [
  {
    slug: 'how-to-scope-ai-automation-project',
    title: 'How to Scope an AI Automation Project Before You Hire',
    description:
      'A practical way to define an AI automation project before hiring an AI automation consultant or custom AI development partner.',
    category: 'Scoping',
    publishedAt: '2026-04-29',
    readingMinutes: 7,
    keywords: [
      'how to scope AI automation project',
      'AI automation consultant',
      'AI workflow automation consultant',
      'AI systems roadmap',
    ],
    takeaways: [
      'Start with the workflow, not the model.',
      'Define the operator, handoff, and failure state before build work.',
      'A good roadmap should produce a proof of concept and fixed build scope.',
    ],
    sections: [
      {
        heading: 'Start with the workflow, not the AI feature',
        body: [
          'Most failed automation projects start with a feature idea: a chatbot, a summarizer, a lead scorer, or an internal copilot. Useful AI systems start somewhere more concrete: a workflow that already exists and costs the team time, money, accuracy, or speed.',
          'Before you hire anyone, write down the current process in plain language. What starts the workflow? What information is needed? Who reviews the output? What downstream system receives the result? If those questions are unclear, the project is not ready for implementation yet.',
        ],
      },
      {
        heading: 'Separate source data from decision logic',
        body: [
          'AI automation usually breaks when teams blend data collection, reasoning, and action into one opaque step. A stronger scope separates the raw inputs, the enrichment or reasoning layer, the human-review point, and the final action.',
          'This matters because each layer has different risk. A CRM enrichment job, a retrieval system, and an outbound email draft should not be governed the same way. Good scoping makes those boundaries explicit before anyone estimates a build.',
        ],
      },
      {
        heading: 'Decide what must stay human-reviewed',
        body: [
          'The right question is rarely "Can this be automated?" It is "Which part should be automated without approval, and which part should only be prepared for a person?" External messages, revenue-impacting decisions, compliance-sensitive claims, and irreversible tool actions usually need an explicit review state.',
          'A scoped AI workflow should define the approval path, not treat human review as an afterthought. That is how the system becomes usable by operators instead of feeling like a black box.',
        ],
      },
      {
        heading: 'Make Phase 1 produce a build decision',
        body: [
          'A roadmap should not end with vague recommendations. It should produce a technical blueprint, a narrow proof of concept, an integration map, risk notes, and a fixed-price implementation proposal.',
          'The point is to answer the build question before the larger build begins: is the data good enough, is the workflow valuable enough, and is the scope clear enough to implement responsibly?',
        ],
      },
    ],
    relatedLinks: [
      {
        href: '/systems',
        label: 'See productized AI systems',
        detail:
          'Competitive intelligence and content generation are examples where a prebuilt system core can shorten the path from workflow scoping to implementation.',
      },
    ],
  },
  {
    slug: 'ai-automation-consultant-cost',
    title: 'AI Automation Consultant Cost: What Changes the Price?',
    description:
      'What drives AI automation consulting cost, why fixed-fee scoping matters, and how custom AI development pricing should be separated from discovery.',
    category: 'Pricing',
    publishedAt: '2026-04-29',
    readingMinutes: 6,
    keywords: [
      'AI automation consultant cost',
      'AI consultant pricing',
      'fixed fee AI roadmap',
      'custom AI development pricing',
    ],
    takeaways: [
      'The main cost driver is workflow complexity, not the model call.',
      'Discovery and implementation should be priced separately.',
      'Fixed-fee scoping reduces risk before the larger build.',
    ],
    sections: [
      {
        heading: 'The model is rarely the expensive part',
        body: [
          'Many buyers assume AI project cost is driven by the model. In real operational systems, the larger cost is usually data access, integration, workflow design, evaluation, permissions, deployment, monitoring, and operator-facing UI.',
          'A small workflow with clean data and one integration can be inexpensive. A multi-system workflow with messy records, ambiguous ownership, and external actions costs more because the delivery risk is higher.',
        ],
      },
      {
        heading: 'Separate roadmap cost from implementation cost',
        body: [
          'A fixed-fee roadmap is useful because it keeps discovery from becoming open-ended hourly consulting. The roadmap should define the architecture, prove the riskiest part, and produce a fixed implementation scope.',
          'Implementation pricing should come after that. Pricing a build before the workflow and data are understood usually leads to either padded estimates or expensive surprises.',
        ],
      },
      {
        heading: 'What raises the implementation price',
        body: [
          'The biggest drivers are the number of systems involved, data quality, authentication and permissions, human-review requirements, reliability expectations, reporting needs, and deployment constraints.',
          'A workflow that only prepares a draft for review has a different risk profile than one that writes to a CRM, sends external messages, or changes a business record. Scope should reflect that difference.',
        ],
      },
      {
        heading: 'What a buyer should ask for',
        body: [
          'Ask for the proof point, not just the pitch. What will be proven before implementation? Which assumptions could change the build price? What happens if the proof shows the data is not good enough?',
          'Good pricing is not just a number. It is a set of assumptions, boundaries, milestones, and acceptance criteria that both sides understand before delivery starts.',
        ],
      },
    ],
  },
  {
    slug: 'custom-ai-development-vs-saas',
    title: 'Custom AI Development vs Buying Another SaaS Tool',
    description:
      'When custom AI development makes sense, when a SaaS tool is enough, and how to avoid building software for a problem that should be bought.',
    category: 'Build vs Buy',
    publishedAt: '2026-04-29',
    readingMinutes: 7,
    keywords: [
      'custom AI development services',
      'custom AI software development',
      'AI implementation consultant',
      'AI SaaS alternative',
    ],
    takeaways: [
      'Buy SaaS when the workflow is standard.',
      'Build custom AI when the value is in your data, process, or integrations.',
      'A roadmap should make the build-vs-buy decision explicit.',
    ],
    sections: [
      {
        heading: 'Buy when the workflow is generic',
        body: [
          'If the process is common, the data shape is standard, and the team can adapt to the product workflow, a SaaS tool is usually the better first move. Buying is faster, cheaper, and easier to support.',
          'Examples include basic meeting summaries, simple ticket classification, generic chat over documents, or one-off content drafting. Those may not need custom AI development at all.',
        ],
      },
      {
        heading: 'Build when the workflow is yours',
        body: [
          'Custom AI development starts to make sense when the value comes from your internal process, your data model, your approval rules, or integrations across several tools.',
          'If the system needs to combine CRM records, support tickets, call notes, internal policy, vendor data, and an operator dashboard, a generic SaaS tool may become a workaround instead of a solution.',
        ],
      },
      {
        heading: 'Watch for hidden operating costs',
        body: [
          'SaaS tools can look cheaper until the team spends months routing around missing integrations, exporting spreadsheets, correcting bad outputs, or manually stitching together the final workflow.',
          'Custom systems have their own maintenance cost, but the right build removes recurring manual work instead of adding another tab to check.',
        ],
      },
      {
        heading: 'Use Phase 1 to make the decision',
        body: [
          'A good AI systems roadmap should be willing to recommend "do not build" when the buyer is better served by an existing tool. The roadmap should compare build value against SaaS alternatives and identify the smallest custom layer that creates real leverage.',
          'Sometimes the answer is a custom integration around existing tools, not a full platform. The point is to scope the useful system, not maximize the build.',
        ],
      },
    ],
    relatedLinks: [
      {
        href: '/systems',
        label: 'Review productized system options',
        detail:
          'If the problem is competitive intelligence, vendor intelligence, or content operations, the right answer may be a customized version of an existing system core instead of a blank-slate build.',
      },
    ],
  },
  {
    slug: 'what-should-stay-human-reviewed',
    title: 'What Should Stay Human-Reviewed in an AI Workflow?',
    description:
      'How to decide which parts of an AI workflow can run automatically and which should stay behind human approval.',
    category: 'Governance',
    publishedAt: '2026-04-29',
    readingMinutes: 6,
    keywords: [
      'human in the loop AI workflow',
      'AI workflow automation',
      'AI automation governance',
      'operator review AI',
    ],
    takeaways: [
      'Human review is a design feature, not a failure.',
      'External actions and high-impact decisions need stricter gates.',
      'The workflow should preserve evidence, confidence, and auditability.',
    ],
    sections: [
      {
        heading: 'Human review is not a weakness',
        body: [
          'The strongest AI workflows usually keep people in the loop at the points where judgment, context, or accountability matter. Automation should remove repetitive preparation work, not hide risk from the team.',
          'A useful system can collect information, classify intent, retrieve evidence, draft a response, and recommend an action while still requiring approval before anything consequential happens.',
        ],
      },
      {
        heading: 'Keep external actions behind approval',
        body: [
          'Outbound emails, customer-facing claims, financial changes, record deletion, contractual language, and compliance-sensitive decisions should usually have a review step. The AI can prepare the work, but a person should approve the final action.',
          'That review step should be built into the product surface. If operators have to copy text into a separate tool to check it, the workflow will either slow down or drift into unsafe shortcuts.',
        ],
      },
      {
        heading: 'Automate low-risk preparation first',
        body: [
          'Good early automation targets include intake normalization, duplicate detection, source gathering, draft preparation, routing suggestions, priority scoring, and dashboard updates.',
          'These steps save time without pretending the system has full authority. They also generate the evidence needed to decide whether more automation is justified later.',
        ],
      },
      {
        heading: 'Make the audit trail visible',
        body: [
          'Operators need to know why the system made a recommendation. That means source links, confidence notes, fallback states, and clear labels for generated content.',
          'If a workflow cannot explain its inputs and reasoning path well enough for review, it is not ready to act on behalf of the business.',
        ],
      },
    ],
  },
];

export function getResourceArticle(slug: string): ResourceArticle | undefined {
  return resourceArticles.find((article) => article.slug === slug);
}
