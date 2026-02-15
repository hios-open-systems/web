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

export default async function CalculatorsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 56px' }}>
      <Suspense fallback={null}>
        <EmbeddedCalculators />
      </Suspense>
    </main>
  );
}
