'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Input, Select, Tag, Button } from 'antd';
import { SearchOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { workbenchTools } from '@/config/workbench';
import { toolAliases } from '@/lib/workbench/toolProfiles';
import { activities, activityFor, rankEntries } from '@/lib/workbench/discovery';
import { EMPTY_USAGE, readUsage } from '@/lib/workbench/usage';
import { useWorkspaceFavorites } from '@/lib/hooks/useWorkspaceFavorites';
import styles from './workspace.module.css';
import { trackWorkbench } from '@/lib/workbench/events';

export function DiscoveryCatalog() {
  const t = useTranslations('Workspace');
  const packs = useTranslations('Workbench.packs');
  const locale = useLocale();
  const [query, setQuery] = useState('');
  const [activity, setActivity] = useState('all');
  const [locality, setLocality] = useState('all');
  const [usage, setUsage] = useState(EMPTY_USAGE);
  const favorites = useWorkspaceFavorites();
  useEffect(() => { setUsage(readUsage()); }, []);
  const entries = useMemo(() => workbenchTools.map(tool => ({
    ...tool, label: packs(`${tool.id}.title`), hint: packs(`${tool.id}.description`),
    keywords: `${t(`activities.${activityFor(tool)}`)} ${toolAliases[tool.id] ?? ''}`,
  })), [packs, t]);
  const results = rankEntries(entries.filter(tool => (activity === 'all' || activityFor(tool) === activity)
    && (locality === 'all' || tool.locality === locality)), query, favorites.pinned, usage.recent);
  return <section aria-label={t('catalog')} className={styles.stack}>
    <div className={styles.toolbar}>
      <Input value={query} onChange={e => setQuery(e.target.value)} allowClear prefix={<SearchOutlined />} placeholder={t('search')} aria-label={t('search')} />
      <Select aria-label={t('activity')} value={activity} onChange={setActivity} options={[{ value: 'all', label: t('all') }, ...activities.map(value => ({ value, label: t(`activities.${value}`) }))]} />
      <Select aria-label={t('locality')} value={locality} onChange={setLocality} options={['all', 'local', 'network'].map(value => ({ value, label: t(value) }))} />
    </div>
    <p aria-live="polite">{t('results', { count: results.length })}</p>
    <div className={styles.grid}>{results.map(tool => <article key={tool.id} className={styles.card}>
      <div className={styles.row}><Tag color={tool.accent}>{t(`activities.${activityFor(tool)}`)}</Tag>
        <Button disabled={favorites.disabled} type="text" aria-label={t('favorite')} aria-pressed={favorites.pinned.includes(tool.id)} icon={favorites.pinned.includes(tool.id) ? <StarFilled /> : <StarOutlined />} onClick={() => favorites.toggle(tool.id)} />
      </div>
      <Link href={`/${locale}${tool.href}`} onClick={() => { if (query.trim()) trackWorkbench('search_open', tool.id); }}><h3>{tool.label}</h3></Link>
      <p>{tool.hint}</p><small>{t(tool.locality)}</small>
    </article>)}</div>
    {!results.length ? <p>{t('noResults')}</p> : null}
  </section>;
}
