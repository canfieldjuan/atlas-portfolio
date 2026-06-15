import { generatePageMetadata } from '@/lib/seo';

export const metadata = generatePageMetadata({
  title: 'AI Automation Consultant',
  description:
    'AI automation consultant for fixed-fee roadmaps, proof of concept, and custom AI implementation scope before build work begins for operational teams.',
  path: '/ai-automation-consultant',
  keywords: [
    'AI automation consultant',
    'AI workflow automation consultant',
    'AI implementation consultant',
    'AI systems roadmap consultant',
    'business AI automation consultant',
    'custom AI development services',
  ],
});

export default function AiAutomationConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
