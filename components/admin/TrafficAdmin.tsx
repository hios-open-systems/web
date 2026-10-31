'use client';
import { Table } from 'antd';
import { useAdminTraffic } from '@/lib/hooks/useAdminTraffic';
import type { RequestBreakdown, TrafficClient, Ranked } from '@/lib/traffic/read';
import styles from './adminPanel.module.css';

function Tiles({ items }: { items: [string, number][] }) {
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

function requestTotals(rows: RequestBreakdown[]) {
  const sum = (filter: (row: RequestBreakdown) => boolean) => rows.filter(filter).reduce((total, row) => total + row.requests, 0);
  return { humans: sum(row => !row.bot), bots: sum(row => !!row.bot), errors: sum(row => row.status >= 400), api: sum(row => row.kind === 'api') };
}

const clientColumns = [
  { title: 'Cliente', dataIndex: 'client', render: (value: string, row: TrafficClient) => <span title={row.ua}>{value}{row.bot ? ' 🤖' : ''}</span> },
  { title: 'Red', dataIndex: 'ip_prefix', render: (value: string, row: TrafficClient) => <span title={row.as_org}>{value} · AS{row.asn}</span> },
  { title: 'País', dataIndex: 'country', width: 60 },
  { title: 'Req', dataIndex: 'requests', width: 70, align: 'right' as const },
  { title: 'Err', dataIndex: 'errors', width: 60, align: 'right' as const },
  { title: '404', dataIndex: 'not_found', width: 60, align: 'right' as const },
  { title: 'Último', dataIndex: 'last_path', render: (value: string, row: TrafficClient) => <span title={row.last_seen}>{row.last_status} {value}</span> },
];

export function TrafficAdmin({ days }: { days: number }) {
  const { data, failed } = useAdminTraffic(days, true);
  if (failed) return <p className={styles.note}>No se pudo cargar el tráfico.</p>;
  if (!data) return <p>…</p>;
  const { summary, requests, clients } = data;
  const totals = requestTotals(requests);
  return <>
    <section className={styles.section}><h2 className={styles.sectionTitle}>Tráfico real</h2>
      <Tiles items={[['Visitantes (únicos/día)', summary.totals.visitors], ['Vistas', summary.totals.views],
        ['Requests humanos', totals.humans], ['Requests bots', totals.bots], ['Errores 4xx/5xx', totals.errors], ['API', totals.api]]} />
      <p className={styles.note}>Contado por el Worker, sin opt-in. Requests = lo que pasa por el Worker (páginas, navegación, API); los archivos estáticos no cuentan. Sin MB: no aporta nada.</p>
    </section>
    <List title="Páginas" rows={summary.pages} />
    <List title="Referrers" rows={summary.referrers} />
    <List title="Países" rows={summary.countries} />
    <section className={styles.section}><h2 className={styles.sectionTitle}>Clientes más pesados (máx. 14 días)</h2>
      <p className={styles.note}>IP nunca guardada: cliente = hash. Para bloquear: Cloudflare → Security → WAF → regla con el prefijo de red, el ASN o el user agent (pasá el mouse para verlo).</p>
      <Table size="small" rowKey={row => row.client + row.ua} pagination={{ pageSize: 20 }} scroll={{ x: 760 }}
        dataSource={clients} columns={clientColumns} />
    </section>
  </>;
}
