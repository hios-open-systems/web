'use client';

import { Tag } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import type { Module } from '@/config/modules';
import { CATEGORIES } from '@/config/modules';
import styles from './pinouts.module.css';

interface ModuleSpecsPanelProps {
  module: Module;
}

export function ModuleSpecsPanel({ module }: ModuleSpecsPanelProps) {
  const t = useTranslations('Pinouts');
  const category = CATEGORIES[module.category];
  const categoryLabel = t(`Categories.${module.category}`);
  const specs = module.specs;
  let features = specs?.features;

  try {
    const translatedFeatures = t.raw(`Modules.${module.id}.features`);
    if (Array.isArray(translatedFeatures)) features = translatedFeatures;
  } catch {
    // Keep module defaults when a locale does not provide feature overrides.
  }

  return (
    <div className={styles.specsPanel}>
      <h3>{t('technical_info')}</h3>
      <dl>
        <dt>{t('name')}</dt>
        <dd>{module.name}</dd>
        <dt>{t('category')}</dt>
        <dd>
          <Tag color={category.color}>{categoryLabel}</Tag>
        </dd>
        {specs?.voltage ? <SpecRow label={t('voltage')} value={specs.voltage} /> : null}
        {specs?.resolution ? <SpecRow label={t('resolution')} value={specs.resolution} /> : null}
        {specs?.interface ? <SpecRow label={t('interface')} value={<code>{specs.interface}</code>} /> : null}
        {specs?.package ? <SpecRow label={t('package')} value={specs.package} /> : null}
        {features?.length ? (
          <>
            <dt>{t('features')}</dt>
            <dd>
              <ul className={styles.featuresList}>
                {features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </dd>
          </>
        ) : null}
        {module.datasheetUrl ? (
          <>
            <dt>{t('datasheet')}</dt>
            <dd>
              <a href={module.datasheetUrl} target="_blank" rel="noopener noreferrer">
                <LinkOutlined /> {t('view_datasheet')}
              </a>
            </dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}
