import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { RclCalculator } from '@/components/tools/RclCalculator';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'RCL Calculator | HIOS',
  description: 'Calculadora simple de circuitos RCL en serie para proyectos embebidos.',
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function RclPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 56px' }}>
      <Suspense fallback={null}>
        <RclCalculator />
      </Suspense>
    </main>
  );
}
