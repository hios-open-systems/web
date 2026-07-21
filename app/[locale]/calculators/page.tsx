import { EmbeddedCalculators } from '@/components/tools/EmbeddedCalculators';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Embedded Calculators | HIOS',
  description: 'Calculadoras de resistencias, capacitores, potencia térmica y consumo para proyectos embebidos.',
};


interface PageProps {
  params: Promise<{ locale: string }>;
}

// SSG: sin esto la página se renderiza on-demand y arranca el Worker en cada
// request (cold-start del bundle antd → timeout/503 en isolate frío). Con
// generateStaticParams se prerendera por locale y se sirve del edge cache.
const locales = ['en', 'es', 'de', 'it'];
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function CalculatorsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '40px 24px 72px' }}>
      <Suspense fallback={null}>
        <EmbeddedCalculators />
      </Suspense>
    </main>
  );
}
