import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { WorkbenchLanding } from '@/components/workbench/WorkbenchLanding';

export const metadata: Metadata = {
  title: 'Herramientas | HIOS',
  description: 'Catalogo de herramientas locales para audio, desarrollo, validacion y electronica.',
};

export const runtime = 'edge';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ToolsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 56px' }}>
      <WorkbenchLanding />
    </main>
  );
}
