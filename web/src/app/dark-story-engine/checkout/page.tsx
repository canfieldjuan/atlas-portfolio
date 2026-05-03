import { generatePageMetadata } from '@/lib/seo';
import CheckoutForm, { type PlanInfo } from './CheckoutForm';

export const metadata = generatePageMetadata({
  title: 'Checkout — Dark Story Engine',
  description:
    'Subscribe to the Dark Story Engine. Tell us about your channel and start receiving voice-matched, upload-ready video packages — script, titles, thumbnail brief, description, pinned comment, Shorts teaser.',
  path: '/dark-story-engine/checkout',
});

const PLANS: Record<string, PlanInfo> = {
  trial: {
    id: 'trial',
    name: 'Single Video Trial',
    price: '$99',
    cadence: ' one-time',
    description:
      'One topic, full 6-output package, voice-matched to your channel. No subscription commitment. Decide from the actual output, not the pitch.',
    videos: '1 video package',
  },
  cadence: {
    id: 'cadence',
    name: 'Channel Cadence',
    price: '$497',
    cadence: '/month',
    description:
      'For channels publishing 2× per week. 8 video packages per month with full 6-output delivery on each.',
    videos: '8 / month',
  },
  engine: {
    id: 'engine',
    name: 'Channel Engine',
    price: '$997',
    cadence: '/month',
    description:
      'For daily-ish cadence. 16 video packages per month, channel voice profile, light content calendar, priority turnaround. Most popular.',
    videos: '16 / month',
  },
  authority: {
    id: 'authority',
    name: 'Channel Authority',
    price: '$1,997',
    cadence: '/month',
    description:
      'For high-volume channels. 20+ packages per month, monthly thumbnail revisions, content strategy review, story-sourcing help, optional upload support.',
    videos: '20+ / month',
  },
};

type CheckoutPageProps = {
  searchParams: Promise<{ plan?: string | string[] }>;
};

function pickFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const requestedPlan = pickFirst(params.plan) ?? 'trial';
  const plan = PLANS[requestedPlan] ?? PLANS.trial;

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 relative z-10">
      <div className="max-w-5xl mx-auto">
        <CheckoutForm plan={plan} />
      </div>
    </main>
  );
}
