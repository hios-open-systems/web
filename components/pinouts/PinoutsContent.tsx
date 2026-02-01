'use client';

import React, { useState, useMemo } from 'react';
import { Row, Col } from 'antd';
import { useTranslations } from 'next-intl';
import { MODULES } from '@/config/modules';
import { ModuleCard } from '@/components/pinouts/ModuleCard';
import { ModuleViewer } from '@/components/pinouts/ModuleViewer';
import styles from './pinouts.module.css';

export function PinoutsContent() {
  const t = useTranslations('Pinouts');
  const [selectedModuleId, setSelectedModuleId] = useState<string | undefined>(MODULES[0]?.id);

  const selectedModule = useMemo(
    () => MODULES.find((m) => m.id === selectedModuleId),
    [selectedModuleId]
  );

  return (
    <main className={styles.pinoutsPage}>
      <div className={styles.pinoutsHeader}>
        <h1 className={styles.pageTitle}>{t('title')}</h1>
        <p className={styles.pageSubtitle}>
          {t('subtitle')}
        </p>
      </div>

      <div className={styles.modulesGridContainer}>
        <h2 className={styles.sectionTitle}>{t('available_modules')}</h2>
        <Row gutter={[24, 24]}>
          {MODULES.map((module) => (
            <Col key={module.id} xs={24} sm={12} lg={8}>
              <ModuleCard
                module={module}
                isSelected={selectedModuleId === module.id}
                onSelect={setSelectedModuleId}
              />
            </Col>
          ))}
        </Row>
      </div>

      <ModuleViewer
        module={selectedModule}
        loading={false}
      />
    </main>
  );
}
