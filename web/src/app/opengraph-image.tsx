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
          background:
            'linear-gradient(135deg, #050507 0%, #0a0a12 50%, #0f1018 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '20px',
            letterSpacing: '0.2em',
            color: '#7dd3fc',
            textTransform: 'uppercase',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '2px',
              background: '#7dd3fc',
            }}
          />
          juancanfield.com
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div
            style={{
              fontSize: '76px',
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#ffffff',
              maxWidth: '900px',
            }}
          >
            AI Solutions Architect &
            <br />
            AI Automation Consultant
          </div>
          <div
            style={{
              fontSize: '28px',
              lineHeight: 1.4,
              color: '#a1a1aa',
              maxWidth: '880px',
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
            paddingTop: '24px',
            borderTop: '1px solid #27272a',
            fontSize: '22px',
            color: '#71717a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#7dd3fc',
              }}
            />
            Juan Canfield
          </div>
          <div>Phase 1 Roadmap · Custom AI Builds · Content Ops</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
