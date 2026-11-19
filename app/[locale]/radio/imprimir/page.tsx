import { setRequestLocale } from 'next-intl/server';
import { createPageMetadata } from '@/lib/seo';
import { PrintGuide } from '@/components/radio/print/PrintGuide';

// Versión imprimible de la guía (fuente del PDF). El contenido es en español.
export const dynamic = 'force-static';
export const dynamicParams = false;

const locales = ['en', 'es', 'de', 'it'];
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return createPageMetadata(locale, '/radio/imprimir', 'Guía de estudio Novicio (imprimible) · Radioaficionado | HIOS', 'Versión imprimible de la guía de estudio para el examen de radioaficionado Novicio de ENACOM.');
}

export default async function RadioPrintPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PrintGuide />;
}
