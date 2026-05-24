'use client';

import React from 'react';
import { Input, Segmented } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import type { Module, ModuleCategoryFilter } from '@/config/modules';
import { CATEGORIES, MODULE_CATEGORIES, getModuleCategoryCounts } from '@/config/modules';
import styles from './pinouts.module.css';

interface ModuleListProps {
  modules: Module[];
  selectedModuleId?: string;
  query: string;
  category: ModuleCategoryFilter;
  onSelect: (moduleId: string) => void;
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: ModuleCategoryFilter) => void;
}

export function ModuleList({
  modules,
  selectedModuleId,
  query,
  category,
  onSelect,
  onQueryChange,
  onCategoryChange,
}: ModuleListProps) {
  const t = useTranslations('Pinouts');
  const counts = getModuleCategoryCounts();
  const categoryOptions = [
    { label: `${t('all')} ${counts.all}`, value: 'all' },
    ...MODULE_CATEGORIES.map((id) => ({
      label: `${t(`Categories.${id}`)} ${counts[id]}`,
      value: id,
    })),
  ];

  return (
    <nav className={styles.moduleList} aria-label={t('available_modules')}>
      <p className={styles.moduleListTitle}>{t('available_modules')}</p>
      <div className={styles.moduleTools}>
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          prefix={<SearchOutlined />}
          placeholder={t('search_placeholder')}
          allowClear
        />
        <Segmented
          block
          size="small"
          value={category}
          onChange={(value) => onCategoryChange(value as ModuleCategoryFilter)}
          options={categoryOptions}
        />
      </div>
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
      {modules.length === 0 ? <p className={styles.moduleEmpty}>{t('empty_filtered')}</p> : null}
    </nav>
  );
}
