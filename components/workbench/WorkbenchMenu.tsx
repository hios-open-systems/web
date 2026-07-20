'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { RightOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import {
  getWorkbenchToolsBySection,
  workbenchSections,
  workbenchTools,
  type WorkbenchTool,
} from '@/config/workbench';
import { type UsageState, EMPTY_USAGE, readUsage, togglePin, writeUsage } from '@/lib/workbench/usage';
import { getWorkbenchIcon } from './workbenchIcons';
import { LocalityBadge } from './LocalityBadge';
import styles from './workbench.module.css';

const BY_ID = new Map<string, WorkbenchTool>(workbenchTools.map((tool) => [tool.id, tool]));

export function WorkbenchMenu() {
  const locale = useLocale();
  const t = useTranslations('Workbench');
  const [usage, setUsage] = useState<UsageState>(EMPTY_USAGE);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUsage(readUsage());
    setMounted(true);
  }, []);

  const onTogglePin = (id: string) => {
    setUsage((prev) => {
      const next = togglePin(prev, id);
      writeUsage(next);
      return next;
    });
  };

  const pinnedTools = useMemo(
    () => usage.pinned.map((id) => BY_ID.get(id)).filter((t): t is WorkbenchTool => !!t && !t.external),
    [usage.pinned],
  );
  const recentTools = useMemo(
    () =>
      usage.recent
        .filter((id) => !usage.pinned.includes(id))
        .map((id) => BY_ID.get(id))
        .filter((t): t is WorkbenchTool => !!t && !t.external)
        .slice(0, 6),
    [usage.recent, usage.pinned],
  );

  const renderRow = (tool: WorkbenchTool) => {
    const pinned = usage.pinned.includes(tool.id);
    return (
      <li key={tool.id} className={styles.wbMenuRow}>
        <Link href={`/${locale}${tool.href}`} prefetch={false} className={styles.wbMenuRowLink}>
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
        <button
          type="button"
          className={styles.wbMenuStar}
          aria-label={pinned ? t('unpin') : t('pin')}
          aria-pressed={pinned}
          onClick={() => onTogglePin(tool.id)}
        >
          {pinned ? <StarFilled /> : <StarOutlined />}
        </button>
      </li>
    );
  };

  const quickGroup = (key: 'pinnedTitle' | 'recentTitle', tools: WorkbenchTool[]) =>
    tools.length === 0 ? null : (
      <section className={`${styles.wbMenuGroup} ${styles.wbMenuQuickGroup}`}>
        <div className={styles.wbMenuGroupHead}>
          <div>
            <h2 className={styles.wbMenuGroupTitle}>{t(key)}</h2>
          </div>
          <span className={styles.wbMenuGroupCount}>
            {tools.length} {t('sectionToolCount')}
          </span>
        </div>
        <ul className={styles.wbMenuList}>{tools.map(renderRow)}</ul>
      </section>
    );

  return (
    <div className={styles.wbMenu}>
      {mounted ? quickGroup('pinnedTitle', pinnedTools) : null}
      {mounted ? quickGroup('recentTitle', recentTools) : null}
      {workbenchSections.map((section) => {
        const tools = getWorkbenchToolsBySection(section.id).filter((tool) => !tool.external);
        if (tools.length === 0) return null;
        const sectionStyle = { '--group-accent': section.accent } as CSSProperties;
        return (
          <section
            key={section.id}
            id={`workbench-section-${section.id}`}
            className={`${styles.wbMenuGroup} ${styles.wbMenuSectionGroup}`}
            style={sectionStyle}
          >
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
              <span className={styles.wbMenuGroupCount}>
                {tools.length} {t('sectionToolCount')}
              </span>
            </div>
            <ul className={styles.wbMenuList}>{tools.map(renderRow)}</ul>
          </section>
        );
      })}
    </div>
  );
}
