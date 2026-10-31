'use client';
import Link from 'next/link';
import { Table } from 'antd';
import { useLocale } from 'next-intl';
import { useAdminTraffic } from '@/lib/hooks/useAdminTraffic';
import type { RequestBreakdown, Ranked } from '@/lib/traffic/read';
import styles from './adminPanel.module.css';

export function Tiles({ items }: { items: [string, number][] }) {
  return <div className={styles.tiles}>{items.map(([label, value]) => <article key={label} className={styles.tile}>
    <span className={styles.tileValue}>{value.toLocaleString('es')}</span><span className={styles.tileLabel}>{label}</span>
  </article>)}</div>;
}

function List({ title, rows }: { title: string; rows: Ranked[] }) {
  return <section className={styles.section}><h2 className={styles.sectionTitle}>{title}</h2>
    {rows.length ? <Table size="small" rowKey="name" pagination={false} dataSource={rows}
      columns={[{ title: '', dataIndex: 'name' }, { title: '#', dataIndex: 'count', width: 80, align: 'right' }]} />
      : <p className={styles.note}>Sin datos.</p>}</section>;
}

export function requestTotals(rows: RequestBreakdown[]) {
  const sum = (filter: (row: RequestBreakdown) => boolean) => rows.filter(filter).reduce((total, row) => total + row.requests, 0);
  return { humans: sum(row => !row.bot), bots: sum(row => !!row.bot), errors: sum(row => row.status >= 400), api: sum(row => row.kind === 'api') };
}

/** Traction overview for /admin. Sensitive data (clients, networks) lives in /admin/traffic. */
export function TrafficAdmin({ days }: { days: number }) {
  const locale = useLocale();
  const { data, failed } = useAdminTraffic(days, true);
  if (failed) return <p className={styles.note}>No se pudo cargar el tráfico.</p>;
  if (!data) return <p>…</p>;
  const { summary } = data;
  return <>
    <section className={styles.section}><h2 className={styles.sectionTitle}>Tráfico real</h2>
      <Tiles items={[['Visitantes (únicos/día)', summary.totals.visitors], ['Vistas', summary.totals.views]]} />
      <p className={styles.note}>Contado por el Worker, sin opt-in ni cookies. Bots, clientes pesados y redes:{' '}
        <Link href={`/${locale}/admin/traffic`}>tráfico sensible →</Link></p>
    </section>
    <List title="Páginas" rows={summary.pages} />
    <List title="Referrers" rows={summary.referrers} />
    <List title="Países" rows={summary.countries} />
  </>;
}
