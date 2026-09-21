import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { SerialMonitor } from '@/components/workbench/SerialMonitor';
import { ToolPager } from '@/components/workbench/ToolPager';
import { ToolUsageTracker } from '@/components/workbench/ToolUsageTracker';

export const metadata: Metadata = {
  title: 'WebSerial Monitor | HIOS Workbench',
  description: 'Conectá tu ESP32 o Arduino directo al navegador. Lee logs y mandá payloads por puerto serie.',
};

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function SerialMonitorPage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 56px' }}>
      <ToolUsageTracker toolId="serial-monitor" />
      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, margin: '0 0 8px 0', color: 'var(--hios-text)', fontFamily: 'var(--font-stack-display)' }}>
          Serial Monitor
        </h1>
        <p style={{ margin: 0, color: 'var(--hios-text-secondary)', fontSize: 16 }}>
          Conectá directo por USB (WebSerial API). Sin drivers extra.
        </p>
      </header>
      <SerialMonitor />
      <ToolPager currentId="serial-monitor" />
    </main>
  );
}
