'use client';

import { useMemo, useState } from 'react';
import { Card, Input, InputNumber, Slider, Space, Tag, Typography } from 'antd';
import { calculateSubnet } from '@/lib/workbench/network';
import { ToolHeader } from './ToolHeader';
import styles from './workbench.module.css';

const { Text } = Typography;

export function SubnetCalculatorTool() {
  const [address, setAddress] = useState('192.168.1.42');
  const [prefix, setPrefix] = useState(24);
  const subnet = useMemo(() => calculateSubnet(address, prefix), [address, prefix]);

  return (
    <Space direction="vertical" size={20} className={styles.stackFull}>
      <ToolHeader
        eyebrow="Network Lab"
        title="Calculadora IPv4/Subnet"
        description="Calculá red, broadcast, rango usable, máscara y wildcard desde una IP con prefijo CIDR."
        locality="local"
      />

      <Card className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={16} className={styles.stackFull}>
          <div className={styles.optionGrid}>
            <div className={styles.metricCard}>
              <Text className={styles.metricLabel}>Dirección IPv4</Text>
              <Input value={address} onChange={(event) => setAddress(event.target.value)} status={subnet ? undefined : 'error'} />
            </div>
            <div className={styles.metricCard}>
              <Text className={styles.metricLabel}>Prefijo CIDR</Text>
              <InputNumber min={0} max={32} value={prefix} onChange={(value) => setPrefix(value ?? 24)} style={{ width: '100%' }} />
            </div>
          </div>
          <Slider min={0} max={32} value={prefix} onChange={setPrefix} marks={{ 8: '/8', 16: '/16', 24: '/24', 32: '/32' }} />
        </Space>
      </Card>

      {subnet ? (
        <Card title={<span>{subnet.cidr} <Tag color="blue">IPv4</Tag></span>} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <div className={styles.metricsGrid}>
            <Metric label="Máscara" value={subnet.subnetMask} />
            <Metric label="Wildcard" value={subnet.wildcardMask} />
            <Metric label="Red" value={subnet.networkAddress} />
            <Metric label="Broadcast" value={subnet.broadcastAddress} />
            <Metric label="Primer host" value={subnet.firstHost} />
            <Metric label="Último host" value={subnet.lastHost} />
            <Metric label="Direcciones" value={subnet.totalAddresses.toLocaleString()} />
            <Metric label="Hosts usables" value={subnet.usableHosts.toLocaleString()} />
          </div>
        </Card>
      ) : (
        <div className={styles.emptyPanel}>Ingresá una IPv4 válida, por ejemplo 10.0.0.12.</div>
      )}
    </Space>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.metricCard}>
      <Text className={styles.metricLabel}>{label}</Text>
      <Text strong className={styles.generatedValue}>{value}</Text>
    </div>
  );
}
