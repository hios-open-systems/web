'use client';

import { useMemo, useState } from 'react';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { groupByKind, searchBreakouts } from '@/config/pinouts/modules';
import styles from './breakout.module.css';

interface BreakoutListProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function BreakoutList({ selectedId, onSelect }: BreakoutListProps) {
  const t = useTranslations('Pinouts');
  const [query, setQuery] = useState('');
  const groups = useMemo(() => groupByKind(searchBreakouts(query)), [query]);

  return (
    <nav className={styles.list}>
      <Input
        className={styles.listSearch}
        prefix={<SearchOutlined />}
        placeholder={t('search_placeholder')}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        allowClear
      />
      {groups.length === 0 ? <div className={styles.listEmpty}>{t('empty_filtered')}</div> : null}
      {groups.map((group) => (
        <div key={group.kind} className={styles.listGroup}>
          <div className={styles.listGroupTitle}>
            <span className={styles.listGroupLabel}>{t(`Kinds.${group.kind}`)}</span>
            <span className={styles.listGroupCount}>{group.items.length}</span>
          </div>
          <div className={styles.listGroupItems}>
            {group.items.map((breakout) => (
              <button
                key={breakout.id}
                type="button"
                onClick={() => onSelect(breakout.id)}
                className={`${styles.listItem} ${breakout.id === selectedId ? styles.listItemActive : ''}`}
              >
                <span className={styles.listItemName}>{breakout.name}</span>
                {breakout.usedBy && breakout.usedBy.length > 0 ? (
                  <span className={styles.listItemUsed}>{breakout.usedBy.length}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
