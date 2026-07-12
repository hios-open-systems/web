import { WiringGuideView } from '@/components/wiring-guide';
import { BTDAC_WIRING } from '@/config/pinouts/btdac';
import { setRequestLocale } from 'next-intl/server';

export const runtime = 'edge';

export const metadata = {
  title: 'BTDAC · Guía de cableado | HIOS Platform',
  description:
    'Guía de cableado del receptor Bluetooth BTDAC: I2S del ESP32 al DAC PCM5102, LED RGB KY-009 y fuente 2S, con checklist de armado.',
};

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function BtdacWiringPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);

  return <WiringGuideView guide={BTDAC_WIRING} />;
}
