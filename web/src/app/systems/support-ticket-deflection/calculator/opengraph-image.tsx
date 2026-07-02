import { ImageResponse } from 'next/og';

// LinkedIn-facing OG card for the leaky-bucket calculator lander. The
// headline number is the calculator's default-inputs total, pinned by
// src/lib/support-tax-math.test.ts (computeLeakyBucketLeak at the shipped
// defaults, ~$268,230/yr) — if the model changes, that suite fails first
// and this copy is updated in the same slice.

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt =
  'Your repeat tickets are a leaky bucket — the average 10-agent support team leaks about $268K a year.';

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
          juancanfield.com · Support Ticket Deflection
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
            Your repeat tickets are a leaky bucket.
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
            ~$268,000 / year
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              lineHeight: 1.4,
              color: '#a1a1aa',
            }}
          >
            What a 10-agent support team leaks on repeat questions, context gathering, and
            repetition-driven churn — at conservative defaults.
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
          <div style={{ display: 'flex' }}>Leaky Bucket Calculator</div>
          <div style={{ display: 'flex' }}>Those are not your numbers. Fix them in 2 minutes.</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
