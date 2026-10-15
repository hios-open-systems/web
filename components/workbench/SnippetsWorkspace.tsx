'use client';

import React from 'react';
import { PageIntro } from '@/components/ui/PageIntro';
import { Space } from 'antd';
import { useTranslations } from 'next-intl';
import { SnippetsShelf } from './SnippetsShelf';
import styles from './workbench.module.css';

export function SnippetsWorkspace() {
  const t = useTranslations('Workbench');

  return (
    <Space direction="vertical" size={24} className={styles.stackFull}>
      <PageIntro
        eyebrow={t('snippets.badge')}
        title={t('snippets.title')}
        description={t('snippets.subtitle')}
        area="development"
        compact
      />
      <SnippetsShelf />
    </Space>
  );
}
