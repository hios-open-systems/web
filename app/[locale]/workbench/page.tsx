import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { WorkbenchLanding } from '@/components/workbench/WorkbenchLanding';

export const metadata: Metadata = {
  title: 'Workbench | HIOS',
  description: 'Workspace local-first para payloads, snippets y flujos prácticos de desarrollo.',
};

// WorkbenchLanding usa useSearchParams() (client). Antes esta página era
// runtime='edge' (dinámica); sin edge, Next intenta prerenderizarla estática y el
// CSR bailout de useSearchParams rompe el build. force-dynamic restaura el
// render por-request (SSR), que es lo que hacía el edge.
export const dynamic = 'force-dynamic';


interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function WorkbenchPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 56px' }}>
      <WorkbenchLanding />
    </main>
  );
}