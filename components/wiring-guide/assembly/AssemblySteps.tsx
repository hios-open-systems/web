'use client';

import { Checkbox } from 'antd';
import { useTranslations } from 'next-intl';
import { ASSEMBLY_PHASES } from '@/lib/padWiring/assembly';
import styles from './assembly.module.css';
import { SolderJointGuide } from './SolderJointGuide';

export function AssemblySteps({ moduleId, done, toggle, ready }: {
  moduleId: string; done: string[]; toggle: (id: string) => void; ready: boolean;
}) {
  const t = useTranslations('Assembly');
  return <section aria-label={t('assembly')}>
    <p className={styles.notice}>{t('unpowered')}</p>
    <ol className={styles.steps}>
      {ASSEMBLY_PHASES.map(phase => <li key={phase} data-assembly-step={`${moduleId}:${phase}`}>
        <h4>{t(`${phase}Title`)}</h4>
        <p>{t(`${phase}Body`)}</p>
        <Checkbox checked={done.includes(`${moduleId}:${phase}`)} disabled={!ready} onChange={() => toggle(`${moduleId}:${phase}`)}>
          {t('confirm', { step: t(`${phase}Title`) })}
        </Checkbox>
      </li>)}
    </ol>
    <p className={styles.muted}>{t('progressHint')}</p>
    <SolderJointGuide />
  </section>;
}
