'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { filterModules, getModuleCategoryCounts, MODULES, PINOUTS_ATTRIBUTION, type ModuleCategoryFilter } from '@/config/modules';
import { ModuleList } from '@/components/pinouts/ModuleList';
import { ModuleViewer } from '@/components/pinouts/ModuleViewer';
import styles from './pinouts.module.css';

export function PinoutsContent() {
  const t = useTranslations('Pinouts');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ModuleCategoryFilter>('all');
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(
    MODULES[0]?.id
  );

  const modules = useMemo(() => filterModules(MODULES, query, category), [category, query]);
  const selectedModule = useMemo(
    () => modules.find((m) => m.id === selectedModuleId) ?? modules[0],
    [modules, selectedModuleId]
  );
  const counts = getModuleCategoryCounts();

  return (
    <main className={styles.pinoutsPage}>
      <div className={styles.pinoutsHeader}>
        <span className={styles.pinoutsEyebrow}>{t('eyebrow')}</span>
        <div className={styles.pinoutsHeaderRow}>
          <div>
            <h1 className={styles.pageTitle}>{t('title')}</h1>
            <p className={styles.pageSubtitle}>{t('subtitle')}</p>
          </div>
          <div className={styles.pinoutsStats}>
            <span><strong>{counts.all}</strong>{t('stats_modules')}</span>
            <span><strong>{counts.microcontroller}</strong>{t('stats_microcontrollers')}</span>
            <span><strong>{counts.audio + counts.amplifier}</strong>{t('stats_audio')}</span>
          </div>
        </div>
      </div>

      <div className={styles.pinoutsLayout}>
        <aside className={styles.sidebar}>
          <ModuleList
            modules={modules}
            selectedModuleId={selectedModule?.id ?? selectedModuleId}
            query={query}
            category={category}
            onSelect={setSelectedModuleId}
            onQueryChange={setQuery}
            onCategoryChange={setCategory}
          />
        </aside>

        <div className={styles.viewerColumn}>
          <ModuleViewer module={selectedModule} loading={false} />
        </div>
      </div>

      <p className={styles.attribution}>
        {PINOUTS_ATTRIBUTION.description}{' '}
        <a href={PINOUTS_ATTRIBUTION.url} target="_blank" rel="noopener noreferrer">
          {PINOUTS_ATTRIBUTION.source}
        </a>
      </p>
    </main>
  );
}
