'use client';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { workbenchTools } from '@/config/workbench';
import { toolAliases } from '@/lib/workbench/toolProfiles';
import { activityFor, rankEntries } from '@/lib/workbench/discovery';
import { EMPTY_USAGE, readUsage } from '@/lib/workbench/usage';
import { useWorkspaceFavorites } from './useWorkspaceFavorites';

export function useDiscoveryCatalog() {
  const t = useTranslations('Workspace');
  const packs = useTranslations('Workbench.packs');
  const [query, setQuery] = useState('');
  const [activity, setActivity] = useState('all');
  const [locality, setLocality] = useState('all');
  const [collection, setCollection] = useState('all');
  const [usage, setUsage] = useState(EMPTY_USAGE);
  const favorites = useWorkspaceFavorites();
  useEffect(() => { setUsage(readUsage()); }, []);
  const entries = useMemo(() => workbenchTools.filter(tool => !tool.external).map(tool => ({
    ...tool, label: packs(`${tool.id}.title`), hint: packs(`${tool.id}.description`),
    keywords: `${t(`activities.${activityFor(tool)}`)} ${toolAliases[tool.id] ?? ''}`,
  })), [packs, t]);
  const results = rankEntries(entries.filter(tool =>
    (activity === 'all' || activityFor(tool) === activity) && (locality === 'all' || tool.locality === locality)
    && (collection !== 'favorites' || favorites.pinned.includes(tool.id))
    && (collection !== 'recent' || usage.recent.includes(tool.id)),
  ), query, favorites.pinned, usage.recent);
  // Recent view follows actual use order; relevance still wins while searching.
  if (collection === 'recent' && !query.trim()) results.sort((a,b) => usage.recent.indexOf(a.id) - usage.recent.indexOf(b.id));
  const reset = () => { setQuery(''); setActivity('all'); setLocality('all'); setCollection('all'); };
  return { query, setQuery, activity, setActivity, locality, setLocality, collection, setCollection, results, favorites, reset };
}
export type DiscoveryState = ReturnType<typeof useDiscoveryCatalog>;
