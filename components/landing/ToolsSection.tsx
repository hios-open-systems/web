'use client';

import React, { useState } from 'react';
import { Row, Col, Typography, Segmented } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { useTranslations } from 'next-intl';
import { ToolCard } from './ToolCard';
import { tools, FilterType } from '@/config/tools';
import { getColor, motionVariants } from '@/config/theme';
import { Section, SectionHeader } from '@/components/common';
import {
    CodeOutlined,
    ToolOutlined,
    AppstoreOutlined,
    GlobalOutlined,
} from '@ant-design/icons';

const { Paragraph } = Typography;

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
        <Section maxWidth="wide">
            {/* Header with filter */}
            <motion.div
                {...motionVariants.fadeInUp}
                style={{ textAlign: 'center', marginBottom: '40px' }}
            >
                <SectionHeader
                    title={t('title')}
                    subtitle={t('subtitle')}
                    animate={false}
                />

                <Segmented
                    options={filterOptions}
                    value={filter}
                    onChange={(value) => setFilter(value as FilterType)}
                    style={{
                        background: getColor(mode, 'bgMuted'),
                        padding: '4px',
                    }}
                />
            </motion.div>

            {/* Tools grid */}
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

            {/* Footer note */}
            <motion.div
                {...motionVariants.fadeIn}
                style={{ textAlign: 'center', marginTop: '48px' }}
            >
                <Paragraph style={{
                    color: getColor(mode, 'textDisabled'),
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                }}>
                    <GlobalOutlined />
                    {t.rich('open_source_note', {
                        strong: (chunks) => (
                            <strong style={{ color: getColor(mode, 'textSubtle') }}>
                                {chunks}
                            </strong>
                        )
                    })}
                </Paragraph>
            </motion.div>
        </Section>
    );
}
