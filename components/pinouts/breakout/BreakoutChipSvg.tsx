import { useTranslations } from 'next-intl';
import type { Breakout } from '@/config/pinouts/modules';
import { ModuleArtwork } from './ModuleArtwork';
import { SignalGrid } from './SignalGrid';
import { AnnotatedModuleDiagram } from './AnnotatedModuleDiagram';
import styles from './breakout.module.css';

export function BreakoutChipSvg({ breakout }: { breakout: Breakout }) {
  const t = useTranslations('Pinouts');
  return (
    <div className={styles.chipScroll}>
      <p className={styles.diagramCaption}>{t('functionalDiagram')}</p>
      <AnnotatedModuleDiagram breakout={breakout}>
        <ModuleArtwork id={breakout.id} />
      </AnnotatedModuleDiagram>
      <SignalGrid pins={breakout.pins} />
    </div>
  );
}
