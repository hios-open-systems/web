import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import type { SoftwareProjectSlug } from '@/config/project-software';
import styles from './project-software.module.css';

interface SoftwarePreview { src: string; width: number; height: number }
const previews: Partial<Record<SoftwareProjectSlug, SoftwarePreview>> = {
  pad: { src: '/images/pad/pad-3-ui-edit.jpg', width: 1500, height: 844 },
};
const useCases = ['editing', 'meetings', 'media'] as const;

/** Only projects with documented interface photography expose this section. */
export async function SoftwareShowcase({ locale, slug }: { locale: string; slug: SoftwareProjectSlug }) {
  const preview = previews[slug];
  if (!preview) return null;
  const t = await getTranslations({ locale, namespace: `ProjectSoftware.${slug}.showcase` });
  return (
    <section className={styles.showcase} aria-labelledby="showcase-title">
      <h2 id="showcase-title">{t('title')}</h2>
      <p className={styles.intro}>{t('description')}</p>
      <figure className={styles.preview}>
        <Image src={preview.src} width={preview.width} height={preview.height}
          alt={t('imageAlt')} sizes="(max-width: 1100px) 100vw, 1052px" />
        <figcaption>{t('caption')}</figcaption>
      </figure>
      <div className={styles.useCases}>
        {useCases.map((useCase) => (
          <article className={styles.card} key={useCase}>
            <h3>{t(`${useCase}.title`)}</h3>
            <p>{t(`${useCase}.body`)}</p>
            <p className={styles.requirement}>{t(`${useCase}.requirement`)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
