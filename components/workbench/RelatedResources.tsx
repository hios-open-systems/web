'use client';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { workbenchTools } from '@/config/workbench';
import { SaveToSpace } from './SaveToSpace';
import styles from './workspace.module.css';

export function RelatedResources({ resourceId, toolIds, pinout }: { resourceId: string; toolIds: string[]; pinout?: string }) {
  const locale = useLocale();
  const t = useTranslations('Workspace');
  const packs = useTranslations('Workbench.packs');
  return <aside className={styles.card} style={{ maxWidth: 1132, margin: '24px auto' }}>
    <div className={styles.row}><h2>{t('continue')}</h2><SaveToSpace resourceId={resourceId} /></div>
    <div className={styles.toolbar}>{toolIds.map(id => {
      const tool = workbenchTools.find(tool => tool.id === id);
      return tool ? <Link key={id} href={`/${locale}${tool.href}`}>{packs(`${tool.id}.title`)} →</Link> : null;
    })}{pinout ? <Link href={`/${locale}/pinouts/${pinout}`}>Pinout →</Link> : null}</div>
  </aside>;
}
