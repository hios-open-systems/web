import { ComposerClient } from '@/components/tools/composer/ComposerClient';
import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { Suspense } from 'react';

// Fully static: prerenderizada por locale y servida del static-assets cache
// (open-next.config.ts). El composer en si es client-only (ssr:false).
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Compositor Chiptune | HIOS',
  description: 'Compone música chiptune en un piano-roll, escuchala en el navegador y mandala al parlante HIOS.',
};

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
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: 'clamp(24px, 5vw, 40px) var(--layout-gutter, 24px) 72px' }}>
      <Suspense fallback={null}>
        <ComposerClient />
      </Suspense>
    </main>
  );
}
