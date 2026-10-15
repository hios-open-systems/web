import Image from 'next/image';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import type { SoftwareProjectSlug } from '@/config/project-software';
import styles from './project-software.module.css';

const repository = 'https://github.com/hios-open-systems/web';
const sourceFiles = {
  pad: 'src/main.cpp',
  btdac: 'src/HIOS_BTDAC.ino',
} as const;

export async function ProjectGettingStarted({ locale, slug }: { locale: string; slug: SoftwareProjectSlug }) {
  const t = await getTranslations({ locale, namespace: `ProjectGettingStarted.${slug}` });
  const labels = await getTranslations({ locale, namespace: 'ProjectGettingStarted' });
  const source = `${repository}/tree/main/projects/${slug}`;
  const files = `${repository}/blob/main/projects/${slug}`;
  const commands = [
    `git clone ${repository}.git`, `cd web/projects/${slug}`,
    'pio run', 'pio run -t upload --upload-port COM5',
    'pio device monitor --port COM5 -b 115200',
  ].join('\n');
  return (
    <div className={styles.gettingStarted}>
      <section className={styles.showcase} id="usage" aria-labelledby="usage-title">
        <h2 id="usage-title">{labels('usage')}</h2>
        <p className={styles.intro}>{t('intro')}</p>
        <ol className={styles.steps}>
          {[1, 2, 3].map((step) => <li key={step}>{t(`steps.${step}`)}</li>)}
        </ol>
        {slug === 'pad' && <PadVisualReferences locale={locale} />}
        <div className={styles.links}>
          <Link href={`/${locale}/projects/${slug}/software`}>{labels('software')} →</Link>
          <a href={`${source}/${slug === 'pad' ? 'companion' : 'android'}`}>{t('appLink')} ↗</a>
        </div>
      </section>
      <section className={styles.showcase} id="flash" aria-labelledby="flash-title">
        <h2 id="flash-title">{labels('flash')}</h2>
        <p className={styles.intro}>{t('board')}</p>
        <ol className={styles.steps}>
          <li>{labels('requirements')} <a href="https://docs.platformio.org/en/latest/core/installation/index.html">PlatformIO Core ↗</a></li>
          <li>{t('connect')} <Link href={`/${locale}/pinouts/${slug}`}>{labels('wiring')} →</Link></li>
          <li>{labels('commands')}</li>
        </ol>
        <pre className={styles.commands}><code>{commands}</code></pre>
        <p className={styles.intro}>{labels('ports')}</p>
        <p className={styles.intro}>{t('success')}</p>
        <div className={styles.links}>
          <a href={`${files}/${sourceFiles[slug]}`}>{labels('firmware')} ↗</a>
          <a href={`${files}/platformio.ini`}>{labels('buildConfig')} ↗</a>
          <a href={`${files}/README.md`}>{labels('fullGuide')} ↗</a>
        </div>
      </section>
    </div>
  );
}

async function PadVisualReferences({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'ProjectGettingStarted.pad' });
  return (
    <>
      <div className={styles.visualGrid}>
        {[
          { src: '/images/pad/pad-3-ui-edit.jpg', key: 'device', width: 1500, height: 844 },
          { src: '/images/pad/companion-mirror-demo.png', key: 'mirror', width: 1100, height: 720 },
          { src: '/images/pad/companion-editor-demo.png', key: 'editor', width: 1100, height: 800 },
        ].map(({ src, key, width, height }) => (
          <figure className={styles.preview} key={key}>
            <Image src={src} width={width} height={height} alt={t(`${key}Alt`)} sizes="(max-width: 700px) 100vw, 520px" />
            <figcaption>{t(`${key}Caption`)}</figcaption>
          </figure>
        ))}
      </div>
      <details className={styles.demo}>
        <summary>{t('demoTitle')}</summary>
        <p className={styles.intro}>{t('demoDescription')}</p>
        <iframe src="/demos/pad/index.html" title={t('demoTitle')} loading="lazy" sandbox="allow-scripts" />
      </details>
      <p className={styles.intro}>{t('companionSetup')}</p>
    </>
  );
}
