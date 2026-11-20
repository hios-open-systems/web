'use client';

import { Button, Tag } from 'antd';
import { useTranslations } from 'next-intl';
import { glossarySources, type GlossaryEntry as Entry } from '@/lib/radio/glossary';
import styles from './radioGlossary.module.css';

export function GlossaryEntry({ entry, entries, consult }: {
  entry: Entry; entries: Entry[]; consult: (term: string) => void;
}) {
  const t = useTranslations('RadioGlossary');
  const source = glossarySources[entry.source];
  const related = entries.filter((candidate) => entry.related?.includes(candidate.id));
  return (
    <li className={styles.entry} data-glossary-entry={entry.id}>
      <div className={styles.entryHeading}>
        <h3><span className={styles.term}>{entry.term}</span><span>{entry.name}</span></h3>
        <Tag>{t(`categories.${entry.category}`)}</Tag>
      </div>
      <p>{entry.meaning}</p>
      <p className={styles.example}><strong>{t('example')}: </strong>{entry.example}</p>
      <div className={styles.entryFooter}>
        <a href={source.href} target="_blank" rel="noreferrer">{t('source')}: {source.label}</a>
        {related.length ? (
          <div className={styles.related} aria-label={t('related')}>
            {related.map((item) => <Button key={item.id} size="small" onClick={() => consult(item.term)}>{item.term}</Button>)}
          </div>
        ) : null}
      </div>
    </li>
  );
}
