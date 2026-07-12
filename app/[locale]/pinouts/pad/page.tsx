import { WiringGuideView } from '@/components/wiring-guide';
import { PAD_WIRING } from '@/config/pinouts/pad';
import { setRequestLocale } from 'next-intl/server';

export const runtime = 'edge';

export const metadata = {
  title: 'HIOS PAD · Guía de cableado | HIOS Platform',
  description:
    'Guía de cableado del macropad ESP32-S3: mapa de GPIO, matriz de botones, amplificadores I2S MAX98357A y checklist de armado.',
};

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function PadWiringPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);

  return <WiringGuideView guide={PAD_WIRING} />;
}
