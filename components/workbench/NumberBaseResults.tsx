'use client';
import { Button, Card, Col, Row, Space, Tooltip, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { BASES, type Base, toBase, formatBin, bitWidth, isPow2, countSetBits } from '@/lib/workbench/numberBase';
import { BitGrid } from './NumberBitGrid';
import styles from './workbench.module.css';
const { Text } = Typography;
const BIGINT_0 = BigInt(0);
export function NumberBaseResults({ value, activeBase, mode, switchTo, copyVal }: {
  value: bigint; activeBase: Base; mode: 'light' | 'dark';
  switchTo: (base: Base) => void; copyVal: (value: string) => Promise<boolean>;
}) {
  const t = useTranslations('Workbench.numberBase');
  return <>
      {value !== null && (
        <Card title={t('conversions')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Space direction="vertical" size={10} className={styles.stackFull}>
            {BASES.map(({ base, label, prefix }) => {
              const repr = toBase(value, base);
              const display = base === 2 ? formatBin(value) : repr;
              return (
                <div
                  key={base}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    background:
                      activeBase === base
                        ? mode === 'dark' ? 'rgba(14,165,233,0.08)' : 'rgba(14,165,233,0.06)'
                        : 'var(--wb-surface-soft-bg)',
                    border: `1px solid ${activeBase === base ? 'rgba(14,165,233,0.3)' : 'var(--wb-surface-border)'}`,
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                  onClick={() => switchTo(base)}
                >
                  <div style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
                    <Text
                      style={{
                        color: 'var(--wb-text-muted)',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        display: 'block',
                      }}
                    >
                      {label}{prefix && <span style={{ fontFamily: 'monospace', marginLeft: 4 }}>{prefix}</span>}
                    </Text>
                    <code style={{ fontSize: 15, letterSpacing: base === 2 ? '0.05em' : undefined }}>{display}</code>
                  </div>
                  <Tooltip title={t('copy')}>
                    <Button
                      aria-label={t('copy') + ' ' + label}
                      style={{ minWidth: 44, minHeight: 44, flexShrink: 0 }}
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={(e) => {
                        e.stopPropagation();
                        void copyVal((value < BIGINT_0 ? '-' : '') + prefix + (value < BIGINT_0 ? repr.slice(1) : repr));
                      }}
                    />
                  </Tooltip>
                </div>
              );
            })}
          </Space>
        </Card>
      )}

      {value !== null && value >= BIGINT_0 && (
        <Card title={t('bits')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <BitGrid value={value} mode={mode} />
        </Card>
      )}

      {value !== null && value >= BIGINT_0 && (
        <Card title={t('facts')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <Row gutter={[12, 12]}>
            {[
              { label: t('factWidth'), val: `${bitWidth(value)} bits` },
              { label: t('factBytes'), val: String(Math.ceil(bitWidth(value) / 8)) },
              { label: t('factSetBits'), val: String(countSetBits(value)) },
              { label: t('factPow2'), val: isPow2(value) ? t('yes') : t('no') },
            ].map(({ label, val }) => (
              <Col key={label} xs={12} sm={6}>
                <div
                  style={{
                    background: 'var(--wb-surface-soft-bg)',
                    border: '1px solid var(--wb-surface-border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    textAlign: 'center',
                  }}
                >
                  <Text
                    style={{
                      color: 'var(--wb-text-muted)',
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      display: 'block',
                    }}
                  >
                    {label}
                  </Text>
                  <Text strong style={{ fontSize: 18 }}>
                    {val}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}
  </>;
}
