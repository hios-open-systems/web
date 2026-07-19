import { ImageResponse } from 'next/og';
import { getTranslations } from 'next-intl/server';

export const alt = 'HIOS — open workbench';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return ['en', 'es', 'de', 'it'].map((locale) => ({ locale }));
}

export default async function OgImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Hero' });
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 72,
          background: 'linear-gradient(135deg,#0b1220 0%,#0f172a 60%,#1e1b4b 100%)',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0b1220',
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            H
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>HIOS</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.1, maxWidth: 980 }}>
            {t('title')}
          </div>
          <div style={{ fontSize: 30, color: '#94a3b8', maxWidth: 900 }}>{t('subtitle')}</div>
        </div>
        <div style={{ fontSize: 24, color: '#cbd5e1' }}>openhios.dev · local-first · open source</div>
      </div>
    ),
    size,
  );
}
