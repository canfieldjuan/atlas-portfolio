import { generatePageMetadata } from '@/lib/seo';
import CheckoutForm, { type PlanInfo } from './CheckoutForm';

export const metadata = generatePageMetadata({
  title: 'Checkout — Podcast Repurposing Engine',
  description:
    'Subscribe to the Podcast Repurposing Engine. Tell us about your show and start receiving voice-matched, publish-ready content from every episode.',
  path: '/podcast-repurposing/checkout',
});

const PLANS: Record<string, PlanInfo> = {
  trial: {
    id: 'trial',
    name: 'Single Episode Trial',
    price: '$149',
    cadence: ' one-time',
    description:
      'One episode, full 5-asset package. No subscription commitment. Decide from the actual output, not the pitch.',
    episodes: '1 episode',
    assetsPerEpisode: '5 assets',
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: '$297',
    cadence: '/month',
    description: 'For monthly or biweekly podcasters. Two episodes per month, five assets per episode.',
    episodes: '2 / month',
    assetsPerEpisode: '5 assets',
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    price: '$597',
    cadence: '/month',
    description: 'For weekly podcasters. Four episodes per month, 5–7 assets per episode. Most popular.',
    episodes: '4 / month',
    assetsPerEpisode: '5–7 assets',
  },
  authority: {
    id: 'authority',
    name: 'Authority',
    price: '$997',
    cadence: '/month',
    description:
      'For founder-led brands and serious business shows. 4–6 episodes per month, 7–10 assets per episode, monthly content calendar.',
    episodes: '4–6 / month',
    assetsPerEpisode: '7–10 assets',
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
