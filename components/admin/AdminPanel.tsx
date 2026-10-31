'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useCurrentUser } from '@/lib/hooks/useCurrentUser';
import { useUsageSummary } from '@/lib/hooks/useUsageSummary';
import { UsageAnalyticsResults } from '@/components/workbench/UsageAnalyticsResults';
import { TrafficAdmin } from './TrafficAdmin';
import styles from './adminPanel.module.css';

export function AdminPanel() {
  const locale = useLocale();
  const { user, isLoading } = useCurrentUser();
  const [days, setDays] = useState(30);
  const { data, status } = useUsageSummary(days, 'all', !!user?.isOwner);
  if (isLoading) return <main className={styles.page}><p>…</p></main>;
  if (!user?.isOwner) return <main className={styles.page}><h1>403</h1><p>Esta sección es del dueño del sitio.</p>
    {!user ? <a href={'/api/auth/github/start?next=/' + locale + '/admin'}>Iniciar sesión →</a> : null}</main>;
  return <main className={styles.page}>
    <header className={styles.head}><span className={'tech-label ' + styles.kicker}>HIOS / ADMIN</span><h1 className={styles.title}>Panel</h1>
      <div className={styles.rangeRow} role="radiogroup" aria-label="Rango">{[7, 30, 90].map(value =>
        <button key={value} type="button" role="radio" aria-checked={value === days} onClick={() => setDays(value)}
          className={styles.rangeButton + (value === days ? ' ' + styles.rangeButtonActive : '')}>{value}d</button>)}</div>
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

function AdminLinks({ locale }: { locale: string }) {
  return <section className={styles.section}><h2 className={styles.sectionTitle}>Accesos</h2><div className={styles.linksRow}>
    <Link href={'/' + locale + '/workbench/feedback'} className={styles.link}>Feedback inbox →</Link>
    <Link href={'/' + locale + '/stats'} className={styles.link}>Stats públicas →</Link>
    <a href="https://github.com/hios-open-systems/web" target="_blank" rel="noopener noreferrer" className={styles.link}>Repo →</a>
    <a href="https://dash.cloudflare.com" target="_blank" rel="noopener noreferrer" className={styles.link}>Cloudflare →</a>
  </div></section>;
}
