import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PrintGuide } from '@/components/radio/print/PrintGuide';

// Versión imprimible de la guía (fuente del PDF). Sólo en español, sin indexar.
export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ locale: 'es' }];
}

export const metadata: Metadata = {
  title: 'Guía de estudio Novicio (versión imprimible) | HIOS',
  robots: { index: false, follow: false },
};

export default async function RadioPrintPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrintGuide />;
}
