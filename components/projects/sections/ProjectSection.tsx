import type { ReactNode } from 'react';
import styles from './projectSections.module.css';

/** Same frame for every block of a project page: numbered kicker, title, one line of context. */
export function ProjectSection({ id, index, title, description, actions, children }: {
  id: string; index: number; title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode;
}) {
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <header className={styles.head}>
        <div>
          <span className={styles.kicker}>{String(index).padStart(2, '0')}</span>
          <h2 id={`${id}-title`}>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

export interface SectionLink { id: string; label: string; primary?: boolean }

/** Sticky jump bar: on a long hardware page you should never have to scroll to find the soldering guide. */
export function ProjectSectionNav({ links, label }: { links: SectionLink[]; label: string }) {
  return (
    <nav className={styles.nav} aria-label={label}>
      <ol className={styles.navList}>
        {links.map((link, i) => (
          <li key={link.id}>
            <a href={`#${link.id}`} className={link.primary ? styles.primary : undefined}>
              <span className={styles.navNum}>{String(i + 1).padStart(2, '0')}</span>{link.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
