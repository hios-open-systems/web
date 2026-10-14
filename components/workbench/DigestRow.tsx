'use client';
import { Button, Typography } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import styles from './workbench.module.css';
export function DigestRow({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string) => void }) {
  const t = useTranslations('Workbench.common');
  return <div>
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <Typography.Text>{label}</Typography.Text>
      <Button size="large" type="text" aria-label={t('copy') + ' ' + label} icon={<CopyOutlined aria-hidden />} onClick={() => onCopy(value)}>{t('copy')}</Button>
    </div>
    <pre className={styles.codeBlock} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: 0 }}>{value}</pre>
  </div>;
}
