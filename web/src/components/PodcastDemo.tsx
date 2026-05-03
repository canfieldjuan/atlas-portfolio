'use client';

import { useState } from 'react';
import {
  AtSign,
  FileText,
  Hash,
  Mail,
  Mic,
  Quote,
  Video,
} from 'lucide-react';

type OutputId = 'newsletter' | 'blog' | 'linkedin' | 'twitter' | 'shorts' | 'pullquotes';

type Episode = {
  id: string;
  showName: string;
  showType: string;
  episodeTitle: string;
  episodeSummary: string;
  outputs: {
    newsletter: { subject: string; preview: string; sections: string[]; closer: string };
    blog: { title: string; intro: string; outline: string[]; excerpt: string };
    linkedin: { hook: string; body: string; close: string };
    twitter: { tweets: string[] };
    shorts: { hook: string; script: string; cta: string };
    pullquotes: {
      quotes: string[];
      promoCaptions: { platform: string; text: string }[];
    };
  };
};

const episodes: Episode[] = [
  {
    id: 'saas-founder',
    showName: 'The Operator',
    showType: 'B2B SaaS founder podcast',
    episodeTitle: 'Why mid-market teams outgrow chat-style PM tools',
    episodeSummary:
      '45-minute interview with a former product leader on the "50-seat wall" — the point where ops complexity outgrows what consumer-grade PM tools can support.',
    outputs: {
      newsletter: {
        subject: 'The 50-seat wall (and what breaks first)',
        preview:
          'Three months ago I sat down with a former product lead who has watched four mid-market SaaS teams hit the same wall around 50 users. Same patterns every time. Here is what actually breaks first, and what teams switch to.',
        sections: [
          'The wall is real, and it is closer than founders think',
          'Permissioning fails before reporting does',
          'The "AI sidebar" problem nobody is naming',
          'Three signs you are about to outgrow your stack',
        ],
        closer:
          'If your seat count is creeping past 40, the next ten hires are going to expose what you have been ignoring. Reply if you want the full episode notes.',
      },
      blog: {
        title: 'The 50-seat wall: when mid-market teams quietly outgrow their PM stack',
        intro:
          'Most product teams do not realize they have outgrown their tooling until the audit logs are missing, the reports do not match, and the AI sidebar that was supposed to help has become the loudest source of internal friction. The pattern shows up at almost the same point every time: somewhere between 50 and 70 active users.',
        outline: [
          'H2: Why the 50-seat threshold matters',
          'H2: The first thing to break is permissioning, not reporting',
          'H2: Why "AI features" feel bolted on at scale',
          'H2: The renewal conversation that nobody prepares for',
          'H2: What teams actually switch to (and what they look for)',
        ],
        excerpt:
          'It is rarely a single failure that makes a team leave. It is the compounding cost of working around three or four design choices that were fine at 20 users and untenable at 60. The first to surface — usually within the first month past the threshold — is permissioning...',
      },
      linkedin: {
        hook: 'Most product teams do not switch tools because they outgrow features. They switch because they outgrow trust.',
        body:
          'I just finished a conversation with a product lead who has watched four mid-market teams hit the same wall around 50 active users. Every time, the same three things break in sequence:\n\n1. Permissioning. The role model that worked at 20 users stops scaling, and audit logs become a fire drill.\n\n2. Reporting. The dashboards leadership built look fine until two of them disagree and nobody can tell which is right.\n\n3. AI features. The sidebar that was useful at small scale becomes background noise nobody trusts at large scale.\n\nNone of this shows up in the renewal pitch. It shows up two weeks before procurement opens the search.',
        close:
          'If your seat count is between 40 and 70, the next ten hires will show you exactly which of these is breaking first.',
      },
      twitter: {
        tweets: [
          "Most teams don't outgrow their PM tool because of features. They outgrow it because of trust.",
          'Three things break in sequence around the 50-seat mark, and they almost always show up in this order:',
          '1. Permissioning. The role model that worked at 20 users stops scaling. Audit logs become a fire drill.',
          '2. Reporting. Two dashboards built by two different people start disagreeing. Nobody can tell which is right.',
          '3. AI sidebars. Useful at small scale, background noise at large scale. Quietly demoted to "nobody clicks that."',
          'None of this shows up in the renewal pitch. It shows up about two weeks before procurement opens a search.',
          'The teams that handle it gracefully had one thing in common: they were already building the spec for the next tool 60 days before they "officially" needed to leave.',
          'The ones that handled it badly had to make the call under pressure mid-quarter, which is the worst possible time to do a vendor switch on a system this load-bearing.',
        ],
      },
      shorts: {
        hook:
          'Mid-market product teams almost always switch tools at the same point. It is not the feature gap. It is the trust gap. Here is the order it breaks in.',
        script:
          'First: permissioning. The role model that was fine at 20 users falls apart at 60, and audit logs become a fire drill.\n\nSecond: reporting. Two dashboards from two different people start disagreeing, and nobody can tell which is right.\n\nThird: the AI sidebar. Useful at small scale. Background noise nobody trusts at large scale.\n\nNone of this shows up in the renewal pitch. It shows up two weeks before procurement opens a search.',
        cta: 'Full episode in the link.',
      },
      pullquotes: {
        quotes: [
          "Most teams don't switch tools because they outgrow features. They switch because they outgrow trust.",
          'Three things break in sequence around the 50-seat mark, and they almost always show up in the same order: permissioning, then reporting, then AI.',
          'None of this shows up in the renewal pitch. It shows up two weeks before procurement opens a search.',
          'The teams that handled the switch gracefully had one thing in common: they were already building the spec for the next tool 60 days before they "officially" needed to leave.',
        ],
        promoCaptions: [
          {
            platform: 'LinkedIn',
            text:
              'New episode of The Operator: the 50-seat wall. Why permissioning fails before reporting does, what AI sidebars get demoted to, and what teams actually switch to. Link in comments.',
          },
          {
            platform: 'X / Twitter',
            text:
              'New ep: the 50-seat wall in mid-market PM tooling. Three things break in sequence, and the order is more predictable than people think. Link below.',
          },
          {
            platform: 'Instagram / Threads',
            text:
              'You don\'t outgrow your tool because of features. You outgrow it because of trust. New episode breaks down what actually breaks first at 50 users — and where teams go next.',
          },
        ],
      },
    },
  },
  {
    id: 'consultant',
    showName: 'Practice First',
    showType: 'Coaching / consulting podcast',
    episodeTitle: 'Three questions every consultant should ask before saying yes to a project',
    episodeSummary:
      '35-minute solo episode where the host walks through the framework she uses to evaluate new client engagements — built from 100+ project deal patterns over eight years.',
    outputs: {
      newsletter: {
        subject: 'The three questions I ask before saying yes',
        preview:
          'Most of the bad consulting engagements I have seen had the same root cause. The consultant said yes when the answer should have been "not yet." Here is the three-question filter I run before every new project — every project I have skipped using this filter, I am glad I skipped.',
        sections: [
          'Question one: who is going to lose if this project succeeds?',
          'Question two: what does week three look like?',
          'Question three: who has authority to kill this if it goes sideways?',
          'When all three answers are clean, the project usually is too',
        ],
        closer:
          'Hit reply with the project you are evaluating right now and tell me which of the three questions you cannot answer cleanly. I read everything.',
      },
      blog: {
        title: 'The three-question filter every consultant should run before signing a new client',
        intro:
          'After eight years and a hundred-plus engagements, I can tell you that almost every project that went sideways had the same warning sign visible before the contract was signed. Not in the proposal. Not in the scoping call. In a question I had not bothered to ask.',
        outline: [
          'H2: The cost of saying yes too easily',
          'H2: Question one — who loses if you succeed?',
          'H2: Question two — what does week three look like?',
          'H2: Question three — who has authority to kill the project?',
          'H2: When the answers are clean, the work usually is too',
          'H2: A short script for asking each one without scaring off the buyer',
        ],
        excerpt:
          'The first question is the one most consultants skip because it sounds political. But it is the most predictive. Every internal champion who hires you has at least one peer who quietly does not want this project to work...',
      },
      linkedin: {
        hook: 'I have done 100+ consulting engagements. Almost every one that went sideways had the same warning sign before I signed the contract.',
        body:
          'I just was not asking for it.\n\nThree questions I now ask in every scoping call. The ones that have saved me from the worst projects of my career:\n\n1. "Who internally will lose something if this project succeeds?" Every champion has at least one peer who quietly does not want the work to land. If the champion cannot name them, you are walking into politics you cannot see.\n\n2. "What does week three look like for your team?" Not the kickoff, not the deliverable date. Week three. If they cannot picture it, the project has not been internally sold yet.\n\n3. "Who can kill this project, and what would make them?" If the only answer is the champion, the project is one reorg away from cancellation.',
        close:
          'You will not always get clean answers. That is the point. The unclean answers are the data.',
      },
      twitter: {
        tweets: [
          "After 100+ consulting projects, almost every one that went sideways had the same warning sign before I signed the contract. I just wasn't asking for it.",
          'Three questions I now ask in every scoping call:',
          '1. "Who internally will lose something if this project succeeds?" Every champion has a peer who quietly does not want this work to land. If they can\'t name them, you\'re walking into politics you can\'t see.',
          '2. "What does week three look like for your team?" Not kickoff. Not the deliverable. Week three. If they can\'t picture it, the project hasn\'t been internally sold yet.',
          '3. "Who can kill this project, and what would make them?" If the only answer is the champion, the project is one reorg away from cancellation.',
          "You won't always get clean answers. That's the point. The unclean answers are the data.",
          'The projects I have walked away from using this filter, I am almost always glad I walked away from. The ones I took anyway against my own filter, I am almost always glad I took with caveats.',
        ],
      },
      shorts: {
        hook:
          'After 100 consulting projects I can tell you the projects that go sideways almost always have a warning sign before the contract is signed.',
        script:
          'Three questions I ask in every scoping call now:\n\nOne: who internally loses if this project succeeds? Every champion has a peer who does not want this to work. If they cannot name them, you are walking into politics you cannot see.\n\nTwo: what does week three look like? Not kickoff. Not the deliverable. Week three. If they cannot picture it, the project has not been internally sold yet.\n\nThree: who can kill this project, and what would make them? If the only answer is your champion, you are one reorg away from cancellation.',
        cta: 'Full episode is linked.',
      },
      pullquotes: {
        quotes: [
          "Almost every consulting project that went sideways had the same warning sign before the contract was signed. I just wasn't asking for it.",
          'Every champion has at least one peer who quietly does not want this work to land. If your champion cannot name them, you are walking into politics you cannot see.',
          'If the only person who can kill the project is your champion, the project is one reorg away from cancellation.',
          'You will not always get clean answers. That is the point. The unclean answers are the data.',
        ],
        promoCaptions: [
          {
            platform: 'LinkedIn',
            text:
              'New episode of Practice First: the three questions I now ask in every scoping call before saying yes to a consulting project. Built from 100+ engagements. The unclean answers are the data.',
          },
          {
            platform: 'X / Twitter',
            text:
              'New ep: 3 questions every consultant should ask before signing the contract. The projects I walked away from using this filter, I am almost always glad I walked away from.',
          },
          {
            platform: 'Instagram / Threads',
            text:
              'If you have ever taken a consulting project that went sideways, the warning sign was probably visible before you signed. Three questions I now run before every yes. Full episode linked.',
          },
        ],
      },
    },
  },
  {
    id: 'analyst',
    showName: 'Procurement Wire',
    showType: 'Industry analyst podcast',
    episodeTitle: 'The procurement-AI gap is bigger than people think',
    episodeSummary:
      '40-minute conversation with two enterprise procurement leaders on why AI vendor evaluation is quietly breaking traditional procurement processes — and what is actually working.',
    outputs: {
      newsletter: {
        subject: 'Procurement is quietly breaking on AI vendors',
        preview:
          'I just had a long conversation with two enterprise procurement heads about something that is barely being discussed in vendor briefings: traditional procurement processes were not designed for AI vendors, and the gap is starting to show in real ways.',
        sections: [
          'The artifacts that work for SaaS do not work for AI',
          'Why "data residency" questions get answered three different ways',
          'The model-version problem nobody is naming',
          'What the smartest procurement teams are actually doing',
        ],
        closer:
          'Reply with the AI procurement question your team is currently stuck on. I will share patterns I am seeing without naming names.',
      },
      blog: {
        title: 'The procurement-AI gap: why traditional vendor evaluation is breaking on AI deals',
        intro:
          'For most of the last decade, enterprise procurement teams have evaluated software vendors with a roughly stable playbook. SOC 2. DPA. SLA. Data residency. The model worked because the underlying products were stable enough to be assessed once and renewed routinely. AI vendors are exposing the limits of that model in ways that are not yet being talked about clearly.',
        outline: [
          'H2: The traditional procurement playbook (and where it works)',
          'H2: Why AI vendors do not fit the same artifacts',
          'H2: The model-version problem nobody is naming',
          'H2: How "data residency" questions get answered three different ways',
          'H2: What the leading procurement teams are actually doing differently',
          'H2: A modified evaluation framework for AI vendors specifically',
        ],
        excerpt:
          'The artifacts the procurement team requests — SOC 2 reports, data flow diagrams, sub-processor lists — are designed for software where the answers are stable for a year. With AI vendors, the model can change underneath the same product name within a quarter...',
      },
      linkedin: {
        hook: 'Enterprise procurement was not designed for AI vendors. The gap is starting to show in ways nobody is talking about clearly.',
        body:
          'I spent 40 minutes with two enterprise procurement heads this week on the topic. The pattern is consistent:\n\n• The artifacts that work for traditional SaaS — SOC 2, DPA, data flow diagrams — assume the underlying product is stable for the contract term. AI products are not, because the model can change underneath the same product name within a quarter.\n\n• "Data residency" gets answered three different ways depending on whether you mean the model weights, the inference endpoint, or the training data. Most procurement teams are not asking the question precisely enough to get a useful answer.\n\n• The leading procurement teams are quietly building a modified evaluation framework. They have not published it. They will not for at least another 18 months.',
        close:
          'If you are evaluating AI vendors right now, the procurement playbook you have is probably 70 percent useful and 30 percent actively misleading.',
      },
      twitter: {
        tweets: [
          'Enterprise procurement was not designed for AI vendors, and the gap is starting to show in ways nobody is talking about clearly.',
          'I spent 40 minutes with two enterprise procurement heads this week on the topic. Here is what they are seeing.',
          'The artifacts that work for traditional SaaS — SOC 2, DPA, data flow diagrams — assume the underlying product is stable for the contract term. AI products are not.',
          'The model can change underneath the same product name within a quarter. Most procurement contracts have no language for that.',
          '"Data residency" is the most-asked, least-answered question. It gets three different answers depending on whether you mean model weights, inference endpoint, or training data.',
          'The leading procurement teams are quietly building a modified evaluation framework. They have not published it and will not for at least 18 months.',
          'If you are evaluating AI vendors right now, the procurement playbook you have is probably 70% useful and 30% actively misleading.',
        ],
      },
      shorts: {
        hook:
          'Enterprise procurement was not designed for AI vendors. The gap is starting to show in ways nobody is talking about clearly.',
        script:
          'I just spent 40 minutes with two enterprise procurement heads. The pattern is consistent.\n\nFirst: the artifacts that work for traditional SaaS — SOC 2, DPA, data flow diagrams — assume the product is stable for the contract term. AI products are not. The model can change underneath the same product name within a quarter.\n\nSecond: data residency is the most-asked, least-answered question. It gets three different answers depending on whether you mean model weights, inference endpoint, or training data.\n\nThird: the leading procurement teams are quietly building a modified framework. They have not published it. They will not for at least 18 months.',
        cta: 'Full conversation is in the description.',
      },
      pullquotes: {
        quotes: [
          'Enterprise procurement was not designed for AI vendors, and the gap is starting to show in ways nobody is talking about clearly.',
          'The model can change underneath the same product name within a quarter. Most procurement contracts have no language for that.',
          'Data residency is the most-asked, least-answered question. It gets three different answers depending on whether you mean model weights, inference endpoint, or training data.',
          'If you are evaluating AI vendors right now, the procurement playbook you have is probably 70 percent useful and 30 percent actively misleading.',
        ],
        promoCaptions: [
          {
            platform: 'LinkedIn',
            text:
              'New episode of Procurement Wire: 40 minutes with two enterprise procurement heads on why traditional vendor evaluation is breaking on AI deals. The model-version problem nobody is naming. Link in comments.',
          },
          {
            platform: 'X / Twitter',
            text:
              'New ep: enterprise procurement was not designed for AI vendors. Three things the leading teams are doing differently — and why most playbooks are 70% useful, 30% actively misleading.',
          },
          {
            platform: 'Instagram / Threads',
            text:
              'If you are evaluating AI vendors with a traditional SaaS procurement framework, you are missing about a third of what matters. New episode on what the leading teams are doing instead.',
          },
        ],
      },
    },
  },
];

const outputTabs: { id: OutputId; label: string; icon: React.ReactNode }[] = [
  { id: 'newsletter', label: 'Newsletter', icon: <Mail className="w-4 h-4" /> },
  { id: 'blog', label: 'Blog Post', icon: <FileText className="w-4 h-4" /> },
  { id: 'linkedin', label: 'LinkedIn Post', icon: <AtSign className="w-4 h-4" /> },
  { id: 'twitter', label: 'X Thread', icon: <Hash className="w-4 h-4" /> },
  { id: 'shorts', label: 'Shorts Script', icon: <Video className="w-4 h-4" /> },
  { id: 'pullquotes', label: 'Pull Quotes + Captions', icon: <Quote className="w-4 h-4" /> },
];

export function PodcastDemo() {
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(episodes[0].id);
  const [selectedOutput, setSelectedOutput] = useState<OutputId>('newsletter');

  const episode = episodes.find((e) => e.id === selectedEpisodeId) ?? episodes[0];

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
      {/* Episode picker */}
      <div role="group" aria-label="Sample episodes" className="flex flex-col sm:flex-row border-b border-white/10">
        {episodes.map((ep) => {
          const isActive = ep.id === selectedEpisodeId;
          return (
            <button
              key={ep.id}
              type="button"
              aria-current={isActive ? 'true' : undefined}
              onClick={() => setSelectedEpisodeId(ep.id)}
              className={`flex-1 px-5 py-4 text-left text-sm transition-colors border-b sm:border-b-0 sm:border-r border-white/10 last:border-r-0 last:border-b-0 ${
                isActive
                  ? 'bg-primary/[0.06] text-white'
                  : 'text-foreground/60 hover:bg-white/[0.02] hover:text-foreground/80'
              }`}
            >
              <div className="text-[10px] font-mono tracking-widest mb-1 text-primary/70 flex items-center gap-1.5">
                <Mic className="w-3 h-3" />
                {ep.showType.toUpperCase()}
              </div>
              <div className="font-medium">{ep.showName}</div>
            </button>
          );
        })}
      </div>

      {/* Episode info */}
      <div className="px-6 md:px-8 pt-6 pb-5 border-b border-white/10">
        <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-2">
          INPUT — EPISODE
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{episode.episodeTitle}</h3>
        <p className="text-sm text-foreground/60 leading-relaxed">{episode.episodeSummary}</p>
      </div>

      {/* Output tabs */}
      <div className="px-6 md:px-8 pt-5">
        <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
          OUTPUTS — READY TO SHIP
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          {outputTabs.map((tab) => {
            const isActive = tab.id === selectedOutput;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedOutput(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-md border text-xs transition-colors ${
                  isActive
                    ? 'border-primary/40 bg-primary/[0.08] text-white'
                    : 'border-white/10 bg-white/[0.02] text-foreground/60 hover:border-white/20 hover:text-foreground/80'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Output content */}
      <div className="px-6 md:px-8 pb-8">
        {selectedOutput === 'newsletter' && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-2">
              SUBJECT
            </div>
            <div className="text-base font-semibold text-white mb-4">
              {episode.outputs.newsletter.subject}
            </div>
            <div className="text-sm text-foreground/75 leading-relaxed mb-5 italic">
              {episode.outputs.newsletter.preview}
            </div>
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              SECTIONS
            </div>
            <ul className="space-y-2 mb-5">
              {episode.outputs.newsletter.sections.map((s, i) => (
                <li key={s} className="text-sm text-foreground/70 leading-relaxed">
                  <span className="text-primary/70 font-mono mr-2">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s}
                </li>
              ))}
            </ul>
            <div className="text-sm text-foreground/65 leading-relaxed border-t border-white/10 pt-4">
              {episode.outputs.newsletter.closer}
            </div>
          </div>
        )}

        {selectedOutput === 'blog' && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-2">
              SEO BLOG POST
            </div>
            <h4 className="text-lg font-semibold text-white mb-3 leading-snug">
              {episode.outputs.blog.title}
            </h4>
            <p className="text-sm text-foreground/75 leading-relaxed mb-5">
              {episode.outputs.blog.intro}
            </p>
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              OUTLINE
            </div>
            <ul className="space-y-1.5 mb-5">
              {episode.outputs.blog.outline.map((h) => (
                <li key={h} className="text-sm text-foreground/65 leading-relaxed">
                  <span className="text-primary/60 mr-2">·</span>
                  {h}
                </li>
              ))}
            </ul>
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-2">
              EXCERPT
            </div>
            <p className="text-sm text-foreground/65 leading-relaxed italic">
              {episode.outputs.blog.excerpt}
            </p>
          </div>
        )}

        {selectedOutput === 'linkedin' && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              LINKEDIN POST
            </div>
            <p className="text-base font-semibold text-white leading-snug mb-4">
              {episode.outputs.linkedin.hook}
            </p>
            <p className="text-sm text-foreground/75 leading-relaxed whitespace-pre-line mb-4">
              {episode.outputs.linkedin.body}
            </p>
            <p className="text-sm text-foreground/70 leading-relaxed border-t border-white/10 pt-4">
              {episode.outputs.linkedin.close}
            </p>
          </div>
        )}

        {selectedOutput === 'twitter' && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-4">
              X / TWITTER THREAD
            </div>
            <ol className="space-y-3">
              {episode.outputs.twitter.tweets.map((tweet, i) => (
                <li key={i} className="flex gap-3">
                  <span className="text-[10px] font-mono text-foreground/40 shrink-0 mt-1.5">
                    {i + 1}/{episode.outputs.twitter.tweets.length}
                  </span>
                  <p className="text-sm text-foreground/75 leading-relaxed">{tweet}</p>
                </li>
              ))}
            </ol>
          </div>
        )}

        {selectedOutput === 'shorts' && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              SHORT-FORM SCRIPT — 60 SECONDS
            </div>
            <div className="mb-4">
              <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-1.5">
                HOOK (0–5s)
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {episode.outputs.shorts.hook}
              </p>
            </div>
            <div className="mb-4">
              <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-1.5">
                BODY (5–55s)
              </div>
              <p className="text-sm text-foreground/75 leading-relaxed whitespace-pre-line">
                {episode.outputs.shorts.script}
              </p>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-1.5">
                CTA (55–60s)
              </div>
              <p className="text-sm text-foreground/75 leading-relaxed">
                {episode.outputs.shorts.cta}
              </p>
            </div>
          </div>
        )}

        {selectedOutput === 'pullquotes' && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-4">
              PULL QUOTES — DROP INTO QUOTE CARDS, GRAPHICS, OR FOOTERS
            </div>
            <div className="space-y-3 mb-6">
              {episode.outputs.pullquotes.quotes.map((q, i) => (
                <div
                  key={i}
                  className="rounded-md border-l-2 border-primary/60 bg-white/[0.02] pl-4 pr-3 py-2.5"
                >
                  <p className="text-sm text-white leading-relaxed italic">&ldquo;{q}&rdquo;</p>
                </div>
              ))}
            </div>
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3 border-t border-white/10 pt-5">
              PROMO CAPTIONS — READY TO PASTE WITH THE EPISODE LINK
            </div>
            <div className="space-y-3">
              {episode.outputs.pullquotes.promoCaptions.map((cap) => (
                <div
                  key={cap.platform}
                  className="rounded-md border border-white/10 bg-black/40 p-3"
                >
                  <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-1.5">
                    {cap.platform.toUpperCase()}
                  </div>
                  <p className="text-sm text-foreground/75 leading-relaxed">{cap.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] font-mono text-foreground/35 mt-4 leading-relaxed flex items-start gap-2">
          <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Sample outputs from real public episodes. Your delivery is voice-matched to your show, not these.
          </span>
        </p>
      </div>

    </div>
  );
}
