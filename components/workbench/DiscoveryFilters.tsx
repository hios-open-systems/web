'use client';
import { Button, Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { activities } from '@/lib/workbench/discovery';
import type { DiscoveryState } from '@/lib/hooks/useDiscoveryCatalog';
import styles from './workspace.module.css';

export function DiscoveryFilters({ state: s }: { state: DiscoveryState }) {
  const t = useTranslations('Workspace');
  return <div className={styles.toolbar}>
    <Input value={s.query} onChange={event => s.setQuery(event.target.value)} allowClear
      prefix={<SearchOutlined />} placeholder={t('search')} aria-label={t('search')} />
    <label className={styles.filterLabel}>{t('activity')}<Select aria-label={t('activity')}
      value={s.activity} onChange={s.setActivity} options={[{ value: 'all', label: t('all') },
        ...activities.map(value => ({ value, label: t(`activities.${value}`) }))]} /></label>
    <label className={styles.filterLabel}>{t('locality')}<Select aria-label={t('locality')}
      value={s.locality} onChange={s.setLocality}
      options={['all', 'local', 'network'].map(value => ({ value, label: t(value) }))} /></label>
    <Button onClick={s.reset}>{t('discovery.reset')}</Button>
  </div>;
}
