// Static content for the Support Ticket Deflection playbook page (a top-of-funnel
// lead asset). Each entry is one repeat question: what most help centers serve
// today, why it fails, the rewrite that deflects it, and the transferable move.
//
// Kept deliberately separate from `deflection-demo.ts` (the search seam wired to
// Atlas) — this is static marketing copy, not product data. No cross-imports.

export type PlaybookEntry = {
  /** The question in the customer's own words. */
  question: string;
  /** The jargon-y article most help centers serve for this question. */
  servedToday: string;
  /** One line on why that article fails to deflect. */
  whyItFails: string;
  /** The rewrite that deflects: a customer-language title + the steps. */
  rewrite: { title: string; steps: string[] };
  /** The transferable principle the rewrite demonstrates. */
  move: string;
};

export const PLAYBOOK_ENTRIES: PlaybookEntry[] = [
  {
    question: 'I can’t log in',
    servedToday: '“Configuring SAML SSO & SCIM Provisioning”',
    whyItFails: 'Written for an IT admin setting up SSO — not for a user locked out right now.',
    rewrite: {
      title: 'Can’t log in? Get back in — and how to tell if it’s an SSO issue.',
      steps: [
        'Try a password reset from the login screen.',
        'If your company uses SSO, click “Log in with [your company]” — not a password.',
        'Still stuck? Send your IT admin one line so they can check your SSO config.',
      ],
    },
    move: 'Title it with the words they typed, and answer it in the first line. If the title isn’t their question, they bounce to a ticket.',
  },
  {
    question: 'Why am I still being charged for a teammate I removed?',
    servedToday: '“Understanding Proration & Billing Cycles”',
    whyItFails: 'They want the credit, not a lecture on how proration works.',
    rewrite: {
      title: 'Removed a seat but still billed for it? Here’s why — and how to get the credit.',
      steps: [
        'Seats prorate to your billing cycle.',
        'Open Billing → Seats to confirm the change applied.',
        'Mid-cycle removals credit your next invoice.',
        'If it didn’t, tap “Report a billing issue” — we adjust within one business day.',
      ],
    },
    move: 'Name the exact thing they’re staring at (the invoice line), then resolve it — don’t explain the system.',
  },
  {
    question: 'How do I connect an integration? Why isn’t my data syncing?',
    servedToday: '“API Reference: Webhooks & OAuth Scopes”',
    whyItFails: 'They’re clicking a button, not reading API docs.',
    rewrite: {
      title: 'Connecting an integration (Slack, HubSpot, etc.): 3 steps — and the 2 reasons sync fails.',
      steps: [
        'Settings → Integrations → pick your tool → Connect.',
        'Authorize, then choose what to sync.',
        'Not syncing? Reason 1: the token expired — reconnect.',
        'Reason 2: a permission scope is missing — re-grant access.',
      ],
    },
    move: 'Pair the happy path with the top 2 failure modes in the same article. It’s activation-critical, so it deflects a churn risk, not just a contact.',
  },
  {
    question: 'How do I cancel — or just downgrade?',
    servedToday: '“Plan Changes & Subscription Management”',
    whyItFails: 'Often buried on purpose — which breeds a ticket and resentment, and misses the chance to save the account.',
    rewrite: {
      title: 'Need to cancel? Here are your options (including a cheaper plan).',
      steps: [
        'Settings → Plan.',
        'Choose Downgrade to keep your data on a smaller tier, or Cancel to end at the period’s close.',
        'Either way, your data is held 90 days and access runs until the cycle ends.',
        'Changed your mind? Reactivate anytime in that window.',
      ],
    },
    move: 'Offer the off-ramp before the exit. A self-serve downgrade saves an account a buried cancel page would have churned.',
  },
  {
    question: 'What’s included in my plan? Why am I hitting a limit?',
    servedToday: '“Usage & Quotas Reference”',
    whyItFails: 'They’re not comparing plans — they hit a wall right now and want to know why and what to do.',
    rewrite: {
      title: 'Hit a limit? Here’s what your plan includes and how to see your usage.',
      steps: [
        'The 3 limits that actually block work: seats, storage, and API calls.',
        'Check live usage at Settings → Usage.',
        'Here’s what each cap does the moment you reach it.',
        'Raise it in one click from the same screen.',
      ],
    },
    move: 'Answer the limit question at the moment of the limit, with the upgrade path attached. It deflects the ticket and surfaces expansion revenue.',
  },
  {
    question: 'How do I export my data?',
    servedToday: '“Data Portability & Retention Policy”',
    whyItFails: 'Reads like legal cover, not a how-to — so they ask a human “can I actually get my stuff out?”',
    rewrite: {
      title: 'Exporting your data: what you get, in what format, and how long it takes.',
      steps: [
        'Settings → Data → Export.',
        'You get a CSV (or JSON) of your records, settings, and history.',
        'Large accounts get an emailed download link within the hour.',
        'Here’s exactly what’s included — and what isn’t.',
      ],
    },
    move: 'Answer trust questions with specifics. Vague reassurance on data, security, or portability creates tickets and quiet distrust; concrete specifics deflect both.',
  },
  {
    question: 'How do I make someone an admin / change what they can do?',
    servedToday: '“Roles & Permissions Reference” (the full grid)',
    whyItFails: 'It’s org-chart-shaped, but the user is task-shaped: “I want Sam to manage billing, nothing else.”',
    rewrite: {
      title: 'Who can do what — and how to change it.',
      steps: [
        'The 3 roles in plain terms: what each can and can’t touch.',
        'Change a role in 2 clicks: Settings → Members → pick a person → Role.',
        'The one thing only an Owner can do: transfer ownership or delete the workspace.',
      ],
    },
    move: 'Shape permission docs around the task, not the matrix. “I want X to do Y” is the real query; a capability grid makes them ask a human to translate it.',
  },
  {
    question: 'How do I invite my team?',
    servedToday: '“User Management” (a tour of the screen)',
    whyItFails: 'Explains the buttons but not the gotchas — pending invites, seat limits, what the invitee sees — which are exactly what generate the follow-up ticket.',
    rewrite: {
      title: 'Inviting teammates: how to send it, what they’ll see, and why an invite might not stick.',
      steps: [
        'Settings → Members → Invite, then enter their email.',
        'They get an email and land on a join page.',
        'At your seat limit? The invite holds until you add a seat — here’s where.',
      ],
    },
    move: 'Tell them what happens next. Spell out the invitee’s experience and the one failure mode, and the “did it work?” follow-up never gets sent.',
  },
  {
    question: 'I lost my 2FA / authenticator — how do I get back in?',
    servedToday: '“Multi-Factor Authentication Setup”',
    whyItFails: 'It’s how to enable 2FA — but they’re locked out of it and mildly panicking.',
    rewrite: {
      title: 'Lost your 2FA device? Here’s the safe way back in.',
      steps: [
        'Try your backup codes first — here’s where you saved them.',
        'No codes? Request a reset.',
        'For security we verify identity manually — usually within a few hours.',
        'Here’s what we’ll ask for, so you can have it ready.',
      ],
    },
    move: 'On security flows, lead with the safe path and set the time expectation up front — or they’ll re-ticket twice while they wait.',
  },
  {
    question: 'Is it down? Something just broke.',
    servedToday: 'Nothing self-serve — so the panic goes straight to a ticket.',
    whyItFails: 'With no triage path, every blip becomes a contact spike.',
    rewrite: {
      title: 'Something not working? Check this before you report it.',
      steps: [
        'Check your status page first — and subscribe there for updates.',
        '60-second self-check: hard refresh, clear cache, and check your integration’s status too.',
        'Still broken? Report it with what you were doing and the error you saw, so we jump straight in.',
      ],
    },
    move: 'Give the panic somewhere to go that isn’t a ticket. A status page plus a 2-step self-triage absorbs the spike — and the “what to include” ask makes the tickets that do land actionable.',
  },
];
