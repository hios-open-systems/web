'use client';
import { useTranslations } from 'next-intl';
import { useDiscoveryCatalog } from '@/lib/hooks/useDiscoveryCatalog';
import { DiscoveryShortcuts } from './DiscoveryShortcuts';
import { DiscoveryFilters } from './DiscoveryFilters';
import { DiscoveryCard } from './DiscoveryCard';
import styles from './workspace.module.css';

export function DiscoveryCatalog() {
  const t = useTranslations('Workspace');
  const state = useDiscoveryCatalog();
  return <section aria-label={t('catalog')} className={styles.stack}>
    <DiscoveryShortcuts collection={state.collection} onCollection={state.setCollection} />
    <DiscoveryFilters state={state} />
    <p aria-live="polite">{t('results', { count: state.results.length })}</p>
    <div className={`${styles.grid} studio-results`}>
      {state.results.map(tool => <DiscoveryCard key={tool.id} tool={tool} state={state} />)}
    </div>
    {!state.results.length && <p>{t('noResults')}</p>}
  </section>;
}
