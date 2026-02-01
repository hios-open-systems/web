'use client';

import React, { useState, useMemo } from 'react';
import { Input, Select, Row, Col, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Module } from '@/config/modules';
import { CATEGORIES } from '@/config/modules';
import styles from './pinouts.module.css';

interface ModuleSelectorProps {
  modules: Module[];
  selectedModuleId?: string;
  onSelectModule: (moduleId: string) => void;
}

export function ModuleSelector({
  modules,
  selectedModuleId,
  onSelectModule,
}: ModuleSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();

  const filteredModules = useMemo(() => {
    return modules.filter((module) => {
      const matchesSearch = module.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
        module.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesCategory = !selectedCategory || module.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [modules, searchTerm, selectedCategory]);

  return (
    <div className={styles.selector}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Input
          placeholder="Buscar módulo..."
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="large"
        />

        <Select
          placeholder="Filtrar por categoría"
          allowClear
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={[
            {
              label: 'Todas las categorías',
              value: undefined,
            },
            ...Object.entries(CATEGORIES).map(([key, cat]) => ({
              label: cat.label,
              value: key,
            })),
          ]}
        />
      </Space>

      <div className={styles.modulesGrid}>
        {filteredModules.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredModules.map((module) => (
              <Col key={module.id} xs={24} sm={12} lg={8}>
                <div
                  className={`${styles.selectorItem} ${selectedModuleId === module.id ? styles.active : ''
                    }`}
                  onClick={() => onSelectModule(module.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      onSelectModule(module.id);
                    }
                  }}
                >
                  <h4>{module.name}</h4>
                  <p>{module.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        ) : (
          <div className={styles.noResults}>
            No se encontraron módulos que coincidan
          </div>
        )}
      </div>
    </div>
  );
}
