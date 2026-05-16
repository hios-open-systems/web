'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { MODULES, PINOUTS_ATTRIBUTION } from '@/config/modules';
import { ModuleList } from '@/components/pinouts/ModuleList';
import { ModuleViewer } from '@/components/pinouts/ModuleViewer';
import styles from './pinouts.module.css';

export function PinoutsContent() {
  const t = useTranslations('Pinouts');
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(
    MODULES[0]?.id
  );

  const selectedModule = useMemo(
    () => MODULES.find((m) => m.id === selectedModuleId),
    [selectedModuleId]
  );

  return (
    <main className={styles.pinoutsPage}>
      <div className={styles.pinoutsHeader}>
        <h1 className={styles.pageTitle}>{t('title')}</h1>
        <p className={styles.pageSubtitle}>{t('subtitle')}</p>
      </div>

      <div className={styles.pinoutsLayout}>
        <aside className={styles.sidebar}>
          <ModuleList
            modules={MODULES}
            selectedModuleId={selectedModuleId}
            onSelect={setSelectedModuleId}
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
