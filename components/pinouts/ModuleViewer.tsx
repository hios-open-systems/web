'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Tabs, Empty, Button, Tag, Tooltip } from 'antd';
import { DownloadOutlined, LinkOutlined, PrinterOutlined, ExpandOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import type { Module } from '@/config/modules';
import { CATEGORIES } from '@/config/modules';
import styles from './pinouts.module.css';

interface ModuleViewerProps {
  module?: Module;
  loading?: boolean;
}

export function ModuleViewer({ module }: ModuleViewerProps) {
  const t = useTranslations('Pinouts');
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
  }, []);

  const handlePrint = useCallback(() => {
    if (!module) return;
    window.open(module.htmlPath, '_blank');
  }, [module]);

  const handleOpenInNewTab = useCallback(() => {
    if (!module) return;
    window.open(module.htmlPath, '_blank');
  }, [module]);

  // Reset loaded state when module changes
  useEffect(() => {
    setIframeLoaded(false);
  }, [module?.id]);

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
  const specs = module.specs;

  return (
    <div className={styles.viewerContainer}>
      <div className={styles.viewerHeader}>
        <div className={styles.viewerInfo}>
          <h2 className={styles.viewerTitle}>{module.name}</h2>
          <p className={styles.viewerCategory} style={{ borderColor: category.color }}>
            {category.label}
          </p>
        </div>
        <p className={styles.viewerDescription}>{module.description}</p>
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
              children: (
                <div className={styles.iframeWrapper}>
                  <iframe
                    ref={iframeRef}
                    src={module.htmlPath}
                    title={`${module.name} Pinout`}
                    className={`${styles.iframe} ${iframeLoaded ? styles.iframeLoaded : ''}`}
                    onLoad={handleIframeLoad}
                  />
                </div>
              ),
            },
            {
              key: 'specs',
              label: t('specifications'),
              forceRender: true,
              children: (
                <div className={styles.specsPanel}>
                  <h3>{t('technical_info')}</h3>
                  <dl>
                    <dt>{t('name')}</dt>
                    <dd>{module.name}</dd>
                    <dt>{t('category')}</dt>
                    <dd>
                      <Tag color={category.color}>{category.label}</Tag>
                    </dd>
                    {specs?.voltage && (
                      <>
                        <dt>{t('voltage')}</dt>
                        <dd>{specs.voltage}</dd>
                      </>
                    )}
                    {specs?.resolution && (
                      <>
                        <dt>{t('resolution')}</dt>
                        <dd>{specs.resolution}</dd>
                      </>
                    )}
                    {specs?.interface && (
                      <>
                        <dt>{t('interface')}</dt>
                        <dd><code>{specs.interface}</code></dd>
                      </>
                    )}
                    {specs?.package && (
                      <>
                        <dt>{t('package')}</dt>
                        <dd>{specs.package}</dd>
                      </>
                    )}
                    {specs?.features && specs.features.length > 0 && (
                      <>
                        <dt>{t('features')}</dt>
                        <dd>
                          <ul className={styles.featuresList}>
                            {specs.features.map((feature, index) => (
                              <li key={index}>{feature}</li>
                            ))}
                          </ul>
                        </dd>
                      </>
                    )}
                    {module.datasheetUrl && (
                      <>
                        <dt>{t('datasheet')}</dt>
                        <dd>
                          <a
                            href={module.datasheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LinkOutlined /> {t('view_datasheet')}
                          </a>
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
