'use client';

import React from 'react';
import { Input } from 'antd';
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

function categoryFilterLabel(label: string, count: number) {
  return (
    <span className={styles.categoryFilterLabel}>
      <span>{label}</span>
      <strong>{count}</strong>
    </span>
  );
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
  const categoryOptions: { label: React.ReactNode; value: ModuleCategoryFilter }[] = [
    { label: categoryFilterLabel(t('all'), counts.all), value: 'all' },
    ...MODULE_CATEGORIES.map((id) => ({
      label: categoryFilterLabel(t(`Categories.${id}`), counts[id]),
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
        <div className={styles.categoryFilters} aria-label={t('category')}>
          {categoryOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.categoryFilter} ${
                category === option.value ? styles.categoryFilterActive : ''
              }`}
              onClick={() => onCategoryChange(option.value)}
              aria-pressed={category === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
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
