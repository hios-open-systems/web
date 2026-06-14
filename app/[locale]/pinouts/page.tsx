import { PinoutsContent } from '@/components/pinouts/PinoutsContent';
import { setRequestLocale } from 'next-intl/server';

export const dynamic = 'force-static';

export const metadata = {
  title: 'Pinouts Interactivos | HIOS Platform',
  description: 'Explora los diagramas de pines de los módulos utilizados en nuestros proyectos de electrónica',
};

const locales = ['en', 'es', 'de', 'it'];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function PinoutsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return (
    <div>
      <PinoutsContent />
    </div>
  );
}
