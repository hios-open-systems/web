'use client';

import Link from 'next/link';
import { Button, Tag } from 'antd';
import { DownloadOutlined, LinkOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import type { ProjectMeta } from '@/lib/projects';
import { WIRING_GUIDE_SLUGS } from '@/config/pinouts/guides';
import { PageIntro } from '@/components/ui/PageIntro';

export function ProjectDetailHeader({
  project,
  slug,
  hasGuide,
}: {
  project: ProjectMeta;
  slug: string;
  hasGuide: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations('ProjectDetail');
  const projects = useTranslations('Projects');
  const guide = useTranslations('ProjectGettingStarted');
  return (
    <PageIntro
      eyebrow="HIOS / HARDWARE"
      title={project.name}
      description={project.description}
      area="maker"
      meta={
        <Tag color={project.status === 'prototype' ? 'green' : 'orange'}>{projects(`status_${project.status}`)}</Tag>
      }
      actions={
        <>
          {hasGuide && (
            <>
              <Button href="#usage">{guide('usage')}</Button>
              <Button href="#flash" type="primary">
                {guide('flash')}
              </Button>
            </>
          )}
          {project.files.map((file) => (
            <Button key={file.name} icon={<DownloadOutlined />} href={file.path} target="_blank">
              {file.name}
            </Button>
          ))}
          {WIRING_GUIDE_SLUGS.includes(slug) && (
            <Link href={`/${locale}/pinouts/${slug}`}>
              <Button icon={<LinkOutlined />}>{t('wiring_guide')}</Button>
            </Link>
          )}
        </>
      }
    />
  );
}
