'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRightOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import type { Project } from '@/config/projects';
import styles from './projectCard.module.css';

export function ProjectCard({
  project,
  index = 0,
  details = false,
}: {
  project: Project;
  index?: number;
  details?: boolean;
}) {
  const t = useTranslations('Projects');
  const lab = useTranslations('Landing');
  const locale = useLocale();
  return (
    <Link data-reveal className={styles.project} href={`/${locale}/projects/${project.slug}`}>
      <ProjectArtwork project={project} index={index} />
      <div className={styles.projectInfo}>
        <div>
          <h3>{project.name}</h3>
          <p>{t(`cards.${project.slug}.description`)}</p>
        </div>
        <span className={styles.projectArrow}>
          <ArrowUpOutlined rotate={45} />
        </span>
      </div>
      {details && (
        <div className={styles.technologies}>
          {(t.raw('cards.' + project.slug + '.technologies') as string[]).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      )}
      <span className={styles.projectCta}>
        {lab('projectCta')} <ArrowRightOutlined />
      </span>
    </Link>
  );
}

function ProjectArtwork({ project, index }: { project: Project; index: number }) {
  const t = useTranslations('Projects');
  return (
    <div className={styles.projectImage}>
      {project.slug === 'hios-node-ai' ? (
        <div className={styles.projectDiagram} aria-hidden="true">
          <span>ESP32</span>
          <span>↔</span>
          <span>OLLAMA</span>
          <small>LOCAL NETWORK / HTTP / OLED</small>
        </div>
      ) : (
        <Image
          src={project.image}
          alt={project.name}
          fill
          sizes="(max-width: 700px) 100vw, 600px"
          style={{ objectFit: 'cover' }}
        />
      )}
      <span className={styles.projectNumber}>HI—0{index + 1}</span>
      <span className={styles.projectStatus}>{t(`status_${project.status}`)}</span>
    </div>
  );
}
