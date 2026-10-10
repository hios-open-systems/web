'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Input, Tag } from 'antd';
import { ArrowRightOutlined, SearchOutlined, CodeOutlined, ToolOutlined, SoundOutlined, BulbOutlined, ReadOutlined, GithubOutlined } from '@ant-design/icons';
import { useLocale, useTranslations } from 'next-intl';
import { workbenchTools } from '@/config/workbench';
import { toolAliases } from '@/lib/workbench/toolProfiles';
import { activities, activityFor, rankEntries } from '@/lib/workbench/discovery';
import { resources } from '@/lib/workspaces/resources';
import { SaveToSpace } from './SaveToSpace';
import { WorkspaceAccess } from './WorkspaceAccess';
import { useWorkspaces } from './WorkspaceProvider';
import { useResourceCopy } from './useResourceCopy';
import styles from './workspace.module.css';

const icons = { development: <CodeOutlined aria-hidden />, maker: <ToolOutlined aria-hidden />, audio: <SoundOutlined aria-hidden />, ai: <BulbOutlined aria-hidden />, knowledge: <ReadOutlined aria-hidden />, software: <GithubOutlined aria-hidden /> };
const extras = ['project:pad', 'project:btdac', 'pinout:pad', 'page:blog', 'page:prints', 'page:software-pad', 'page:software-btdac'];

export function ExploreCatalog() {
  const t = useTranslations('Workspace');
  const packs = useTranslations('Workbench.packs');
  const locale = useLocale();
  const { error } = useWorkspaces();
  const { label } = useResourceCopy();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const entries = [
    ...workbenchTools.map(tool => ({ id: `tool:${tool.id}`, href: tool.href, label: packs(`${tool.id}.title`), hint: packs(`${tool.id}.description`), category: activityFor(tool), keywords: toolAliases[tool.id] ?? '' })),
    ...resources.filter(resource => extras.includes(resource.id)).map(resource => ({ ...resource, label: label(resource.id), hint: t(`resourceDescriptions.${resource.id.replaceAll(':', '-')}`), category: resource.id.includes('software') ? 'software' as const : resource.id.startsWith('page:') ? 'knowledge' as const : 'maker' as const })),
  ];
  const results = rankEntries(entries.filter(entry => category === 'all' || entry.category === category), query);
  return <div className={styles.stack}>
    <header className={styles.exploreHero}>
      <div><span className={styles.eyebrow}>HIOS / {t('explore')}</span><h1>{t('exploreTitle')}</h1><p>{t('exploreIntro')}</p></div>
      <WorkspaceAccess />
    </header>
    {error ? <Alert type="error" showIcon message={t('error')} /> : null}
    <section className={styles.stack} aria-label={t('catalog')}>
      <Input size="large" prefix={<SearchOutlined aria-hidden />} allowClear value={query} onChange={e => setQuery(e.target.value)} placeholder={t('exploreSearch')} aria-label={t('exploreSearch')} />
      <div className={styles.filters} role="group" aria-label={t('activity')}>
        {['all', ...activities].map(value => <Button key={value} type={category === value ? 'primary' : 'default'} aria-pressed={category === value} onClick={() => setCategory(value)}>{value === 'all' ? t('all') : t(`activities.${value}`)}</Button>)}
      </div>
      <div className={styles.row}><span className={styles.muted} aria-live="polite">{t('results', { count: results.length })}</span><Link href={`/${locale}/tools`} className={styles.textLink}>{t('external')} <ArrowRightOutlined aria-hidden /></Link></div>
      <div className={styles.resourceGrid}>{results.map(entry => <article key={entry.id} className={styles.resourceCard}>
        <div className={styles.row}><span className={styles.resourceIcon}>{icons[entry.category]}</span><Tag>{t(`activities.${entry.category}`)}</Tag></div>
        <Link href={`/${locale}${entry.href}`} className={styles.resourceTitle}><h2>{entry.label}</h2></Link>
        <p>{entry.hint}</p>
        <div className={styles.cardActions}><Link href={`/${locale}${entry.href}`} className={styles.textLink} aria-label={`${t('open')}: ${entry.label}`}>{t('open')} <ArrowRightOutlined aria-hidden /></Link><SaveToSpace resourceId={entry.id} /></div>
      </article>)}</div>
      {!results.length ? <div className={styles.emptyState}><SearchOutlined aria-hidden /><h2>{t('noResults')}</h2><Button onClick={() => { setQuery(''); setCategory('all'); }}>{t('resetFilters')}</Button></div> : null}
    </section>
  </div>;
}
