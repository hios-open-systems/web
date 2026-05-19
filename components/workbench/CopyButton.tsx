'use client';

import { Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';

/**
 * One copy affordance for every tool's text output. Consistent label,
 * icon, success/error feedback. Pass the value (or a getter for lazy
 * computation). Renders nothing when there is nothing to copy.
 */
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

  const resolve = () => (typeof value === 'function' ? value() : value);

  const onCopy = async () => {
    const v = resolve();
    if (!v) return;
    try {
      await navigator.clipboard.writeText(v);
      messageApi.success(t('copied'));
    } catch {
      messageApi.error(t('copyError'));
    }
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
