'use client';
import { Card, Typography } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { FIELD_NAMES, describeField, type ParsedCron } from '@/lib/workbench/cron';
import styles from './workbench.module.css';
const { Text } = Typography;
export function CronResults({ parsed, runs, expr }: { parsed: ParsedCron; runs: Date[]; expr: string }) {
  const t = useTranslations('Workbench.cron');
  return <>
      {parsed.valid && parsed.fields && (
        <Card title={t('breakdown')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,180px),1fr))', gap: 12 }}>
            {FIELD_NAMES.map((field, i) => {
              const segment = expr.trim().split(/\s+/)[i] ?? '*';
              const description = describeField(field, parsed.fields![field]);
              const desc = description === 'every' ? t('every') : description;
              return (
                <div
                  key={field}
                  style={{
                    background: 'var(--wb-surface-soft-bg)',
                    border: '1px solid var(--wb-surface-border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                  }}
                >
                  <Text style={{ color: 'var(--wb-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {t(`field_${field}`)}
                  </Text>
                  <pre style={{ margin: '4px 0 2px', fontFamily: 'monospace', fontSize: 16, fontWeight: 600, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{segment}</pre>
                  <Text style={{ fontSize: 12, color: 'var(--wb-text-muted)' }}>{desc}</Text>
                </div>
              );
            })}
          </div>
        </Card>
      )}
      {parsed.valid && runs.length < 8 && <Text role="status">{t('limitedRuns')}</Text>}
      {parsed.valid && runs.length > 0 && (
        <Card
          title={
            <span>
              <ClockCircleOutlined style={{ marginRight: 8 }} />
              {t('nextRuns')}
            </span>
          }
          className={styles.sectionCard}
          styles={{ body: { padding: 20 } }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,280px),1fr))', gap: 8 }}>
            {runs.map((d, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'var(--wb-surface-soft-bg)',
                  border: '1px solid var(--wb-surface-border)',
                  borderRadius: 6,
                  padding: '6px 12px',
                }}
              >
                <Text style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  {d.toLocaleString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
                <Text style={{ color: 'var(--wb-text-muted)', fontSize: 11 }}>#{i + 1}</Text>
              </div>
            ))}
          </div>
        </Card>
      )}
  </>;
}
