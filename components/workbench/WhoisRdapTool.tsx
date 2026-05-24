'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Input, Space, Tag, Typography, message } from 'antd';
import { CopyOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { RdapLookupResponse } from '@/lib/workbench/network';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;
const defaultDomain = 'openhios.dev';

interface ApiError {
  error?: string;
}

export function WhoisRdapTool() {
  const [messageApi, contextHolder] = message.useMessage();
  const [domain, setDomain] = useState(defaultDomain);
  const [result, setResult] = useState<RdapLookupResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resultText = useMemo(() => (result ? JSON.stringify(result, null, 2) : ''), [result]);

  const runLookup = useCallback(async (target: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/workbench/rdap?domain=${encodeURIComponent(target)}`, { cache: 'no-store' });
      const payload = (await response.json()) as RdapLookupResponse | ApiError;
      if (!response.ok) throw new Error('error' in payload ? payload.error || 'RDAP lookup failed' : 'RDAP lookup failed');
      setResult(payload as RdapLookupResponse);
    } catch (lookupError) {
      setResult(null);
      setError(lookupError instanceof Error ? lookupError.message : 'RDAP lookup failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void runLookup(defaultDomain);
  }, [runLookup]);

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(resultText);
      messageApi.success('Resultado copiado');
    } catch {
      messageApi.error('No se pudo copiar');
    }
  };

  return (
    <Space direction="vertical" size={20} className={styles.stackFull}>
      {contextHolder}
      <ToolHeader
        eyebrow="Network Lab"
        title="WHOIS / RDAP"
        description="Consulta datos públicos de registro de dominios usando RDAP, el reemplazo moderno de WHOIS."
        locality="network"
        actions={
          <Space wrap>
            <Button icon={<SearchOutlined />} loading={loading} onClick={() => void runLookup(domain)}>Consultar</Button>
            <Button icon={<ReloadOutlined />} onClick={() => {
              setDomain(defaultDomain);
              void runLookup(defaultDomain);
            }}>Ejemplo</Button>
            {result ? <Button icon={<CopyOutlined />} onClick={copyResult}>Copiar JSON</Button> : null}
          </Space>
        }
      />

      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={12} className={styles.stackFull}>
          <Text className={styles.metricLabel}>Dominio</Text>
          <Input value={domain} onChange={(event) => setDomain(event.target.value)} onPressEnter={() => void runLookup(domain)} />
        </Space>
      </Card>

      <Card title="Resultado RDAP" className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        {error ? (
          <div className={styles.emptyPanel}>{error}</div>
        ) : result ? (
          <Space direction="vertical" size={16} className={styles.stackFull}>
            <div className={styles.metricsGrid}>
              <Metric label="Dominio" value={result.domain} />
              <Metric label="Registrar" value={result.registrar ?? 'n/a'} />
              <Metric label="Handle" value={result.handle ?? 'n/a'} />
              <Metric label="RTT" value={`${result.durationMs} ms`} />
            </div>
            <div className={styles.pathList}>
              <ListRow title="Estados" values={result.status} tagColor="blue" />
              <ListRow title="Nameservers" values={result.nameservers} tagColor="green" />
              <ListRow title="Eventos" values={result.events.map((event) => `${event.action}: ${new Date(event.date).toLocaleDateString()}`)} tagColor="purple" />
            </div>
          </Space>
        ) : (
          <div className={styles.emptyPanel}>Ejecutá una consulta para ver datos RDAP.</div>
        )}
      </Card>
    </Space>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metricCard}>
      <Text className={styles.metricLabel}>{label}</Text>
      <Text strong>{value}</Text>
    </div>
  );
}

function ListRow({ title, values, tagColor }: { title: string; values: string[]; tagColor: string }) {
  return (
    <div className={styles.pathRow}>
      <div className={styles.pathContent}>
        <Text className={styles.metricLabel}>{title}</Text>
        <div className={styles.pathMeta}>
          {values.length ? values.map((value) => <Tag key={value} color={tagColor}>{value}</Tag>) : <Text type="secondary">n/a</Text>}
        </div>
      </div>
    </div>
  );
}
