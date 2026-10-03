import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getLocalizedPaths } from '@/lib/seo';
import { createBreadcrumbData, type BreadcrumbItem } from '@/lib/structured-data';
import { JsonLd } from './JsonLd';
import styles from './page-trail.module.css';

export async function PageTrail({ locale, items, inContent = false }: {
  locale: string; items: readonly BreadcrumbItem[]; inContent?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: 'Seo' });
  return (
    <>
      <nav aria-label={t('breadcrumbLabel')} className={inContent ? styles.trail : `${styles.trail} ${styles.container}`}>
        <ol>
          {items.map((item, index) => (
            <li key={item.path}>
              {index > 0 ? <span aria-hidden="true" className={styles.separator}>/</span> : null}
              {index === items.length - 1
                ? <span aria-current="page">{item.name}</span>
                : <Link href={getLocalizedPaths(item.path)[locale]}>{item.name}</Link>}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={createBreadcrumbData(locale, items)} />
    </>
  );
}
