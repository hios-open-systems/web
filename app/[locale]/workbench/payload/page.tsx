import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { PayloadLab } from '@/components/workbench/PayloadLab';
import { ToolPager } from '@/components/workbench/ToolPager';
import { ToolUsageTracker } from '@/components/workbench/ToolUsageTracker';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Payload Lab | HIOS Workbench',
  description: 'Formatea, valida y comparte payloads JSON con un flujo local-first.',
};

export const runtime = 'edge';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PayloadPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 56px' }}>
      <ToolUsageTracker toolId="payload" />
      <Suspense fallback={null}>
        <PayloadLab />
      </Suspense>
      <ToolPager currentId="payload" />
    </main>
  );
}