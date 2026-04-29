import { generatePageMetadata } from '@/lib/seo';

export const metadata = generatePageMetadata({
  title: 'AI Automation Consultant',
  description:
    'AI automation consulting for teams with real operational workflows. Fixed-fee AI systems roadmap, proof of concept, and custom AI implementation scope before build work begins.',
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
