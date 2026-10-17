import { translatedMetadata } from '@/lib/seo-metadata';
import { ComposerClient } from '@/components/tools/composer/ComposerClient';
import { setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

// Fully static: prerenderizada por locale y servida del static-assets cache
// (open-next.config.ts). El composer en si es client-only (ssr:false).
export const dynamic = 'force-static';
export const generateMetadata = translatedMetadata('/composer', 'Workbench.packs.chiptune', 'description');

interface PageProps {
  params: Promise<{ locale: string }>;
}

const locales = ['en', 'es', 'de', 'it'];
export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function ComposerPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main style={{ maxWidth: 'min(100%, 1780px)', width: '100%', margin: '0 auto', padding: 'clamp(20px, 4vw, 36px) var(--layout-gutter, 24px) 72px' }}>
      <Suspense fallback={null}>
        <ComposerClient />
      </Suspense>
    </main>
  );
}
