'use client';

import { useTranslations } from 'next-intl';
import styles from './radioBasics.module.css';

export function LessonSources() {
  const t = useTranslations('RadioBasics.sources');
  return (
    <footer className={styles.sources}>
      <h3>{t('title')}</h3>
      <p>{t('intro')}</p>
      <ul>
        <li><a href="https://openstax.org/books/university-physics-volume-2/pages/9-1-electrical-current" target="_blank" rel="noreferrer">{t('current')}</a></li>
        <li><a href="https://openstax.org/books/university-physics-volume-2/pages/9-4-ohms-law" target="_blank" rel="noreferrer">{t('ohm')}</a></li>
        <li><a href="https://openstax.org/books/university-physics-volume-2/pages/10-2-resistors-in-series-and-parallel" target="_blank" rel="noreferrer">{t('connections')}</a></li>
        <li><a href="/downloads/radio/guia-radioaficionado-novicio.pdf" target="_blank" rel="noreferrer">{t('originalGuide')}</a></li>
        <li><a href="https://www.enacom.gob.ar/normativa-principal_p2974" target="_blank" rel="noreferrer">{t('enacom')}</a></li>
      </ul>
      <p>{t('originalGuideNote')}</p>
      <p>{t('limits')}</p>
    </footer>
  );
}
