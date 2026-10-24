'use client';
import Link from 'next/link';
import { Button, Tag } from 'antd';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { activityFor } from '@/lib/workbench/discovery';
import { trackWorkbench } from '@/lib/workbench/events';
import type { DiscoveryState } from '@/lib/hooks/useDiscoveryCatalog';
import styles from './workspace.module.css';

export function DiscoveryCard({ tool, state }: { tool: DiscoveryState['results'][number]; state: DiscoveryState }) {
  const t = useTranslations('Workspace');
  const locale = useLocale();
  const pinned = state.favorites.pinned.includes(tool.id);
  return <article className={`${styles.card} studio-card`} data-area={activityFor(tool)}>
    <div className={styles.row}>
      <Tag color={tool.accent}>{t(`activities.${activityFor(tool)}`)}</Tag>
      <Button disabled={state.favorites.disabled} type="text" aria-label={t('favorite')} aria-pressed={pinned}
        icon={pinned ? <StarFilled /> : <StarOutlined />} onClick={() => state.favorites.toggle(tool.id)} />
    </div>
    <Link href={`/${locale}${tool.href}`} onClick={() => {
      if (state.query.trim()) trackWorkbench('search_select', tool.id);
    }}><h3>{tool.label}</h3></Link>
    <p>{tool.hint}</p><small>{t(tool.locality)}</small>
  </article>;
}
