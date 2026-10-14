'use client';
import { Button, Card, Input, Space, Switch, Typography } from 'antd';
import { useTranslations } from 'next-intl';
import type { replacePreview } from '@/lib/workbench/regex';
import { downloadBlob } from '@/lib/workbench/download';
import { CopyButton } from './CopyButton';
import styles from './workbench.module.css';
const { Text } = Typography;
export function RegexReplacement({ replaceEnabled, setReplaceEnabled, replacement, setReplacement, replaced, pending }: {
  replaceEnabled: boolean; setReplaceEnabled: (value: boolean) => void;
  replacement: string; setReplacement: (value: string) => void;
  replaced: ReturnType<typeof replacePreview> | null; pending: boolean;
}) {
  const t = useTranslations('Workbench.regex');
  return <>
      <Card title={t('replaceLabel')} className={styles.sectionCard} styles={{ body: { padding: 20 } }}>
        <Space direction="vertical" size={12} className={styles.stackFull}>
          <Space wrap><Switch aria-label={t('enableReplace')} checked={replaceEnabled} onChange={setReplaceEnabled} /><Text>{t('enableReplace')}</Text></Space>
          <Input
            aria-label={t('replacePlaceholder')}
            value={replacement}
            onChange={(e) => { setReplacement(e.target.value); setReplaceEnabled(true); }}
            placeholder={t('replacePlaceholder')}
          />
          {replaceEnabled && replaced?.ok && <Space wrap>{replaced.value && <CopyButton size="large" value={replaced.value} />}<Button size="large" onClick={() => downloadBlob(replaced.value, 'replacement.txt', 'text/plain;charset=utf-8')}>{t('download')}</Button></Space>}
          {replaceEnabled && replaced ? (
            replaced.ok ? (
              <pre className={styles.codeBlock} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', margin: 0 }}>
                {replaced.value || t('emptyResult')}
              </pre>
            ) : (
              <Text type="danger">{replaced.error}</Text>
            )
          ) : (
            <Text type="secondary">{t(pending ? 'working' : 'replaceHint')}</Text>
          )}
        </Space>
      </Card>
  </>;
}
