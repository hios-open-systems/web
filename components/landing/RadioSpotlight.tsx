'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowUpOutlined } from '@ant-design/icons';
import styles from './landing.module.css';

export function RadioSpotlight({ locale }: { locale: string }) {
  const t = useTranslations('Radio');
  return (
    <Link href={`/${locale}/radio`} className={styles.studioCard} data-studio="radio">
      <div className={styles.studioMeta}>
        <span>HAM—LU / ENACOM NOVICIO</span>
        <ArrowUpOutlined rotate={45} />
      </div>
      <h3>{t('title')}</h3>
      <p>{t('description')}</p>
      <div className={styles.studioTags}>
        <span>SIMULATORS</span>
        <span>EXAM BANK</span>
        <span>MORSE / CW</span>
        <strong className={styles.studioCta}>{t('cta')} →</strong>
      </div>
    </Link>
  );
}
