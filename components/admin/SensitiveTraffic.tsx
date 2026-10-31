'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Input, Table } from 'antd';
import { useLocale } from 'next-intl';
import { useAdminTraffic } from '@/lib/hooks/useAdminTraffic';
import type { RequestBreakdown, TrafficClient } from '@/lib/traffic/read';
import { AdminGate, RangePicker } from './AdminGate';
import { Tiles, requestTotals } from './TrafficAdmin';
import styles from './adminPanel.module.css';

const clientColumns = [
  { title: 'Cliente', dataIndex: 'client', render: (value: string, row: TrafficClient) => <span title={row.ua}>{value}{row.bot ? ' 🤖' : ''}</span> },
  { title: 'Red', dataIndex: 'ip_prefix', render: (value: string, row: TrafficClient) => <code title={row.as_org}>{value}</code> },
  { title: 'ASN', dataIndex: 'asn', render: (value: number, row: TrafficClient) => <span title={row.as_org}>AS{value} {row.as_org.slice(0, 18)}</span> },
  { title: 'País', dataIndex: 'country', width: 60 },
  { title: 'Req', dataIndex: 'requests', width: 70, align: 'right' as const, sorter: (a: TrafficClient, b: TrafficClient) => a.requests - b.requests },
  { title: 'Err', dataIndex: 'errors', width: 60, align: 'right' as const, sorter: (a: TrafficClient, b: TrafficClient) => a.errors - b.errors },
  { title: '404', dataIndex: 'not_found', width: 60, align: 'right' as const, sorter: (a: TrafficClient, b: TrafficClient) => a.not_found - b.not_found },
  { title: 'User agent', dataIndex: 'ua', ellipsis: true },
  { title: 'Último', dataIndex: 'last_path', render: (value: string, row: TrafficClient) => <span title={row.last_seen}>{row.last_status} {value}</span> },
];

const requestColumns = [
  { title: 'Tipo', dataIndex: 'kind' }, { title: 'Estado', dataIndex: 'status', render: (value: number) => `${value / 100}xx` },
  { title: 'Bot', dataIndex: 'bot', render: (value: number) => value ? 'sí' : 'no' },
  { title: 'Requests', dataIndex: 'requests', align: 'right' as const },
];

function Content({ days }: { days: number }) {
  const { data, failed } = useAdminTraffic(days, true);
  const [filter, setFilter] = useState('');
  const clients = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    return (data?.clients ?? []).filter(row => !needle || [row.client, row.ip_prefix, row.ua, row.as_org, row.country, row.last_path, `as${row.asn}`]
      .some(value => value.toLowerCase().includes(needle)));
  }, [data, filter]);
  if (failed) return <p className={styles.note}>No se pudo cargar el tráfico.</p>;
  if (!data) return <p>…</p>;
  const totals = requestTotals(data.requests);
  return <>
    <Tiles items={[['Requests humanos', totals.humans], ['Requests bots', totals.bots], ['Errores 4xx/5xx', totals.errors], ['API', totals.api]]} />
    <section className={styles.section}><h2 className={styles.sectionTitle}>Clientes (máx. 14 días)</h2>
      <p className={styles.note}>La IP nunca se guarda: cliente = hash. Para bloquear: Cloudflare → Security → WAF → Custom rule con
        {' '}<code>ip.src in {'{prefijo}'}</code>, <code>ip.geoip.asnum eq N</code> o el user agent.</p>
      <Input.Search allowClear placeholder="Filtrar por red, ASN, país, UA o ruta" value={filter}
        onChange={event => setFilter(event.target.value)} style={{ marginBottom: 12 }} />
      <Table size="small" rowKey={row => row.client + row.ua} pagination={{ pageSize: 25 }} scroll={{ x: 1000 }}
        dataSource={clients} columns={clientColumns} />
    </section>
    <section className={styles.section}><h2 className={styles.sectionTitle}>Requests por tipo</h2>
      <Table<RequestBreakdown> size="small" rowKey={row => `${row.kind}-${row.status}-${row.bot}`} pagination={false}
        dataSource={data.requests} columns={requestColumns} />
    </section>
  </>;
}

export function SensitiveTraffic() {
  const locale = useLocale();
  const [days, setDays] = useState(7);
  return <AdminGate next="/admin/traffic"><main className={styles.page}>
    <header className={styles.head}><span className={'tech-label ' + styles.kicker}>HIOS / ADMIN / TRÁFICO</span>
      <h1 className={styles.title}>Tráfico sensible</h1><RangePicker days={days} onChange={setDays} />
    </header>
    <p><Link href={`/${locale}/admin`}>← Panel</Link></p>
    <Content days={days} />
  </main></AdminGate>;
}
