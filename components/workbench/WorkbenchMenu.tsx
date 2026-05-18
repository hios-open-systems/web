'use client';

import Link from 'next/link';
import { RightOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { getWorkbenchToolsBySection, workbenchSections } from '@/config/workbench';
import { getWorkbenchIcon } from './workbenchIcons';
import { LocalityBadge } from './LocalityBadge';
import styles from './workbench.module.css';

/**
 * Grouped tool menu for the workbench landing — sections are a grouping of
 * the menu, not a navigation gate. Replaces the flat card grid.
 */
export function WorkbenchMenu() {
  const locale = useLocale();
  const t = useTranslations('Workbench');

  return (
    <div className={styles.wbMenu}>
      {workbenchSections.map((section) => {
        const tools = getWorkbenchToolsBySection(section.id).filter((tool) => !tool.external);
        if (tools.length === 0) return null;
        return (
          <section key={section.id} className={styles.wbMenuGroup}>
            <div className={styles.wbMenuGroupHead}>
              <span
                className={styles.wbMenuGroupIcon}
                style={{ color: section.accent, background: `${section.accent}1a` }}
                aria-hidden
              >
                {getWorkbenchIcon(section.icon)}
              </span>
              <div>
                <h2 className={styles.wbMenuGroupTitle}>{t(`sections.${section.id}.title`)}</h2>
                <p className={styles.wbMenuGroupDesc}>{t(`sections.${section.id}.description`)}</p>
              </div>
            </div>
            <ul className={styles.wbMenuList}>
              {tools.map((tool) => (
                <li key={tool.id}>
                  <Link href={`/${locale}${tool.href}`} className={styles.wbMenuRow}>
                    <span
                      className={styles.wbMenuRowIcon}
                      style={{ color: tool.accent, background: `${tool.accent}1a` }}
                    >
                      {getWorkbenchIcon(tool.icon)}
                    </span>
                    <span className={styles.wbMenuRowText}>
                      <span className={styles.wbMenuRowName}>{t(`packs.${tool.id}.title`)}</span>
                      <span className={styles.wbMenuRowDesc}>{t(`packs.${tool.id}.description`)}</span>
                    </span>
                    <LocalityBadge kind={tool.locality} />
                    <RightOutlined className={styles.wbMenuRowChevron} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
