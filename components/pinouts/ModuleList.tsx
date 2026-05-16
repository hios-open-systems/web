'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import type { Module } from '@/config/modules';
import { CATEGORIES } from '@/config/modules';
import styles from './pinouts.module.css';

interface ModuleListProps {
  modules: Module[];
  selectedModuleId?: string;
  onSelect: (moduleId: string) => void;
}

export function ModuleList({ modules, selectedModuleId, onSelect }: ModuleListProps) {
  const t = useTranslations('Pinouts');

  return (
    <nav className={styles.moduleList} aria-label={t('available_modules')}>
      <p className={styles.moduleListTitle}>{t('available_modules')}</p>
      <ul className={styles.moduleListItems}>
        {modules.map((module) => {
          const category = CATEGORIES[module.category];
          const isActive = module.id === selectedModuleId;
          return (
            <li key={module.id}>
              <button
                type="button"
                className={`${styles.moduleItem} ${isActive ? styles.moduleItemActive : ''}`}
                onClick={() => onSelect(module.id)}
                aria-current={isActive ? 'true' : undefined}
              >
                <span
                  className={styles.moduleItemDot}
                  style={{ background: category.color }}
                  aria-hidden
                />
                <span className={styles.moduleItemBody}>
                  <span className={styles.moduleItemName}>{module.name}</span>
                  <span className={styles.moduleItemCategory}>
                    {t(`Categories.${module.category}`)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
