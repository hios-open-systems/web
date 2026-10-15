'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useWorkspaces } from '@/components/workbench/WorkspaceProvider';
import { readUsage } from '@/lib/workbench/usage';
import { workbenchTools } from '@/config/workbench';
import { ArrowRightOutlined, FolderOpenOutlined, HistoryOutlined } from '@ant-design/icons';
import styles from './landing.module.css';

export function WorkbenchReturn() {
  const t = useTranslations('Workspace');
  const packs = useTranslations('Workbench.packs');
  const locale = useLocale();
  const { store } = useWorkspaces();
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => setRecent(readUsage().recent), []);
  const last = store.records.find((row) => row.id === store.activeId && !row.deleted);
  return (
    <section className={styles.returnStrip}>
      <span className={styles.returnIcon}>
        <FolderOpenOutlined />
      </span>
      <div className={styles.returnHeading}>
        <h2>{t('continue')}</h2>
        <p>{t('intro')}</p>
      </div>
      <Link className={styles.returnLink} href={`/${locale}/workbench/spaces`}>
        {last?.document.name ?? t('title')} <ArrowRightOutlined />
      </Link>
      {recent.length > 0 && (
        <div className={styles.recent}>
          <HistoryOutlined aria-hidden />
          {recent.slice(0, 3).map((id) => {
            const tool = workbenchTools.find((row) => row.id === id);
            return tool ? (
              <Link key={id} href={`/${locale}${tool.href}`}>
                {packs(`${id}.title`)}
              </Link>
            ) : null;
          })}
        </div>
      )}
    </section>
  );
}
