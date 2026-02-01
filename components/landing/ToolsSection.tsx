'use client';

import React, { useState } from 'react';
import { Row, Col, Typography, Segmented } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { useTranslations } from 'next-intl';
import { ToolCard } from './ToolCard';
import { tools, FilterType } from '@/config/tools';
import { getSectionBackground } from '@/config/theme';
import {
    CodeOutlined,
    ToolOutlined,
    AppstoreOutlined,
    GlobalOutlined,
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export function ToolsSection() {
    const { mode } = useTheme();
    const t = useTranslations('Tools');
    const [filter, setFilter] = useState<FilterType>('all');

    const filteredTools = tools.filter(tool =>
        filter === 'all' || tool.category === filter
    );

    const filterOptions = [
        {
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AppstoreOutlined /> {t('filter_all')}
                </span>
            ),
            value: 'all',
        },
        {
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CodeOutlined /> {t('filter_software')}
                </span>
            ),
            value: 'software',
        },
        {
            label: (
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ToolOutlined /> {t('filter_hardware')}
                </span>
            ),
            value: 'hardware',
        },
    ];

    return (
        <section style={{
            padding: '80px 24px',
            background: getSectionBackground(mode),
        }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    style={{ textAlign: 'center', marginBottom: '40px' }}
                >
                    <Title level={2} style={{
                        color: mode === 'dark' ? '#ffffff' : '#0d0d0d',
                        marginBottom: '12px',
                    }}>
                        {t('title')}
                    </Title>
                    <Paragraph style={{
                        color: mode === 'dark' ? '#666' : '#999',
                        fontSize: '15px',
                        marginBottom: '24px',
                    }}>
                        {t('subtitle')}
                    </Paragraph>

                    <Segmented
                        options={filterOptions}
                        value={filter}
                        onChange={(value) => setFilter(value as FilterType)}
                        style={{
                            background: mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
                            padding: '4px',
                        }}
                    />
                </motion.div>

                <Row gutter={[20, 20]}>
                    <AnimatePresence mode="popLayout">
                        {filteredTools.map((tool, index) => (
                            <Col xs={24} sm={12} md={8} key={tool.name}>
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    style={{ height: '100%' }}
                                >
                                    <ToolCard tool={tool} />
                                </motion.div>
                            </Col>
                        ))}
                    </AnimatePresence>
                </Row>

                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    style={{ textAlign: 'center', marginTop: '48px' }}
                >
                    <Paragraph style={{
                        color: mode === 'dark' ? '#444' : '#bbb',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                    }}>
                        <GlobalOutlined />
                        {t.rich('open_source_note', {
                            strong: (chunks) => <strong style={{ color: mode === 'dark' ? '#666' : '#888' }}>{chunks}</strong>
                        })}
                    </Paragraph>
                </motion.div>
            </div>
        </section>
    );
}
