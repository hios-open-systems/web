'use client';

import { Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { useCopyToClipboard } from '@/lib/hooks/useCopyToClipboard';

export function CopyButton({
  value,
  size = 'small',
  type = 'text',
  block,
}: {
  value: string | (() => string);
  size?: 'small' | 'middle' | 'large';
  type?: 'text' | 'default' | 'primary';
  block?: boolean;
}) {
  const t = useTranslations('Workbench.common');
  const [messageApi, contextHolder] = message.useMessage();
  const copy = useCopyToClipboard(messageApi);

  const onCopy = () => {
    const v = typeof value === 'function' ? value() : value;
    if (!v) return;
    copy(v);
  };

  return (
    <>
      {contextHolder}
      <Button
        size={size}
        type={type}
        block={block}
        icon={<CopyOutlined />}
        onClick={onCopy}
        aria-label={t('copy')}
      >
        {t('copy')}
      </Button>
    </>
  );
}
