'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightOutlined } from '@ant-design/icons';
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from '@/lib/ThemeContext';
import { getWorkbenchToolsBySection, workbenchSections, workbenchSignals, workbenchTools } from '@/config/workbench';
import { getWorkbenchIcon } from './workbenchIcons';
import styles from './workbench.module.css';

const { Paragraph, Text, Title } = Typography;

export function WorkbenchLanding() {
    const locale = useLocale();
    const t = useTranslations('Workbench');
    const { mode } = useTheme();
  const visibleTools = workbenchTools.filter((tool) => !tool.external);
  const featuredTools = visibleTools.filter((tool) => tool.featured).slice(0, 6);
    const themeVars = {
        '--wb-hero-border': mode === 'dark' ? 'rgba(14,165,233,0.25)' : 'rgba(14,165,233,0.18)',
        '--wb-hero-bg': mode === 'dark'
            ? 'linear-gradient(140deg, rgba(2,6,23,1) 0%, rgba(15,23,42,1) 50%, rgba(12,74,110,0.55) 100%)'
            : 'linear-gradient(140deg, #ffffff 0%, #eff6ff 55%, #dbeafe 100%)',
        '--wb-surface-border': mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-bg': mode === 'dark' ? '#111827' : '#ffffff',
        '--wb-surface-soft-border': mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)',
        '--wb-surface-soft-bg': mode === 'dark' ? '#0f172a' : '#f8fafc',
        '--wb-text-secondary': mode === 'dark' ? '#cbd5e1' : '#334155',
        '--wb-text-muted': mode === 'dark' ? '#94a3b8' : '#64748b',
    } as React.CSSProperties;

    return (
        <Space direction="vertical" size={28} style={themeVars} className={styles.stackFull}>
            <Card
                className={styles.heroCard}
                styles={{ body: { padding: 0 } }}
            >
                <div className={styles.heroGrid}>
                    <Space direction="vertical" size={14} className={`${styles.stackFull} ${styles.heroBody}`}>
                        <Tag color="blue">{t('landing.badge')}</Tag>
                    <div className={styles.heroLead}>
                      <Title level={1} className={styles.heroTitle}>{t('landing.title')}</Title>
                      <div className={styles.heroMetrics}>
                        <div className={styles.heroMetric}>
                          <Text className={styles.metricTone}>{t('landing.metrics.sections')}</Text>
                          <Text strong className={styles.heroMetricValue}>{workbenchSections.length}</Text>
                        </div>
                        <div className={styles.heroMetric}>
                          <Text className={styles.metricTone}>{t('landing.metrics.tools')}</Text>
                          <Text strong className={styles.heroMetricValue}>{visibleTools.length}</Text>
                        </div>
                        <div className={styles.heroMetric}>
                          <Text className={styles.metricTone}>{t('landing.metrics.network')}</Text>
                          <Text strong className={styles.heroMetricValue}>{t('landing.metrics.networkValue')}</Text>
                        </div>
                      </div>
                    </div>
                        <Paragraph className={styles.heroSubtitle}>
                            {t('landing.subtitle')}
                        </Paragraph>
                        <Space wrap>
                            {workbenchSignals.map((signal) => (
                                <Tag key={signal.key} color="default" className={styles.signalTag}>
                                    {t(`signals.${signal.key}`)}
                                </Tag>
                            ))}
                        </Space>
                        <div className={styles.heroActions}>
                          <Link href={`/${locale}/workbench/sections/validation`}>
                            <Button type="primary" size="large" icon={<ArrowRightOutlined />} block className={styles.primaryAction}>
                                    {t('landing.primaryCta')}
                                </Button>
                            </Link>
                          <Link href={`/${locale}/workbench/sections/generation`}>
                            <Button size="large" block className={styles.secondaryAction}>{t('landing.secondaryCta')}</Button>
                            </Link>
                        </div>
                        <div className={styles.quickLaunchStrip}>
                          {featuredTools.map((tool) => (
                            <Link key={tool.id} href={`/${locale}${tool.href}`} className={styles.quickLaunchChip}>
                              <span className={styles.quickLaunchIcon} style={{ color: tool.accent, background: `${tool.accent}20` }}>
                                {getWorkbenchIcon(tool.icon)}
                              </span>
                              <span className={styles.quickLaunchCopy}>
                                <Text strong>{t(`packs.${tool.id}.title`)}</Text>
                                <Text className={styles.packDescription}>{t('toolCta')}</Text>
                              </span>
                            </Link>
                          ))}
                        </div>
                    </Space>

                    <div className={styles.heroPanel}>
                        <Text strong className={styles.heroPanelTitle}>{t('landing.panelTitle')}</Text>
                        <Paragraph className={styles.heroPanelSubtitle}>{t('landing.panelSubtitle')}</Paragraph>
                        <div className={styles.routeList}>
                {workbenchSections.map((section) => (
                  <Link key={section.id} href={`/${locale}${section.href}`} className={styles.routeRow}>
                    <div className={styles.routeRowIcon} style={{ color: section.accent, background: `${section.accent}20` }}>
                      {getWorkbenchIcon(section.icon)}
                                    </div>
                                    <div className={styles.routeRowContent}>
                                  <Text strong>{t(`sections.${section.id}.title`)}</Text>
                                  <Text className={styles.packDescription}>{t(`sections.${section.id}.description`)}</Text>
                                    </div>
                                <Text className={styles.sectionCount}>{getWorkbenchToolsBySection(section.id).length} {t('sectionToolCount')}</Text>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            <div className={styles.sectionHeading}>
                <Title level={3} className={styles.sectionTitle}>{t('landing.sectionsTitle')}</Title>
                <Paragraph className={styles.sectionSubtitle}>{t('landing.sectionsSubtitle')}</Paragraph>
            </div>

            <Row gutter={[20, 20]}>
          {workbenchSections.map((section) => (
                <Col xs={24} md={8} key={section.id}>
                    <Link href={`/${locale}${section.href}`} className={styles.packLink}>
                            <Card
                                hoverable
                                className={styles.packCard}
                                styles={{ body: { padding: 22 } }}
                            >
                                <Space direction="vertical" size={14} className={styles.stackFull}>
                          <div className={styles.packIcon} style={{ color: section.accent, background: `${section.accent}20` }}>
                            {getWorkbenchIcon(section.icon)}
                                    </div>
                                    <div>
                            <Text strong style={{ display: 'block', marginBottom: 6 }}>{t(`sections.${section.id}.title`)}</Text>
                            <Text className={styles.packDescription}>{t(`sections.${section.id}.description`)}</Text>
                                    </div>
                          <Text className={styles.sectionCount}>{getWorkbenchToolsBySection(section.id).length} {t('sectionToolCount')}</Text>
                                    <Text className={styles.cardCta}>{t('landing.cardCta')}</Text>
                                </Space>
                            </Card>
                        </Link>
                    </Col>
                ))}
            </Row>

        <div className={styles.sectionHeading}>
          <Title level={3} className={styles.sectionTitle}>{t('landing.catalogTitle')}</Title>
          <Paragraph className={styles.sectionSubtitle}>{t('landing.catalogSubtitle')}</Paragraph>
        </div>

        <Space direction="vertical" size={20} className={styles.stackFull}>
          {workbenchSections.map((section) => {
            const tools = getWorkbenchToolsBySection(section.id);

            return (
              <Card key={section.id} className={styles.catalogSection} styles={{ body: { padding: 22 } }}>
                <div className={styles.catalogHeader}>
                  <div>
                    <Tag className={styles.signalTag}>{t(`sections.${section.id}.title`)}</Tag>
                    <Title level={4} style={{ margin: '12px 0 8px' }}>{t(`sections.${section.id}.title`)}</Title>
                    <Paragraph className={styles.sectionSubtitle}>{t(`sections.${section.id}.description`)}</Paragraph>
                  </div>
                  <Link href={`/${locale}${section.href}`}>
                    <Button>{t('viewAll')}</Button>
                  </Link>
                </div>

                <Row gutter={[16, 16]}>
                  {tools.map((tool) => (
                    <Col xs={24} md={12} xl={8} key={tool.id}>
                      <Link href={`/${locale}${tool.href}`} className={styles.packLink}>
                        <Card hoverable className={styles.packCard} styles={{ body: { padding: 20 } }}>
                          <Space direction="vertical" size={12} className={styles.stackFull}>
                            <div className={styles.packIcon} style={{ color: tool.accent, background: `${tool.accent}20` }}>
                              {getWorkbenchIcon(tool.icon)}
                            </div>
                            <div>
                              <Text strong style={{ display: 'block', marginBottom: 6 }}>{t(`packs.${tool.id}.title`)}</Text>
                              <Text className={styles.packDescription}>{t(`packs.${tool.id}.description`)}</Text>
                            </div>
                            <Text className={styles.cardCta}>{t('toolCta')}</Text>
                          </Space>
                        </Card>
                      </Link>
                    </Col>
                  ))}
                </Row>
              </Card>
            );
          })}
        </Space>

            <div className={styles.sectionHeading}>
                <Title level={3} className={styles.sectionTitle}>{t('landing.principlesTitle')}</Title>
                <Paragraph className={styles.sectionSubtitle}>{t('landing.principlesSubtitle')}</Paragraph>
            </div>

            <div className={styles.principlesGrid}>
                {workbenchSignals.map((signal) => (
                    <Card key={signal.key} className={styles.principleCard} styles={{ body: { padding: 20 } }}>
                        <Space direction="vertical" size={8} className={styles.stackFull}>
                            <Tag className={styles.signalTag}>{t(`signals.${signal.key}`)}</Tag>
                            <Text className={styles.principleText}>{t(`landing.principles.${signal.key}`)}</Text>
                        </Space>
                    </Card>
                ))}
            </div>
        </Space>
    );
}