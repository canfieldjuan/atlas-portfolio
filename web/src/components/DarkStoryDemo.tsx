'use client';

import { useState } from 'react';
import {
  AlignLeft,
  FileText,
  Hash,
  Image as ImageIcon,
  MessageSquare,
  Quote,
  Type,
  Video,
} from 'lucide-react';

type OutputId = 'script' | 'titles' | 'thumbnail' | 'description' | 'comment' | 'shorts';

type ChannelDemo = {
  id: string;
  channelName: string;
  channelType: string;
  videoTopic: string;
  topicSource: string;
  outputs: {
    script: { coldOpen: string; bodyExcerpt: string; cta: string; wordCount: string };
    titles: { variants: { title: string; angle: string }[] };
    thumbnail: {
      primaryConcept: string;
      visualDirection: string;
      textOverlayOptions: string[];
      colorNotes: string;
    };
    description: { intro: string; timestamps: { time: string; section: string }[]; tags: string[] };
    comment: string;
    shorts: { hook: string; script: string; cta: string };
  };
};

const channels: ChannelDemo[] = [
  {
    id: 'reddit-creepy',
    channelName: 'The Quiet Hour',
    channelType: 'Reddit-sourced creepy stories',
    videoTopic:
      'Three subscriber submissions about people seeing strangers inside their own houses',
    topicSource:
      'Subscriber inbox + r/LetsNotMeet — three first-person accounts curated for tonal fit and length.',
    outputs: {
      script: {
        coldOpen:
          'The first thing she noticed wasn\'t the man in her kitchen. It was that the kitchen light was on. She had turned it off twenty minutes earlier, before she went upstairs. She remembered turning it off because the click of the switch had been the last sound in the house before the quiet started. And now the light was on. And the quiet was gone.',
        bodyExcerpt:
          '[BEAT — pause for 1 second]\n\nShe stood at the top of the stairs and listened. There was no sound. No footsteps. No breathing she could hear over her own. Just the kind of silence that sits inside a house when someone is being careful inside it.\n\nShe did the thing she had told herself for years she would never do. She walked down the stairs.\n\nNot because she was brave. Because she had to know.\n\n[PACING NOTE — slow this section. The narration should feel like someone retracing the moment in their own head, not telling a story for an audience.]',
        cta:
          'If you have ever come home to something out of place — a door you did not leave open, a chair you did not move — leave the story in the comments. I read every one. The good ones become future episodes.',
        wordCount: '~2,400 words · 12–14 min runtime',
      },
      titles: {
        variants: [
          {
            title: 'I Came Home And The Light Was On (3 True Stories)',
            angle: 'Cold-open hook + "true stories" social proof + low number for clarity',
          },
          {
            title: '3 People Who Realized A Stranger Was Already Inside Their House',
            angle: 'Specificity ("3 People") + the most disturbing beat from the cold open',
          },
          {
            title: 'They Heard Footsteps Upstairs. Nobody Else Was Home.',
            angle: 'Active dread, no setup needed, plays on universal fear',
          },
          {
            title: 'The Stranger Who Knew The House Better Than I Did',
            angle: 'Punchline-style title that makes viewers want the explanation',
          },
        ],
      },
      thumbnail: {
        primaryConcept:
          'Wide shot of a dark hallway, single warm light spilling from a doorway at the far end. A figure barely visible at the edge of the doorframe — face cut off, just shoulder + shadow.',
        visualDirection:
          'Cinematic, deeply contrasted, color-graded toward warm-orange light against deep cyan-black shadows. Avoid jump-scare clichés (no glowing eyes, no white-faced ghouls). The horror is "someone was here before you got home."',
        textOverlayOptions: [
          'THE LIGHT WAS ON',
          'I HAD TURNED IT OFF',
          'SOMEONE WAS DOWNSTAIRS',
        ],
        colorNotes:
          'Lean into orange/cyan complementary contrast (Hollywood horror standard). Reserve the channel\'s red accent color for thumbnail border or text underline only — never on the figure.',
      },
      description: {
        intro:
          'Three submissions from subscribers who came home to something they could not explain. Each one is told in their own words, lightly edited for pacing. As always — names, locations, and identifying details are changed at the storyteller\'s request.',
        timestamps: [
          { time: '0:00', section: 'Cold open — "The light was on"' },
          { time: '1:42', section: 'Story 1 — Suburb outside Cleveland' },
          { time: '5:18', section: 'Story 2 — Apartment in Portland' },
          { time: '8:54', section: 'Story 3 — The basement door' },
          { time: '12:30', section: 'Why these three sit together — what they have in common' },
        ],
        tags: [
          'creepy stories',
          'true scary stories',
          'lets not meet',
          'true horror',
          'home invasion stories',
          'subscriber submissions',
          'reddit horror stories',
          'real horror',
          'scary stories at night',
        ],
      },
      comment:
        '🚨 Submission policy update — I am taking new stories for the September lineup until the 15th. If you submit, please include where you were, roughly when, and how it ended (or if it never did). I read every email. I do not read every DM. — H.',
      shorts: {
        hook:
          'She turned the kitchen light off before she went upstairs. Twenty minutes later it was on again. The full story is on the channel now.',
        script:
          'Three subscribers wrote in this month with the same shape of story.\n\nThey came home. Something was wrong. A light. A door. A chair that had moved.\n\nNone of them called the police that night. Every one of them wishes they had.\n\nFull episode is up — link below.',
        cta: 'New episode every Tuesday at 9 PM Eastern. The dark hour.',
      },
    },
  },
  {
    id: 'urban-legend',
    channelName: 'Old American Tales',
    channelType: 'Urban legends and regional folklore',
    videoTopic:
      'The Bell Witch of Adams, Tennessee — what the historical record actually says happened',
    topicSource:
      'Public-domain Bell family memoir (1846), local Tennessee newspaper archives, and the 1894 retelling by the Goodspeed historical society.',
    outputs: {
      script: {
        coldOpen:
          'In 1817, the most powerful man in Tennessee took a meeting with a ghost. The man was Andrew Jackson — future president, war hero, slaveholder. He rode three days from Nashville to a farmhouse in Adams to see for himself. He left after one night. And for the rest of his life, when anyone asked him about it, he gave the same answer. "I would rather fight the entire British army than spend another night in that house."',
        bodyExcerpt:
          '[BEAT]\n\nThe historical record on the Bell Witch is messier than the legend. The first written account does not appear until 1846 — almost thirty years after the events. It is a memoir written by Richard Williams Bell, who was six years old when the haunting began. He wrote it as an adult, decades later, working from his own memory and the testimony of older family members who had since died.\n\nThat is the document the entire legend is built on.\n\n[PACING NOTE — let this land. The audience needs to understand we are not retelling folklore as fact. We are tracing how folklore gets built.]\n\nThe Goodspeed historical society added their version in 1894, drawing partly from the Bell memoir and partly from oral tradition that had grown in the seventy years since. By the 1930s the story had been retold so many times that the original details had calcified into something else entirely.',
        cta:
          'If you are from Tennessee — or anywhere with a haunting that locals still talk about — drop the place in the comments. I am building the next episode list and I take suggestions seriously.',
        wordCount: '~2,800 words · 14–16 min runtime',
      },
      titles: {
        variants: [
          {
            title: 'The Bell Witch: What The Historical Record Actually Says',
            angle: 'Authority framing ("historical record") differentiates from competitors\' "scary story" version',
          },
          {
            title: 'Andrew Jackson Spent One Night With The Bell Witch. He Never Forgot It.',
            angle: 'Famous-person hook + intrigue, doesn\'t spoil the actual content',
          },
          {
            title: 'The Most Famous Haunting In American History — Investigated',
            angle: 'Superlative ("most famous") + investigative framing, broad hook',
          },
          {
            title: 'Why Tennessee Locals Still Will Not Camp At The Bell Farm',
            angle: 'Specificity + unresolved tension, leverages "local knowledge" as evidence',
          },
        ],
      },
      thumbnail: {
        primaryConcept:
          'Sepia-aged photograph composite of the Bell farmhouse exterior, with one second-floor window glowing unnaturally bright. Andrew Jackson\'s portrait silhouetted in the lower-right corner.',
        visualDirection:
          'Period-document aesthetic — distressed paper texture, hand-drawn map elements at the edges. The visual language is "archive, not horror movie." That positions this above the typical urban-legend channel.',
        textOverlayOptions: [
          'THE NIGHT JACKSON LEFT',
          'WHAT THE RECORD SAYS',
          'TENNESSEE 1817',
        ],
        colorNotes:
          'Stay desaturated — sepia, ink-blue, cream. Reserve any red accent for the channel logo only. The credibility of the channel is in restraint.',
      },
      description: {
        intro:
          'The Bell Witch is one of the most documented hauntings in American history — and one of the least carefully examined. In this episode we go back to the original 1846 Bell family memoir, the 1894 Goodspeed account, and the local Tennessee newspaper record to ask what we actually know vs. what generations of retelling have added.',
        timestamps: [
          { time: '0:00', section: 'Cold open — Andrew Jackson at the Bell farm' },
          { time: '1:55', section: 'The original 1846 memoir — what it does and does not say' },
          { time: '4:22', section: 'The 1894 Goodspeed account — and how the legend grew' },
          { time: '8:10', section: 'The Adams locals who still will not visit the property' },
          { time: '11:47', section: 'What modern historians have to say' },
          { time: '14:30', section: 'What the Bell family said the witch wanted' },
        ],
        tags: [
          'bell witch',
          'tennessee folklore',
          'american urban legends',
          'haunted history',
          'historical hauntings',
          'andrew jackson bell witch',
          'adams tennessee',
          'documented hauntings',
          'real ghost stories',
        ],
      },
      comment:
        '📍 Source notes for this episode are pinned in the video description. The 1846 Bell memoir is public-domain and freely readable online — link is there. If you spot something I got wrong about the historical record, leave it below; I correct in pinned comments rather than hiding mistakes.',
      shorts: {
        hook:
          'Andrew Jackson spent one night at the Bell farm in 1817. For the rest of his life he said he would rather fight the British army than do it again.',
        script:
          'The Bell Witch is the most famous haunting in American history. But the original document — the one everything else is built on — was written almost thirty years after the events.\n\nIt was written by a six-year-old boy. As an adult. Decades later. From memory.\n\nThat is the foundation. Everything you have ever heard about the Bell Witch was built on top of that.\n\nFull episode is up.',
        cta: 'New investigation every Friday. Old American Tales — link is below.',
      },
    },
  },
  {
    id: 'paranormal-location',
    channelName: 'After Dark Geography',
    channelType: 'Paranormal investigations of haunted locations',
    videoTopic:
      'The Sloss Furnaces in Birmingham, Alabama — industrial accidents, the foreman who never left, and what visitors still report at the catwalks',
    topicSource:
      'Birmingham News archives 1887–1971, Sloss Furnaces National Historic Landmark visitor logs, and three on-site investigation transcripts (publicly released, anonymized).',
    outputs: {
      script: {
        coldOpen:
          'For eighty-four years, the Sloss Furnaces ran day and night. The fire never went out. Six thousand men cycled through over those decades — pouring iron, loading ore, walking catwalks suspended above molten metal. The official accident records show that 47 of them died there. The unofficial number is higher. And one of them, by every account that has ever been recorded, never left.',
        bodyExcerpt:
          '[BEAT]\n\nHis name was James "Slag" Wormwood. He was a graveyard-shift foreman in the early 1900s, and depending on which historical account you read he was either a feared and brutal supervisor or — more charitably — a man whose entire life was the night shift and whose only authority came from the catwalk above the furnaces.\n\nIn October 1906 he fell into a pour. The accident report from the Birmingham News said it was an accident.\n\nThe men who worked under him said it was not.\n\n[PACING NOTE — pause here. Let the audience sit with the implication. Do not rush into the haunting beats yet. The ground-truth detail of working conditions is what makes the haunting credible.]',
        cta:
          'I read every comment. If you have been to Sloss Furnaces — especially the catwalks at the south end — leave what you remember. The good submissions become future investigations.',
        wordCount: '~2,600 words · 13–15 min runtime',
      },
      titles: {
        variants: [
          {
            title: 'The Birmingham Foreman Who Fell Into A Furnace In 1906 (And Never Left)',
            angle: 'Specificity (city, year, role) + the central beat in the title',
          },
          {
            title: 'Sloss Furnaces, Alabama — The Most Active Haunting In The American South',
            angle: 'Superlative + region-specific, hits viewers in the South directly',
          },
          {
            title: 'Why Tour Guides At This Birmingham Landmark Will Not Walk The Catwalks Alone',
            angle: 'Local-knowledge framing — "tour guides won\'t" is more credible than "ghost"',
          },
          {
            title: 'The Industrial Accident That Birmingham Has Been Trying To Forget Since 1906',
            angle: 'History-first hook for viewers who do not bite on overtly paranormal titles',
          },
        ],
      },
      thumbnail: {
        primaryConcept:
          'Wide low-angle shot of the Sloss Furnaces stacks at dusk, silhouetted against an orange-red sky. A single human figure at the top of a catwalk, standing where no one should be standing. Composite — the figure is small enough that the eye finds it second.',
        visualDirection:
          'Industrial-archaeological aesthetic — rust, iron, ember-orange against navy blue. Avoid the over-saturated horror look. This channel\'s credibility is "investigation, not jump scare." The location is the star, the figure is the punctuation.',
        textOverlayOptions: [
          'THE CATWALK',
          '1906',
          'HE FELL. HE STAYED.',
        ],
        colorNotes:
          'Ember-orange highlights against deep navy/black is the channel\'s established palette. Keep the figure desaturated — let the location carry the visual weight.',
      },
      description: {
        intro:
          'Sloss Furnaces ran from 1882 to 1971. In those 84 years it became one of the most productive iron operations in the American South — and one of the most dangerous workplaces in industrial history. This episode investigates the death of foreman James "Slag" Wormwood in 1906, what 47 official fatalities tell us about safety records of the era, and what visitors to the site still report on the south catwalks today.',
        timestamps: [
          { time: '0:00', section: 'Cold open — 84 years of fire' },
          { time: '2:14', section: 'Working conditions on the night shift, 1900–1910' },
          { time: '5:08', section: 'James Wormwood — what the 1906 accident report said' },
          { time: '7:42', section: 'What the men who worked under him said' },
          { time: '10:15', section: 'The catwalk reports from 1971 to today' },
          { time: '12:50', section: 'What three on-site investigations have actually documented' },
        ],
        tags: [
          'sloss furnaces',
          'birmingham haunted',
          'haunted alabama',
          'haunted locations',
          'industrial haunting',
          'james wormwood slag',
          'most haunted south',
          'paranormal investigation',
          'haunted historical landmarks',
        ],
      },
      comment:
        '📍 Sloss Furnaces is open to the public during daylight hours and runs official "Behind the Boilers" tours after dark in October. If you visit — be respectful, follow the marked path, and do not climb the south catwalks. The reasons are in the video. Source list pinned. — A.',
      shorts: {
        hook:
          'In 1906 the night-shift foreman at the Sloss Furnaces fell into a pour of molten iron. The accident report said it was an accident. The men who worked under him said it was not.',
        script:
          'For 84 years the Sloss Furnaces ran day and night in Birmingham, Alabama.\n\n47 men died on the official record. The real number was higher.\n\nOne of them — by every account that has ever been recorded — never left the catwalks.\n\nFull investigation is up on the channel.',
        cta: 'New location every Sunday. After Dark Geography — link below.',
      },
    },
  },
];

const outputTabs: { id: OutputId; label: string; icon: React.ReactNode }[] = [
  { id: 'script', label: 'Narration Script', icon: <AlignLeft className="w-4 h-4" /> },
  { id: 'titles', label: 'Title Variants', icon: <Type className="w-4 h-4" /> },
  { id: 'thumbnail', label: 'Thumbnail Brief', icon: <ImageIcon className="w-4 h-4" aria-hidden="true" /> },
  { id: 'description', label: 'Description + Tags', icon: <FileText className="w-4 h-4" /> },
  { id: 'comment', label: 'Pinned Comment', icon: <MessageSquare className="w-4 h-4" /> },
  { id: 'shorts', label: 'Shorts Teaser', icon: <Video className="w-4 h-4" /> },
];

export function DarkStoryDemo() {
  const [selectedChannelId, setSelectedChannelId] = useState(channels[0].id);
  const [selectedOutput, setSelectedOutput] = useState<OutputId>('script');

  const channel = channels.find((c) => c.id === selectedChannelId) ?? channels[0];

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
      {/* Channel picker */}
      <div role="group" aria-label="Sample channels" className="flex flex-col sm:flex-row border-b border-white/10">
        {channels.map((c) => {
          const isActive = c.id === selectedChannelId;
          return (
            <button
              key={c.id}
              type="button"
              aria-current={isActive ? 'true' : undefined}
              onClick={() => setSelectedChannelId(c.id)}
              className={`flex-1 px-5 py-4 text-left text-sm transition-colors border-b sm:border-b-0 sm:border-r border-white/10 last:border-r-0 last:border-b-0 ${
                isActive
                  ? 'bg-primary/[0.06] text-white'
                  : 'text-foreground/60 hover:bg-white/[0.02] hover:text-foreground/80'
              }`}
            >
              <div className="text-[10px] font-mono tracking-widest mb-1 text-primary/70 flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                {c.channelType.toUpperCase()}
              </div>
              <div className="font-medium">{c.channelName}</div>
            </button>
          );
        })}
      </div>

      {/* Topic info */}
      <div className="px-6 md:px-8 pt-6 pb-5 border-b border-white/10">
        <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-2">
          INPUT — VIDEO TOPIC
        </div>
        <h3 className="text-base font-semibold text-white mb-2 leading-snug">{channel.videoTopic}</h3>
        <p className="text-xs text-foreground/55 leading-relaxed italic">{channel.topicSource}</p>
      </div>

      {/* Output tabs */}
      <div className="px-6 md:px-8 pt-5">
        <div className="text-[10px] font-mono text-primary/80 tracking-widest mb-3">
          OUTPUTS — READY TO RECORD AND UPLOAD
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
        {selectedOutput === 'script' && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="flex items-baseline justify-between mb-4">
              <div className="text-[10px] font-mono text-foreground/45 tracking-widest">
                NARRATION SCRIPT — EXCERPT
              </div>
              <div className="text-[10px] font-mono text-primary/70">
                {channel.outputs.script.wordCount}
              </div>
            </div>
            <div className="mb-5">
              <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-2">
                COLD OPEN (0–30s)
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {channel.outputs.script.coldOpen}
              </p>
            </div>
            <div className="mb-5">
              <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-2">
                BODY — EXCERPT
              </div>
              <p className="text-sm text-foreground/75 leading-relaxed whitespace-pre-line">
                {channel.outputs.script.bodyExcerpt}
              </p>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-2">
                CTA / SUBSCRIBE BEAT
              </div>
              <p className="text-sm text-foreground/75 leading-relaxed">
                {channel.outputs.script.cta}
              </p>
            </div>
          </div>
        )}

        {selectedOutput === 'titles' && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-4">
              TITLE VARIANTS — A/B TEST READY
            </div>
            <ol className="space-y-4">
              {channel.outputs.titles.variants.map((v, i) => (
                <li key={v.title} className="border-l-2 border-primary/40 pl-4">
                  <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-1">
                    OPTION {String.fromCharCode(65 + i)}
                  </div>
                  <div className="text-sm font-semibold text-white mb-1.5">{v.title}</div>
                  <div className="text-xs text-foreground/55 leading-relaxed italic">{v.angle}</div>
                </li>
              ))}
            </ol>
          </div>
        )}

        {selectedOutput === 'thumbnail' && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-4">
              THUMBNAIL CONCEPT BRIEF
            </div>
            <div className="mb-5">
              <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-2">
                PRIMARY CONCEPT
              </div>
              <p className="text-sm text-white leading-relaxed">
                {channel.outputs.thumbnail.primaryConcept}
              </p>
            </div>
            <div className="mb-5">
              <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-2">
                VISUAL DIRECTION
              </div>
              <p className="text-sm text-foreground/75 leading-relaxed">
                {channel.outputs.thumbnail.visualDirection}
              </p>
            </div>
            <div className="mb-5">
              <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-2">
                TEXT OVERLAY OPTIONS
              </div>
              <div className="flex flex-wrap gap-2">
                {channel.outputs.thumbnail.textOverlayOptions.map((opt) => (
                  <span
                    key={opt}
                    className="px-3 py-1.5 rounded border border-primary/30 bg-primary/[0.06] text-xs font-mono text-white tracking-wider"
                  >
                    {opt}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-2">
                COLOR / TONE NOTES
              </div>
              <p className="text-sm text-foreground/65 leading-relaxed">
                {channel.outputs.thumbnail.colorNotes}
              </p>
            </div>
          </div>
        )}

        {selectedOutput === 'description' && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              DESCRIPTION — TOP SECTION
            </div>
            <p className="text-sm text-foreground/75 leading-relaxed mb-5">
              {channel.outputs.description.intro}
            </p>
            <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-3">
              TIMESTAMPS
            </div>
            <div className="rounded-md border border-white/10 bg-black/40 p-3 mb-5 font-mono text-xs">
              {channel.outputs.description.timestamps.map((ts) => (
                <div key={ts.time} className="flex gap-3 py-0.5">
                  <span className="text-primary/80 shrink-0 w-12">{ts.time}</span>
                  <span className="text-foreground/70">{ts.section}</span>
                </div>
              ))}
            </div>
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              SEO TAGS
            </div>
            <div className="flex flex-wrap gap-2">
              {channel.outputs.description.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded border border-white/10 bg-white/[0.02] text-xs text-foreground/65"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {selectedOutput === 'comment' && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              PINNED COMMENT — ENGAGEMENT HOOK
            </div>
            <div className="rounded-md border border-primary/30 bg-primary/[0.04] p-4">
              <p className="text-sm text-white leading-relaxed">{channel.outputs.comment}</p>
            </div>
            <p className="text-xs text-foreground/45 leading-relaxed italic mt-4">
              Pinned comments drive replies, which signal engagement to the algorithm. Format-matched to the channel&apos;s existing comment style and tone.
            </p>
          </div>
        )}

        {selectedOutput === 'shorts' && (
          <div className="rounded-lg border border-white/10 bg-black/30 p-5 md:p-6">
            <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-3">
              SHORTS / TIKTOK TEASER — 60 SECONDS
            </div>
            <div className="mb-4">
              <div className="text-[10px] font-mono text-primary/70 tracking-widest mb-1.5">
                HOOK (0–5s)
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed">
                {channel.outputs.shorts.hook}
              </p>
            </div>
            <div className="mb-4">
              <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-1.5">
                BODY (5–55s)
              </div>
              <p className="text-sm text-foreground/75 leading-relaxed whitespace-pre-line">
                {channel.outputs.shorts.script}
              </p>
            </div>
            <div className="border-t border-white/10 pt-4">
              <div className="text-[10px] font-mono text-foreground/45 tracking-widest mb-1.5">
                CTA / CHANNEL TAG (55–60s)
              </div>
              <p className="text-sm text-foreground/75 leading-relaxed">
                {channel.outputs.shorts.cta}
              </p>
            </div>
          </div>
        )}

        <p className="text-[11px] font-mono text-foreground/35 mt-4 leading-relaxed flex items-start gap-2">
          <Quote className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Sample outputs are illustrative. Your delivery is voice-matched to your channel&apos;s existing tone, pacing, and audience expectations — not these.
          </span>
        </p>
      </div>
    </div>
  );
}
