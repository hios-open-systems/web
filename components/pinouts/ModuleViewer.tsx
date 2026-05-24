'use client';

import React, { useCallback } from 'react';
import { Tabs, Empty, Button, Tooltip } from 'antd';
import { DownloadOutlined, PrinterOutlined, ExpandOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import type { Module } from '@/config/modules';
import { CATEGORIES } from '@/config/modules';
import { ModulePinoutFrame } from './ModulePinoutFrame';
import { ModuleSpecsPanel } from './ModuleSpecsPanel';
import styles from './pinouts.module.css';

interface ModuleViewerProps {
  module?: Module;
  loading?: boolean;
}

export function ModuleViewer({ module }: ModuleViewerProps) {
  const t = useTranslations('Pinouts');

  const handlePrint = useCallback(() => {
    if (!module) return;
    window.open(module.htmlPath, '_blank');
  }, [module]);

  const handleOpenInNewTab = useCallback(() => {
    if (!module) return;
    window.open(module.htmlPath, '_blank');
  }, [module]);

  if (!module) {
    return (
      <div className={styles.viewerContainer}>
        <Empty
          description={t('select_module')}
          style={{ marginTop: '60px' }}
        />
      </div>
    );
  }

  const category = CATEGORIES[module.category];
  const categoryLabel = t(`Categories.${module.category}`);
  const description = t(`Modules.${module.id}.description`);

  return (
    <div className={styles.viewerContainer}>
      <div className={styles.viewerHeader}>
        <div className={styles.viewerInfo}>
          <h2 className={styles.viewerTitle}>{module.name}</h2>
          <p className={styles.viewerCategory} style={{ borderColor: category.color }}>
            {categoryLabel}
          </p>
        </div>
        <p className={styles.viewerDescription}>{description}</p>
        <div className={styles.viewerActions}>
          <Tooltip title={t('print_tooltip')}>
            <Button
              type="default"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              {t('print')}
            </Button>
          </Tooltip>
          <Tooltip title={t('expand_tooltip')}>
            <Button
              type="default"
              icon={<ExpandOutlined />}
              onClick={handleOpenInNewTab}
            >
              {t('expand')}
            </Button>
          </Tooltip>
          {module.datasheetUrl && (
            <Button
              type="link"
              icon={<DownloadOutlined />}
              href={module.datasheetUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('datasheet')}
            </Button>
          )}
        </div>
      </div>

      <div className={styles.viewerTabs}>
        <Tabs
          items={[
            {
              key: 'interactive',
              label: t('interactive_view'),
              forceRender: true,
              children: <ModulePinoutFrame module={module} />,
            },
            {
              key: 'specs',
              label: t('specifications'),
              forceRender: true,
              children: <ModuleSpecsPanel module={module} />,
            },
          ]}
        />
      </div>
    </div>
  );
}
