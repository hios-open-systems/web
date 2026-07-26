'use client';

import { Button, Result } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';

export default function LocaleError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations('Workbench.error');
  return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <Result
        status="error"
        title={t('pageTitle')}
        subTitle={t('pageSubtitle')}
        extra={
          <Button type="primary" icon={<ReloadOutlined />} onClick={reset}>
            {t('retry')}
          </Button>
        }
      />
    </div>
  );
}
