import type { ReactNode } from 'react';
import type { Activity } from '@/lib/workbench/discovery';
import { ActivityGraphic } from './ActivityGraphic';
import styles from './pageIntro.module.css';

interface PageIntroProps {
  title: ReactNode;
  eyebrow?: ReactNode;
  description?: ReactNode;
  area?: Activity;
  actions?: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
}

/** Server-safe heading shared by catalogs, documentation and interactive tools. */
export function PageIntro({
  title,
  eyebrow,
  description,
  area = 'development',
  actions,
  meta,
  children,
  compact = false,
}: PageIntroProps) {
  return (
    <header className={styles.intro} data-area={area} data-compact={compact} data-page-intro>
      <div className={styles.top}>
        {eyebrow && (
          <span className={styles.eyebrow}>
            <i aria-hidden />
            {eyebrow}
          </span>
        )}
        {meta && <div className={styles.meta}>{meta}</div>}
      </div>
      <div className={styles.body}>
        <div className={styles.copy}>
          <h1>{title}</h1>
          {description && <p className={styles.description}>{description}</p>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
        <div className={styles.art} aria-hidden>
          <ActivityGraphic activity={area} />
        </div>
      </div>
      {children && <div className={styles.details}>{children}</div>}
    </header>
  );
}
