import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Juan Canfield — AI Solutions Architect & AI Automation Consultant';

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
          backgroundImage:
            'linear-gradient(135deg, #050507 0%, #0a0a12 50%, #0f1018 100%)',
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
          juancanfield.com
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
              fontSize: 76,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              color: '#ffffff',
            }}
          >
            AI Solutions Architect
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 76,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              color: '#ffffff',
              marginBottom: 28,
            }}
          >
            & AI Automation Consultant
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 28,
              lineHeight: 1.4,
              color: '#a1a1aa',
            }}
          >
            Fixed-fee AI systems roadmaps, custom AI development, and
            productized AI content & intelligence pipelines.
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
          <div style={{ display: 'flex' }}>Juan Canfield</div>
          <div style={{ display: 'flex' }}>
            Phase 1 Roadmap · Custom AI Builds · Content Ops
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
