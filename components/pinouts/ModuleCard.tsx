'use client';

import React from 'react';
import { Card, Badge, Button, Space } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import type { Module } from '@/config/modules';
import { CATEGORIES } from '@/config/modules';
import styles from './pinouts.module.css';

interface ModuleCardProps {
  module: Module;
  isSelected?: boolean;
  onSelect?: (moduleId: string) => void;
}

export function ModuleCard({ module, isSelected, onSelect }: ModuleCardProps) {
  const category = CATEGORIES[module.category];

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
          text={category.label}
        />
      </div>

      <p className={styles.moduleDescription}>{module.description}</p>

      <Space size="small" style={{ width: '100%' }}>
        <Button
          type={isSelected ? 'primary' : 'default'}
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(module.id);
          }}
        >
          {isSelected ? 'Seleccionado' : 'Ver'}
        </Button>
        <Button
          type="text"
          size="small"
          icon={<FileTextOutlined />}
          href={module.htmlPath}
          target="_blank"
        >
          HTML
        </Button>
      </Space>
    </Card>
  );
}
