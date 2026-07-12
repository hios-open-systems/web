import { WiringGuideView } from '@/components/wiring-guide';
import { SPEAKER_WIRING } from '@/config/pinouts/speaker';
import { setRequestLocale } from 'next-intl/server';

export const runtime = 'edge';

export const metadata = {
  title: 'WiFi Speaker · Guía de cableado | HIOS Platform',
  description:
    'Guía de cableado del parlante WiFi: I2S del ESP32 a 2× MAX98357 en stereo, LCD 16×2 I2C, medición del canal por SD y fuente 2S.',
};

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function SpeakerWiringPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);

  return <WiringGuideView guide={SPEAKER_WIRING} />;
}
