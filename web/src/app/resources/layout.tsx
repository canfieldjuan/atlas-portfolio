import { generatePageMetadata } from '@/lib/seo';

export const metadata = generatePageMetadata({
  title: 'AI Automation Resources',
  description:
    'Practical resources on AI automation consulting, custom AI development, workflow scoping, human review, and fixed-fee AI systems roadmaps.',
  path: '/resources',
  keywords: [
    'AI automation resources',
    'AI automation consultant',
    'custom AI development services',
    'AI workflow automation consultant',
    'AI systems roadmap',
    'human in the loop AI workflow',
  ],
});

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
