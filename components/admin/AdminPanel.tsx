'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useUsageSummary } from '@/lib/hooks/useUsageSummary';
import { UsageAnalyticsResults } from '@/components/workbench/UsageAnalyticsResults';
import { TrafficAdmin } from './TrafficAdmin';
import { AdminGate, RangePicker } from './AdminGate';
import styles from './adminPanel.module.css';

function Panel() {
  const locale = useLocale();
  const [days, setDays] = useState(30);
  const { data, status } = useUsageSummary(days, 'all', true);
  return <main className={styles.page}>
    <header className={styles.head}><span className={'tech-label ' + styles.kicker}>HIOS / ADMIN</span><h1 className={styles.title}>Panel</h1>
      <RangePicker days={days} onChange={setDays} />
    </header>
    <TrafficAdmin days={days} />
    <details className={styles.section}><summary>Eventos voluntarios (opt-in, muestra parcial)</summary>
      {status === 'loading' ? <p>…</p> : null}
      {status === 'error' ? <p className={styles.note}>No se pudo cargar el resumen.</p> : null}
      {data ? <UsageAnalyticsResults data={data} /> : null}
    </details>
    <AdminLinks locale={locale} />
  </main>;
}

export function AdminPanel() {
  return <AdminGate next="/admin"><Panel /></AdminGate>;
}

function AdminLinks({ locale }: { locale: string }) {
  return <section className={styles.section}><h2 className={styles.sectionTitle}>Accesos</h2><div className={styles.linksRow}>
    <Link href={'/' + locale + '/admin/traffic'} className={styles.link}>Tráfico sensible →</Link>
    <Link href={'/' + locale + '/workbench/feedback'} className={styles.link}>Feedback inbox →</Link>
    <Link href={'/' + locale + '/stats'} className={styles.link}>Stats públicas →</Link>
    <a href="https://github.com/hios-open-systems/web" target="_blank" rel="noopener noreferrer" className={styles.link}>Repo →</a>
    <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className={styles.link}>Cloudflare →</a>
  </div></section>;
}
