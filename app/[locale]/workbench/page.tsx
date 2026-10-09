import { translatedMetadata } from '@/lib/seo-metadata';
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { WorkbenchLanding } from '@/components/workbench/WorkbenchLanding';

export const dynamic = 'force-static';
export const generateMetadata = translatedMetadata('/workbench', 'Workbench.landing', 'subtitle');

interface PageProps {
  params: Promise<{ locale: string }>;
}

const locales = ['en', 'es', 'de', 'it'];
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function WorkbenchPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 24px 56px' }}>
      <Suspense fallback={null}>
        <WorkbenchLanding />
      </Suspense>
    </main>
  );
}