'use client';

import React from 'react';
import { Card, Badge, Button, Space } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import type { Module } from '@/config/modules';
import { CATEGORIES } from '@/config/modules';
import styles from './pinouts.module.css';

interface ModuleCardProps {
  module: Module;
  isSelected?: boolean;
  onSelect?: (moduleId: string) => void;
}

export function ModuleCard({ module, isSelected, onSelect }: ModuleCardProps) {
  const t = useTranslations('Pinouts');
  const category = CATEGORIES[module.category];
  const categoryLabel = t(`Categories.${module.category}`);
  const description = t(`Modules.${module.id}.description`);
  const viewText = t('Buttons.view');
  const selectedText = t('Buttons.selected');

  return (
    <Card
      className={`${styles.moduleCard} ${isSelected ? styles.selected : ''}`}
      hoverable
      onClick={() => onSelect?.(module.id)}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.moduleName}>{module.name}</h3>
        <Badge
          color={category.color}
          text={categoryLabel}
        />
      </div>

      <p className={styles.moduleDescription}>{description}</p>

      <Space size="small" style={{ width: '100%' }}>
        <Button
          type={isSelected ? 'primary' : 'default'}
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(module.id);
          }}
        >
          {isSelected ? selectedText : viewText}
        </Button>
        <Button
          type="text"
          size="small"
          icon={<FileTextOutlined />}
          href={module.htmlPath}
          target="_blank"
        >
          {t('Buttons.html')}
        </Button>
      </Space>
    </Card>
  );
}
