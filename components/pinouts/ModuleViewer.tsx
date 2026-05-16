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
  const [iframeHeight, setIframeHeight] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  // The pinout HTML files each have their own intrinsic height. Measuring the
  // same-origin document and following its resizes keeps the iframe flush with
  // the diagram instead of leaving a fixed-height black gap.
  const handleIframeLoad = useCallback(() => {
    setIframeLoaded(true);
    const doc = iframeRef.current?.contentDocument;
    if (!doc?.body) return;

    let rafId = 0;
    let lastHeight = 0;
    // Defer to the next frame and skip no-op updates. Measuring synchronously
    // inside the ResizeObserver callback re-triggers it on the same tick,
    // which the browser reports as the (benign but noisy) "ResizeObserver loop
    // completed with undelivered notifications" error.
    const measure = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const next = Math.ceil(
          Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight)
        );
        if (next > 0 && next !== lastHeight) {
          lastHeight = next;
          setIframeHeight(next);
        }
      });
    };

    measure();
    observerRef.current?.disconnect();
    const observer = new ResizeObserver(measure);
    observer.observe(doc.body);
    observerRef.current = observer;
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
    setIframeHeight(null);
  }, [module?.id]);

  // Tear down the observer on unmount.
  useEffect(() => () => observerRef.current?.disconnect(), []);

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

  const specs = module.specs;
  let features = specs?.features;

  try {
    const translatedFeatures = t.raw(`Modules.${module.id}.features`);
    if (Array.isArray(translatedFeatures)) {
      features = translatedFeatures;
    }
  } catch {
    // Fallback to default features
  }

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
              children: (
                <div
                  className={styles.iframeWrapper}
                  style={iframeHeight ? { height: iframeHeight } : undefined}
                >
                  <iframe
                    ref={iframeRef}
                    src={module.htmlPath}
                    title={`${module.name} Pinout`}
                    className={`${styles.iframe} ${iframeLoaded ? styles.iframeLoaded : ''}`}
                    style={iframeHeight ? { height: iframeHeight } : undefined}
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
                      <Tag color={category.color}>{categoryLabel}</Tag>
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
                    {features && features.length > 0 && (
                      <>
                        <dt>{t('features')}</dt>
                        <dd>
                          <ul className={styles.featuresList}>
                            {features.map((feature, index) => (
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
