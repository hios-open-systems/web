import { useTranslations } from 'next-intl';
import styles from './radio.module.css';

/** Aviso para en/de/it: la guía apunta al examen argentino y está en español. */
export function SpanishOnlyNotice() {
  const t = useTranslations('Radio');
  return <p className={styles.notice} style={{ marginTop: 16 }}>{t('spanishOnly')}</p>;
}
