'use client';

import { useTranslations } from 'next-intl';
import styles from './assembly.module.css';

export function SolderJointGuide() {
  const t = useTranslations('Assembly');
  return <section className={styles.joints}>
    <h3>{t('jointTitle')}</h3>
    <div className={styles.jointGrid}>{[false, true].map(bridge => <figure key={String(bridge)}>
      <svg viewBox="0 0 240 130" role="img" aria-label={t(bridge ? 'jointBad' : 'jointGood')}>
        <rect x="15" y="95" width="210" height="20" rx="4" fill="#1d5947" />
        {[80, 160].map(x => <g key={x}>
          <rect x={x - 26} y="91" width="52" height="7" fill="#d6b86c" />
          <rect x={x - 5} y="25" width="10" height="72" fill="#a8b7c5" stroke="#64748b" />
          <path d={`M${x - 25} 92Q${x - 5} 89 ${x - 5} 61H${x + 5}Q${x + 5} 89 ${x + 25} 92Z`} fill="#cbd5e1" stroke="#71869a" />
        </g>)}
        {bridge ? <path d="M91 87Q120 68 149 87L149 94H91Z" fill="#cbd5e1" stroke="#fb7185" strokeWidth="3" /> : null}
      </svg>
      <figcaption>{t(bridge ? 'jointBad' : 'jointGood')}</figcaption>
    </figure>)}</div>
    <p className={styles.muted}>{t('jointHint')}</p>
    <a href="https://learn.adafruit.com/adafruit-guide-excellent-soldering/common-problems" target="_blank" rel="noopener noreferrer">{t('sources')} · Adafruit</a>
  </section>;
}
