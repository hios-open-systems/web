import type { Metadata } from 'next';
import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import { WorkbenchLanding } from '@/components/workbench/WorkbenchLanding';

// Fully static: prerenderizada por locale y servida del static-assets cache
// (open-next.config.ts). Evita el re-render SSR de antd en cada isolate frío.
export const dynamic = 'force-static';
export const metadata: Metadata = {
  title: 'Workbench | HIOS',
  description: 'Workspace local-first para payloads, snippets y flujos prácticos de desarrollo.',
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

export default async function WorkbenchPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 56px' }}>
      <Suspense fallback={null}>
        <WorkbenchLanding />
      </Suspense>
    </main>
  );
}