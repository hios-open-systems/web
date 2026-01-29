'use client';

import React, { useState } from 'react';
import { Row, Col, Typography, Card } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';
import { useTranslations } from 'next-intl';
import {
    FileTextOutlined,
    ToolOutlined,
    CodeOutlined,
    QuestionCircleOutlined,
    FilePdfOutlined,
    GithubOutlined,
    LinkOutlined,
    RightOutlined,
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface DocItem {
    title: string;
    type: 'pdf' | 'markdown' | 'github' | 'external';
    description: string;
}

interface DocCategory {
    id: string;
    titleKey: string;
    descriptionKey: string;
    icon: React.ReactNode;
    color: string;
    items: DocItem[];
}

const categories: DocCategory[] = [
    {
        id: 'guides',
        titleKey: 'guides_title',
        descriptionKey: 'guides_desc',
        icon: <FileTextOutlined />,
        color: '#10b981',
        items: [
            { title: 'Guía de soldadura SMD', type: 'pdf', description: 'Técnicas básicas para soldar componentes SMD' },
            { title: 'Instrucciones de ensamblaje', type: 'pdf', description: 'Paso a paso para armar cada proyecto' },
            { title: 'Tips de prototipado', type: 'markdown', description: 'Consejos aprendidos en el proceso' },
        ],
    },
    {
        id: 'schematics',
        titleKey: 'schematics_title',
        descriptionKey: 'schematics_desc',
        icon: <ToolOutlined />,
        color: '#f59e0b',
        items: [
            { title: 'Proyectos KiCad', type: 'github', description: 'Esquemáticos y PCB editables' },
            { title: 'Gerbers para fabricación', type: 'external', description: 'Archivos listos para JLCPCB/PCBWay' },
            { title: 'Diagramas de conexión', type: 'pdf', description: 'Pinouts y conexiones detalladas' },
        ],
    },
    {
        id: 'firmware',
        titleKey: 'firmware_title',
        descriptionKey: 'firmware_desc',
        icon: <CodeOutlined />,
        color: '#4096ff',
        items: [
            { title: 'Repositorios GitHub', type: 'github', description: 'Código fuente de todos los proyectos' },
            { title: 'Instrucciones de flasheo', type: 'markdown', description: 'Cómo programar los dispositivos' },
            { title: 'Configuración PlatformIO', type: 'markdown', description: 'Setup del entorno de desarrollo' },
        ],
    },
    {
        id: 'troubleshooting',
        titleKey: 'troubleshooting_title',
        descriptionKey: 'troubleshooting_desc',
        icon: <QuestionCircleOutlined />,
        color: '#ef4444',
        items: [
            { title: 'Problemas comunes', type: 'markdown', description: 'Errores frecuentes y soluciones' },
            { title: 'FAQ', type: 'markdown', description: 'Preguntas frecuentes' },
            { title: 'Diagnóstico de audio', type: 'pdf', description: 'Cómo debuggear problemas de sonido' },
        ],
    },
];

export function DocumentationSection() {
    const { mode } = useTheme();
    const t = useTranslations('Documentation');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const totalDocs = categories.reduce((acc, cat) => acc + cat.items.length, 0);

    const getTypeIcon = (type: DocItem['type']) => {
        switch (type) {
            case 'pdf':
                return <FilePdfOutlined style={{ color: '#ef4444' }} />;
            case 'github':
                return <GithubOutlined style={{ color: mode === 'dark' ? '#fff' : '#333' }} />;
            case 'markdown':
                return <FileTextOutlined style={{ color: '#4096ff' }} />;
            case 'external':
                return <LinkOutlined style={{ color: '#10b981' }} />;
            default:
                return <FileTextOutlined />;
        }
    };

    return (
        <section style={{
            padding: '80px 24px',
            background: mode === 'dark' ? '#0a0a0a' : '#fafafa',
            borderTop: mode === 'dark' ? '1px solid #1a1a1a' : '1px solid #f0f0f0',
            borderBottom: mode === 'dark' ? '1px solid #1a1a1a' : '1px solid #f0f0f0',
        }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    style={{ textAlign: 'center', marginBottom: '48px' }}
                >
                    <Title level={2} style={{
                        color: mode === 'dark' ? '#ffffff' : '#0d0d0d',
                        marginBottom: '12px',
                    }}>
                        {t('title') || 'Documentación Disponible'}
                    </Title>
                    <Paragraph style={{
                        color: mode === 'dark' ? '#666' : '#999',
                        fontSize: '15px',
                        marginBottom: '8px',
                    }}>
                        {t('subtitle') || 'Todo lo que necesitás para construir y entender los proyectos'}
                    </Paragraph>
                    <Text style={{
                        color: mode === 'dark' ? '#444' : '#bbb',
                        fontSize: '13px',
                    }}>
                        {totalDocs} {t('documents_count') || 'documentos disponibles'}
                    </Text>
                </motion.div>

                <Row gutter={[20, 20]}>
                    {categories.map((category, index) => (
                        <Col xs={24} md={12} key={category.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                            >
                                <Card
                                    hoverable
                                    onClick={() => setExpandedCategory(
                                        expandedCategory === category.id ? null : category.id
                                    )}
                                    style={{
                                        background: mode === 'dark' ? '#141414' : '#ffffff',
                                        border: mode === 'dark'
                                            ? `1px solid ${expandedCategory === category.id ? category.color + '40' : '#262626'}`
                                            : `1px solid ${expandedCategory === category.id ? category.color + '40' : '#f0f0f0'}`,
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                    }}
                                    styles={{
                                        body: { padding: '20px' }
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                    }}>
                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                                            <motion.div
                                                animate={{
                                                    y: expandedCategory === category.id ? 0 : [0, -4, 0],
                                                }}
                                                transition={{
                                                    duration: 2,
                                                    repeat: expandedCategory === category.id ? 0 : Infinity,
                                                    ease: 'easeInOut',
                                                }}
                                                style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '10px',
                                                    background: `${category.color}15`,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '20px',
                                                    color: category.color,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {category.icon}
                                            </motion.div>
                                            <div>
                                                <Text strong style={{
                                                    color: mode === 'dark' ? '#e6e6e6' : '#1a1a1a',
                                                    fontSize: '16px',
                                                    display: 'block',
                                                    marginBottom: '4px',
                                                }}>
                                                    {t(category.titleKey) || category.titleKey}
                                                </Text>
                                                <Text style={{
                                                    color: mode === 'dark' ? '#666' : '#999',
                                                    fontSize: '13px',
                                                }}>
                                                    {t(category.descriptionKey) || category.descriptionKey}
                                                </Text>
                                            </div>
                                        </div>
                                        <motion.div
                                            animate={{ rotate: expandedCategory === category.id ? 90 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <RightOutlined style={{
                                                color: mode === 'dark' ? '#444' : '#ccc',
                                                fontSize: '12px',
                                            }} />
                                        </motion.div>
                                    </div>

                                    <AnimatePresence>
                                        {expandedCategory === category.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                style={{ overflow: 'hidden' }}
                                            >
                                                <div style={{
                                                    marginTop: '20px',
                                                    paddingTop: '16px',
                                                    borderTop: mode === 'dark'
                                                        ? '1px solid #262626'
                                                        : '1px solid #f0f0f0',
                                                }}>
                                                    {category.items.map((item, itemIdx) => (
                                                        <motion.div
                                                            key={item.title}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: itemIdx * 0.1 }}
                                                            style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '12px',
                                                                padding: '10px 0',
                                                                borderBottom: itemIdx < category.items.length - 1
                                                                    ? mode === 'dark'
                                                                        ? '1px solid #1a1a1a'
                                                                        : '1px solid #f5f5f5'
                                                                    : 'none',
                                                            }}
                                                        >
                                                            <span style={{ fontSize: '14px' }}>
                                                                {getTypeIcon(item.type)}
                                                            </span>
                                                            <div style={{ flex: 1 }}>
                                                                <Text style={{
                                                                    color: mode === 'dark' ? '#b3b3b3' : '#333',
                                                                    fontSize: '14px',
                                                                    display: 'block',
                                                                }}>
                                                                    {item.title}
                                                                </Text>
                                                                <Text style={{
                                                                    color: mode === 'dark' ? '#555' : '#999',
                                                                    fontSize: '12px',
                                                                }}>
                                                                    {item.description}
                                                                </Text>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </Card>
                            </motion.div>
                        </Col>
                    ))}
                </Row>
            </div>
        </section>
    );
}
