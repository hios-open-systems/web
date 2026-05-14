import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { WorkbenchLanding } from '@/components/workbench/WorkbenchLanding';

export const metadata: Metadata = {
  title: 'Workbench | HIOS',
  description: 'Workspace local-first para payloads, snippets y flujos prácticos de desarrollo.',
};

export const runtime = 'edge';

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