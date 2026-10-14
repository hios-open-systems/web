'use client';
import { Button, Typography, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';
export function CopyValueRow({ label, value }: { label: string; value: string }) {
  const t = useTranslations('Workbench.common');
  const [api, holder] = message.useMessage();
  const copy = useCopyToClipboard(api);
  return <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
    {holder}
    <Typography.Text type="secondary">{label}</Typography.Text>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, maxWidth: '100%', minWidth: 0 }}>
      <code style={{ overflowWrap: 'anywhere' }}>{value}</code>
      <Button type="text" aria-label={t('copy') + ' ' + label} icon={<CopyOutlined aria-hidden />} style={{ minWidth: 44, minHeight: 44, flexShrink: 0 }} onClick={() => void copy(value)} />
    </div>
  </div>;
}
