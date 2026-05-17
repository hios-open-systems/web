import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SnippetsWorkspace } from '@/components/workbench/SnippetsWorkspace';
import { ToolPager } from '@/components/workbench/ToolPager';

export const metadata: Metadata = {
  title: 'Snippets | HIOS Workbench',
  description: 'Notas rápidas, comandos y recipes con modo local-first y backup opcional en cuenta dentro de HIOS Workbench.',
};

export const runtime = 'edge';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function WorkbenchSnippetsPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 56px' }}>
      <SnippetsWorkspace />
      <ToolPager currentId="snippets" />
    </main>
  );
}