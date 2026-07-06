import { ImageResponse } from 'next/og';
import { computeQuickSupportTax } from '@/lib/support-tax-math';
import { parseSupportTaxShareState } from '@/lib/support-tax-share-state';

// Personalized Reddit/social card for shared support-tax links. Reads the
// calculator's share-state query (?v=&c=&r=&t=), clamps it via
// parseSupportTaxShareState, and renders the sharer's annual repeat-ticket
// cost. With no params the parse returns the calculator defaults
// (1,500 tickets/mo x 40% repeat x $15 = $108,000/yr), reproducing the static
// card this route replaced. The annual number is pinned by
// src/lib/support-tax-math.test.ts.

export const runtime = 'edge';

const usd = (n: number) => `$${Math.round(n).toLocaleString()}`;
const count = (n: number) => Math.round(n).toLocaleString();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const state = parseSupportTaxShareState(searchParams);
  const { annualTax } = computeQuickSupportTax({
    monthlyTickets: state.monthlyTickets,
    costPerTicket: state.costPerTicket,
    repeatShare: state.repeatPct / 100,
    touchHoursPerTicket: state.touchMinutes / 60,
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          backgroundColor: '#0a0a12',
          backgroundImage: 'linear-gradient(135deg, #050507 0%, #0a0a12 50%, #0f1018 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            letterSpacing: 4,
            color: '#7dd3fc',
            textTransform: 'uppercase',
          }}
        >
          juancanfield.com · 30-Second Calculator
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 64,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              color: '#ffffff',
              marginBottom: 24,
            }}
          >
            What your repeat tickets cost, in 30 seconds.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: -2,
              color: '#f87171',
              marginBottom: 24,
            }}
          >
            {usd(annualTax)} / year
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              lineHeight: 1.4,
              color: '#a1a1aa',
            }}
          >
            At {count(state.monthlyTickets)} tickets a month with {state.repeatPct}% repeats. The
            formula is on the page and every assumption is a slider — think we are wrong? Change them.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 24,
            borderTop: '1px solid #27272a',
            fontSize: 22,
            color: '#71717a',
          }}
        >
          <div style={{ display: 'flex' }}>Support Tax Calculator</div>
          <div style={{ display: 'flex' }}>Two inputs · Shareable result URL · No signup</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
