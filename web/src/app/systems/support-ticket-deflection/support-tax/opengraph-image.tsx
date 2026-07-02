import { ImageResponse } from 'next/og';

// Reddit-facing OG card for the 30-second support-tax calculator. The
// headline number is the calculator's default-inputs annual total, pinned by
// src/lib/support-tax-math.test.ts (computeQuickSupportTax at 1,500
// tickets/mo x 40% repeat x $15 = $108,000/yr) — if the model changes, that
// suite fails first and this copy is updated in the same slice.

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt =
  'What your repeat tickets cost, in 30 seconds — $108K a year at 1,500 tickets a month. Every assumption editable.';

export default async function OpenGraphImage() {
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
            $108,000 / year
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              lineHeight: 1.4,
              color: '#a1a1aa',
            }}
          >
            At 1,500 tickets a month with 40% repeats. The formula is on the page and every
            assumption is a slider — think we are wrong? Change them.
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
    { ...size },
  );
}
