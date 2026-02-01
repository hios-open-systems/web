'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Tabs, Empty, Button, Tag, Tooltip } from 'antd';
import { DownloadOutlined, LinkOutlined, PrinterOutlined, ExpandOutlined } from '@ant-design/icons';
import type { Module } from '@/config/modules';
import { CATEGORIES, PINOUTS_ATTRIBUTION } from '@/config/modules';
import styles from './pinouts.module.css';

interface ModuleViewerProps {
  module?: Module;
  loading?: boolean;
}

export function ModuleViewer({ module }: ModuleViewerProps) {
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
          description="Selecciona un módulo para ver sus pinouts"
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
          <Tooltip title="Imprimir pinout">
            <Button
              type="default"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
            >
              Imprimir
            </Button>
          </Tooltip>
          <Tooltip title="Abrir en nueva pestaña">
            <Button
              type="default"
              icon={<ExpandOutlined />}
              onClick={handleOpenInNewTab}
            >
              Expandir
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
              Datasheet
            </Button>
          )}
        </div>
      </div>

      <div className={styles.viewerTabs}>
        <Tabs
          items={[
            {
              key: 'interactive',
              label: 'Vista Interactiva',
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
              label: 'Especificaciones',
              forceRender: true,
              children: (
                <div className={styles.specsPanel}>
                  <h3>Información Técnica</h3>
                  <dl>
                    <dt>Nombre</dt>
                    <dd>{module.name}</dd>
                    <dt>Categoría</dt>
                    <dd>
                      <Tag color={category.color}>{category.label}</Tag>
                    </dd>
                    {specs?.voltage && (
                      <>
                        <dt>Voltaje</dt>
                        <dd>{specs.voltage}</dd>
                      </>
                    )}
                    {specs?.resolution && (
                      <>
                        <dt>Resolución</dt>
                        <dd>{specs.resolution}</dd>
                      </>
                    )}
                    {specs?.interface && (
                      <>
                        <dt>Interfaz</dt>
                        <dd><code>{specs.interface}</code></dd>
                      </>
                    )}
                    {specs?.package && (
                      <>
                        <dt>Encapsulado</dt>
                        <dd>{specs.package}</dd>
                      </>
                    )}
                    {specs?.features && specs.features.length > 0 && (
                      <>
                        <dt>Características</dt>
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
                        <dt>Datasheet</dt>
                        <dd>
                          <a
                            href={module.datasheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <LinkOutlined /> Ver datasheet oficial
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

      <footer className={styles.attribution}>
        <span>
          Pinouts inspirados en{' '}
          <a
            href={PINOUTS_ATTRIBUTION.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {PINOUTS_ATTRIBUTION.source}
          </a>
        </span>
      </footer>
    </div>
  );
}
