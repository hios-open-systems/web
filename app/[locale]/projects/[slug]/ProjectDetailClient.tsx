'use client';

import React from 'react';
import { ProjectDetailHeader } from '@/components/projects/ProjectDetailHeader';
import { Typography, Tag, Row, Col, Card, Button, Space, Empty } from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  GithubOutlined,
  DoubleRightOutlined,
  LinkOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { useTheme } from '@/lib/ThemeContext';
import { ProjectMeta } from '@/lib/projects';
import { getPrintsByProject } from '@/config/prints';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { LocalMarkdownImage } from '@/components/common/LocalMarkdownImage';
import remarkGfm from 'remark-gfm';
import { useLocale, useTranslations } from 'next-intl';
import { ImageCarousel } from '@/components/common/ImageCarousel';
import { ProjectComponents } from '@/components/projects/ProjectComponents';
import { ProjectStlPreview } from '@/components/projects/ProjectStlPreview';
import { ProjectPrintsShowcase } from '@/components/projects/ProjectPrintsShowcase';
import { ProjectFirmwareExplorer } from '@/components/projects/ProjectFirmwareExplorer';
import { ProjectSection, ProjectSectionNav, type SectionLink } from '@/components/projects/sections/ProjectSection';
import { ProjectSoldering } from '@/components/projects/sections/ProjectSoldering';
import { WIRING_GUIDE_SLUGS } from '@/config/pinouts/guides';

const { Title, Paragraph, Text } = Typography;

interface ProjectDetailClientProps {
  project: ProjectMeta & { readme: string; gallery?: string[] };
  slug: string;
  softwareBanner?: React.ReactNode;
  gettingStarted?: React.ReactNode;
}

interface Story {
  moment: string;
  struggle?: string;
  whatWorks?: string[];
  whatDoesnt?: string[];
  resources?: { name: string; url: string }[];
  bom?: { component: string; qty: number; notes?: string }[];
  specs?: { label: string; value: string }[];
  futureFeatures?: string[];
}

export function ProjectDetailClient({
  project,
  slug,
  softwareBanner,
  gettingStarted,
}: ProjectDetailClientProps) {
  const { mode } = useTheme();
  const locale = useLocale();
  const t = useTranslations('ProjectDetail');
  const tProjects = useTranslations('Projects');
  const tAssembly = useTranslations('Assembly');
  const tGuide = useTranslations('ProjectGettingStarted');
  const accentColor = 'var(--accent-text)';
  const bgColor = 'var(--hios-bg)';
  const textColor = 'var(--hios-text)';
  const secondaryColor = 'var(--hios-text-secondary)';
  const mutedColor = 'var(--hios-text-muted)';
  const cardBorder = '1px solid var(--hios-border)';

  const groupedAssets =
    project.technicalAssets?.reduce<Record<string, typeof project.technicalAssets>>((acc, asset) => {
      if (!acc[asset.kind]) acc[asset.kind] = [];
      acc[asset.kind].push(asset);
      return acc;
    }, {}) || {};

  const kindLabel: Record<string, string> = {
    '3d': '3D / STL',
    cad: 'CAD',
    pcb: 'PCB / KiCad',
    doc: t('asset_documentation'),
    firmware: t('asset_firmware'),
    data: t('asset_data'),
  };

  const projectPrints = getPrintsByProject(slug);

  let story: Story | null = null;
  try {
    const rawStory = tProjects.raw(slug);
    if (rawStory && typeof rawStory === 'object' && 'moment' in rawStory) {
      story = rawStory as Story;
    }
  } catch {
    story = null;
  }

  const hasSoldering = WIRING_GUIDE_SLUGS.includes(slug);
  const hasFirmware = !!project.firmwareFiles?.length;
  const sectionLinks: SectionLink[] = [
    ...(story ? [{ id: 'overview', label: t('nav_overview') }] : []),
    ...(hasSoldering ? [{ id: 'soldering', label: tAssembly('title'), primary: true }] : []),
    ...(gettingStarted ? [{ id: 'usage', label: tGuide('usage') }, { id: 'flash', label: tGuide('flash') }] : []),
    { id: 'docs', label: t('nav_docs') },
    ...(projectPrints.length > 0 ? [{ id: 'models-3d', label: t('nav_parts') }] : []),
    ...(hasFirmware ? [{ id: 'firmware', label: t('nav_firmware') }] : []),
    { id: 'files', label: t('nav_files') },
  ];
  const numberOf = (id: string) => sectionLinks.findIndex((link) => link.id === id) + 1;

  // Strip leading H1 from README so the page has a single H1 in ProjectDetailHeader
  const readmeBody = project.readme.replace(/^#\s+[^\n]+\n+/, '');
  const sectionContainer: React.CSSProperties = { maxWidth: 'min(100%, 1240px)', width: '100%', margin: '0 auto' };

  const renderAssetRow = (asset: ProjectMeta['technicalAssets'][number]) => (
    <div
      key={`${asset.source}-${asset.name}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        padding: '8px 6px',
        borderBottom: mode === 'dark' ? '1px solid #1f1f1f' : '1px solid #f0f0f0',
      }}
    >
      <Space size={8} wrap style={{ minWidth: 0, flex: '1 1 240px' }}>
        <FileOutlined style={{ color: accentColor }} />
        <Text style={{ color: textColor, overflowWrap: 'anywhere', fontFamily: 'var(--font-stack-mono)', fontSize: 13 }}>
          {asset.name}
        </Text>
        <Tag style={{ border: 'none', fontSize: 10 }}>
          {t(asset.source === 'download' ? 'download_file' : 'source_file')}
        </Tag>
      </Space>

      <Space size={6} wrap>
        {asset.githubUrl && (
          <Button size="small" icon={<GithubOutlined />} href={asset.githubUrl} target="_blank">
            GitHub
          </Button>
        )}
        {asset.path && (
          <Button size="small" icon={<LinkOutlined />} href={asset.path} target="_blank">
            {t('open')}
          </Button>
        )}
        {asset.path && asset.ext.toLowerCase() === 'stl' && (
          <ProjectStlPreview url={asset.path} name={asset.name} />
        )}
        {asset.path && (
          <Button size="small" icon={<DownloadOutlined />} href={asset.path} target="_blank">
            {t('download')}
          </Button>
        )}
      </Space>
    </div>
  );

  return (
    <div style={{ background: bgColor, minHeight: '100vh', paddingBottom: '64px', overflowX: 'clip' }}>
      {/* Header / Back navigation */}
      <nav
        style={{
          ...sectionContainer,
          padding: '20px 24px 12px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Link href={`/${locale}/projects`} passHref>
          <Button type="text" icon={<ArrowLeftOutlined />} style={{ color: secondaryColor }}>
            {t('back')}
          </Button>
        </Link>
      </nav>

      <section style={{ ...sectionContainer, padding: '0 24px 20px' }}>
        <ProjectDetailHeader project={project} slug={slug} hasGuide={!!gettingStarted} />
      </section>

      <ProjectSectionNav links={sectionLinks} label={t('nav_label')} />

      {softwareBanner && <div style={{ padding: '0 24px' }}>{softwareBanner}</div>}

      {/* Gallery */}
      {project.gallery && project.gallery.length > 0 && (
        <section style={{ ...sectionContainer, padding: '0 24px 36px' }}>
          <ImageCarousel images={project.gallery} alt={project.name} />
        </section>
      )}

      {/* Technical Summary Card */}
      {story && (
        <section id="overview" style={{ ...sectionContainer, padding: '0 24px 32px', scrollMarginTop: 140 }}>
          <Card
            style={{
              background: 'var(--hios-bg-secondary)',
              border: cardBorder,
              borderRadius: '14px',
              overflow: 'hidden',
            }}
            styles={{ body: { padding: '28px 32px' } }}
          >
            <Text
              className="tech-label"
              style={{
                color: accentColor,
                display: 'block',
                marginBottom: '12px',
              }}
            >
              {t('moment')}
            </Text>
            <Paragraph style={{ color: textColor, marginBottom: '16px', fontSize: '18px', lineHeight: 1.55 }}>
              {story.moment}
            </Paragraph>
            {story.struggle && (
              <Paragraph style={{ color: secondaryColor, fontSize: '15px', lineHeight: 1.7, marginBottom: 0 }}>
                {story.struggle}
              </Paragraph>
            )}
          </Card>
        </section>
      )}

      {/* Datasheet Specifications */}
      {story?.specs && (
        <section style={{ ...sectionContainer, padding: '0 24px 36px' }}>
          <Title level={3} style={{ color: textColor, marginBottom: '16px' }}>
            {t('specifications')}
          </Title>
          <Row gutter={[12, 8]}>
            {story.specs.map((spec, idx) => (
              <Col xs={24} sm={12} key={idx}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '12px 16px',
                    background: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                    border: cardBorder,
                    borderRadius: '10px',
                    height: '100%',
                  }}
                >
                  <Text
                    style={{
                      color: mutedColor,
                      fontSize: '11px',
                      fontFamily: 'var(--font-stack-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {spec.label}
                  </Text>
                  <Text style={{ color: textColor, fontWeight: 500, fontSize: '14px', lineHeight: 1.45 }}>
                    {spec.value}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </section>
      )}

      {/* Bill of Materials (BOM) */}
      {story?.bom && <ProjectComponents items={story.bom} />}

      {/* What Works / Scope & Requirements */}
      {story && (story.whatWorks || story.whatDoesnt) && (
        <section style={{ ...sectionContainer, padding: '0 24px 36px' }}>
          <Row gutter={[16, 16]}>
            {story.whatWorks && (
              <Col xs={24} md={14}>
                <Card
                  style={{
                    background: mode === 'dark' ? 'rgba(16,185,129,0.06)' : 'rgba(16,185,129,0.04)',
                    border: `1px solid ${mode === 'dark' ? 'rgba(16,185,129,0.22)' : 'rgba(16,185,129,0.18)'}`,
                    borderRadius: '12px',
                    height: '100%',
                  }}
                  styles={{ body: { padding: '20px' } }}
                >
                  <Text
                    style={{
                      color: '#10b981',
                      fontWeight: 600,
                      fontSize: '12px',
                      fontFamily: 'var(--font-stack-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '14px',
                    }}
                  >
                    {t('what_works')}
                  </Text>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {story.whatWorks.map((item, idx) => (
                      <li
                        key={idx}
                        style={{
                          color: mode === 'dark' ? '#d1fae5' : '#065f46',
                          marginBottom: '8px',
                          fontSize: '14px',
                          lineHeight: 1.55,
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Col>
            )}
            {story.whatDoesnt && (
              <Col xs={24} md={10}>
                <Card
                  style={{
                    background: mode === 'dark' ? 'rgba(249,115,22,0.06)' : 'rgba(249,115,22,0.04)',
                    border: `1px solid ${mode === 'dark' ? 'rgba(249,115,22,0.22)' : 'rgba(249,115,22,0.18)'}`,
                    borderRadius: '12px',
                    height: '100%',
                  }}
                  styles={{ body: { padding: '20px' } }}
                >
                  <Text
                    style={{
                      color: '#f97316',
                      fontWeight: 600,
                      fontSize: '12px',
                      fontFamily: 'var(--font-stack-mono)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      display: 'block',
                      marginBottom: '14px',
                    }}
                  >
                    {t('what_needs_improvement')}
                  </Text>
                  <ul style={{ margin: 0, paddingLeft: '18px' }}>
                    {story.whatDoesnt.map((item, idx) => (
                      <li
                        key={idx}
                        style={{
                          color: mode === 'dark' ? '#fed7aa' : '#9a3412',
                          marginBottom: '8px',
                          fontSize: '14px',
                          lineHeight: 1.55,
                        }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Col>
            )}
          </Row>
        </section>
      )}

      {hasSoldering && (
        <ProjectSection id="soldering" index={numberOf('soldering')} title={tAssembly('title')}
          description={tAssembly('intro')}
          actions={<Link href={`/${locale}/pinouts/${slug}`}>{t('full_pinout')} →</Link>}>
          <ProjectSoldering slug={slug} />
        </ProjectSection>
      )}

      {/* Interactive Getting Started + Live Demo + Flash Instructions */}
      {gettingStarted}

      {/* Full Technical Documentation (Markdown README) */}
      <ProjectSection id="docs" index={numberOf('docs')} title={t('nav_docs')} description={t('docs_description')}>
        <div className="markdown-content" style={{ color: textColor }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              img: LocalMarkdownImage,
              h1: ({ children }) => (
                <Title level={2} style={{ color: textColor, marginTop: '36px', marginBottom: '20px' }}>
                  {children}
                </Title>
              ),
              h2: ({ children }) => (
                <Title
                  level={2}
                  style={{
                    color: textColor,
                    marginTop: '44px',
                    marginBottom: '20px',
                    borderBottom: cardBorder,
                    paddingBottom: '10px',
                    fontSize: '22px',
                  }}
                >
                  {children}
                </Title>
              ),
              h3: ({ children }) => (
                <Title level={3} style={{ color: textColor, marginTop: '28px', marginBottom: '14px', fontSize: '18px' }}>
                  {children}
                </Title>
              ),
              p: ({ children }) => (
                <Paragraph style={{ color: secondaryColor, fontSize: '15.5px', lineHeight: 1.75, marginBottom: '16px' }}>
                  {children}
                </Paragraph>
              ),
              li: ({ children }) => (
                <li style={{ color: secondaryColor, fontSize: '15.5px', lineHeight: 1.75, marginBottom: '8px' }}>
                  {children}
                </li>
              ),
              table: ({ children }) => (
                <div
                  style={{
                    overflowX: 'auto',
                    margin: '20px 0 28px',
                    border: cardBorder,
                    borderRadius: '10px',
                    background: 'var(--hios-bg-secondary)',
                  }}
                >
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>{children}</table>
                </div>
              ),
              th: ({ children }) => (
                <th
                  style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    borderBottom: cardBorder,
                    color: textColor,
                    fontFamily: 'var(--font-stack-mono)',
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                  }}
                >
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td
                  style={{
                    padding: '10px 14px',
                    borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
                    color: secondaryColor,
                    verticalAlign: 'top',
                    lineHeight: 1.6,
                  }}
                >
                  {children}
                </td>
              ),
              pre: ({ children }) => (
                <pre
                  style={{
                    background: mode === 'dark' ? '#11161d' : '#f1f5f9',
                    border: cardBorder,
                    borderRadius: '10px',
                    padding: '14px 16px',
                    overflowX: 'auto',
                    margin: '16px 0 24px',
                    fontSize: '13px',
                    lineHeight: 1.6,
                  }}
                >
                  {children}
                </pre>
              ),
              code: ({ children, className }) => {
                const isBlock = Boolean(className);
                if (isBlock) {
                  return <code style={{ fontFamily: 'var(--font-stack-mono)', color: textColor }}>{children}</code>;
                }
                return (
                  <code
                    style={{
                      background: mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                      color: accentColor,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.88em',
                      fontFamily: 'var(--font-stack-mono)',
                    }}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {readmeBody}
          </ReactMarkdown>
        </div>
      </ProjectSection>

      {/* Printable 3D Parts & Inline STL Viewer */}
      {projectPrints.length > 0 && (
        <ProjectSection id="models-3d" index={numberOf('models-3d')} title={t('printable_parts')}
          description={t('printable_parts_description', { count: projectPrints.length })}
          actions={<Link href={`/${locale}/prints#prints-${slug}`}>{t('view_in_maker')} →</Link>}>
          <ProjectPrintsShowcase
            prints={projectPrints}
            externalLinks={
              slug === 'pad'
                ? [{ name: 'Tapa impresa del stick (Thingiverse #6189483)', url: 'https://www.thingiverse.com/thing:6189483' }]
                : slug === 'btdac'
                ? [{ name: 'Gabinetes para ESP32 + DAC (Printables)', url: 'https://www.printables.com/search/models?q=esp32+pcm5102' }]
                : slug === 'speaker'
                ? [{ name: 'Cajas acústicas para parlantes 40mm (Thingiverse)', url: 'https://www.thingiverse.com/search?q=speaker+40mm+enclosure' }]
                : []
            }
          />
        </ProjectSection>
      )}

      {/* Real Firmware & App Source Code Explorer */}
      {project.firmwareFiles && project.firmwareFiles.length > 0 && (
        <ProjectSection id="firmware" index={numberOf('firmware')} title={t('firmware_title')}
          description={t('firmware_description', { count: project.firmwareFiles.length, path: `projects/${slug}/` })}
          actions={<a href={`https://github.com/hios-open-systems/web/tree/main/projects/${slug}`} target="_blank" rel="noopener noreferrer"><GithubOutlined /> GitHub ↗</a>}>
          <ProjectFirmwareExplorer files={project.firmwareFiles} slug={slug} />
        </ProjectSection>
      )}

      {/* References & Documentation Links */}
      {story?.resources && (
        <section style={{ ...sectionContainer, margin: '0 auto 24px', padding: '0 24px' }}>
          <Card
            style={{
              background: mode === 'dark' ? 'rgba(14,165,233,0.06)' : 'rgba(14,165,233,0.04)',
              border: `1px solid ${mode === 'dark' ? 'rgba(14,165,233,0.2)' : 'rgba(14,165,233,0.15)'}`,
              borderRadius: '12px',
            }}
            styles={{ body: { padding: '20px' } }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  color: '#0ea5e9',
                  fontWeight: 600,
                  fontSize: '12px',
                  fontFamily: 'var(--font-stack-mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {t('resources')}
              </Text>
              <Button
                size="small"
                icon={<GithubOutlined />}
                href={`https://github.com/hios-open-systems/web/tree/main/projects/${slug}`}
                target="_blank"
              >
                {t('view_on_github')}
              </Button>
            </div>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {story.resources.map((resource, idx) => {
                const isInternal = resource.url.startsWith('/');
                const href = isInternal ? `/${locale}${resource.url}` : resource.url;
                return (
                  <a
                    key={idx}
                    href={href}
                    target={isInternal ? undefined : '_blank'}
                    rel={isInternal ? undefined : 'noopener noreferrer'}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      borderRadius: '8px',
                      textDecoration: 'none',
                    }}
                  >
                    <Text style={{ color: mode === 'dark' ? '#7dd3fc' : '#0284c7', fontWeight: 500 }}>
                      {resource.name}
                    </Text>
                    <DoubleRightOutlined style={{ fontSize: '10px', color: mutedColor }} />
                  </a>
                );
              })}
            </Space>
          </Card>
        </section>
      )}

      {/* Technical Files & 3D Assets */}
      <ProjectSection id="files" index={numberOf('files')} title={t('technical_files')} description={t('technical_files_description')}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {Object.keys(groupedAssets).length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span style={{ color: secondaryColor }}>{t('no_technical_files')}</span>}
              />
            ) : (
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                {Object.entries(groupedAssets).map(([kind, assets]) => {
                  const limit = kind === '3d' ? assets.length : 6;
                  const visibleAssets = assets.slice(0, limit);
                  const hiddenAssets = assets.slice(limit);
                  return (
                    <Card
                      key={kind}
                      size="small"
                      title={
                        <span style={{ color: textColor }}>
                          {kindLabel[kind] || kind.toUpperCase()} ({assets.length})
                        </span>
                      }
                      style={{
                        background: 'var(--hios-bg-secondary)',
                        border: cardBorder,
                        borderRadius: '10px',
                      }}
                      styles={{ body: { padding: '10px 12px' } }}
                    >
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        {visibleAssets.map(renderAssetRow)}
                        {hiddenAssets.length > 0 && (
                          <details style={{ paddingTop: 6 }}>
                            <summary
                              style={{
                                cursor: 'pointer',
                                color: accentColor,
                                fontSize: 13,
                                fontFamily: 'var(--font-stack-mono)',
                                padding: '4px 6px',
                              }}
                            >
                              + {hiddenAssets.length} {t('source_file').toLowerCase()}
                            </summary>
                            <div style={{ marginTop: 8 }}>{hiddenAssets.map(renderAssetRow)}</div>
                          </details>
                        )}
                      </Space>
                    </Card>
                  );
                })}
              </Space>
            )}
          </Space>
      </ProjectSection>
    </div>
  );
}
