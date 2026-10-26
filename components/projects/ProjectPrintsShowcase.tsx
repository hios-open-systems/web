'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { DownloadOutlined, ExportOutlined } from '@ant-design/icons';
import { StlViewerLazy } from '@/components/prints/StlViewerLazy';
import type { PrintModel } from '@/config/prints';
import styles from './projectPrints.module.css';

interface External3dLink {
  name: string;
  url: string;
}

/**
 * One viewer, one list. The list IS the selector: picking a part loads it in the
 * viewer; the only other action per part is the download.
 */
export function ProjectPrintsShowcase({ prints, externalLinks = [] }: { prints: PrintModel[]; externalLinks?: External3dLink[] }) {
  const t = useTranslations('ProjectDetail');
  const keyOf = (item: PrintModel) => item.file ?? item.name;
  const [selected, setSelected] = useState(prints[0] ? keyOf(prints[0]) : '');
  const active = prints.find((item) => keyOf(item) === selected) ?? prints[0];
  if (!active) return null;
  const fileName = (item: PrintModel) => item.file?.split('/').pop() ?? item.name;

  return (
    <div className={styles.layout} data-prints>
      {active.file ? (
        <div className={styles.viewer}>
          <StlViewerLazy key={active.file} url={active.file} name={active.name} />
        </div>
      ) : null}
      <ol className={styles.list} aria-label={t('printable_parts')}>
        {prints.map((item, i) => {
          const current = keyOf(item) === keyOf(active);
          return (
            <li key={keyOf(item)} className={styles.item} aria-current={current || undefined}>
              <button type="button" className={styles.pick} onClick={() => setSelected(keyOf(item))} disabled={!item.file}
                aria-pressed={current}>
                <span className={styles.num}>{i + 1}</span>
                <span className={styles.body}>
                  <strong>{item.name}</strong>
                  <span className={styles.meta}>{fileName(item)}{item.fileKB ? ` · ${item.fileKB} KB` : ''}</span>
                  <span className={styles.desc}>{item.description}</span>
                </span>
              </button>
              {item.file ? (
                <a className={styles.download} href={item.file} download aria-label={`${t('download')} ${fileName(item)}`}>
                  <DownloadOutlined /> <span>.stl</span>
                </a>
              ) : null}
            </li>
          );
        })}
      </ol>
      {externalLinks.length > 0 ? (
        <p className={styles.external}>
          <span>{t('external_models')}</span>
          {externalLinks.map((ext) => (
            <a key={ext.url} href={ext.url} target="_blank" rel="noopener noreferrer">{ext.name} <ExportOutlined /></a>
          ))}
        </p>
      ) : null}
    </div>
  );
}
