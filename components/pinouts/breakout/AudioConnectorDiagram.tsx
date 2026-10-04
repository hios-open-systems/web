import type { Breakout } from '@/config/pinouts/modules';
import { useTranslations } from 'next-intl';
import { SignalGrid } from './SignalGrid';
import { AnnotatedModuleDiagram } from './AnnotatedModuleDiagram';
import styles from './breakout.module.css';

/** Audio contact names do not imply a universal solder-tab order. */
export function AudioConnectorDiagram({ breakout }: { breakout: Breakout }) {
  const jack = breakout.id === 'jack-trs';
  const t = useTranslations('Pinouts');
  const labels: Record<string, string> = jack
    ? { Tip: 'L', Ring: 'R', Sleeve: 'GND', SW: 'SW' }
    : { Tip: 'L', 'Ring 1': 'R', 'Ring 2': 'GND', Sleeve: 'MIC' };
  return (
    <div className={styles.chipScroll}>
      <p className={styles.diagramCaption}>{t('functionalDiagram')}</p>
      <AnnotatedModuleDiagram breakout={breakout} artworkHeight={230}>
        {jack ? <g>
          <circle cx="140" cy="115" r="69" fill="#94a3b8" stroke="#475569" strokeWidth="3" />
          <circle cx="140" cy="115" r="51" fill="#334155" stroke="#cbd5e1" strokeWidth="5" />
          <circle cx="140" cy="115" r="29" fill="#0f172a" stroke="#64748b" strokeWidth="3" />
        </g> : <g>
          <rect x="113" y="90" width="54" height="125" rx="15" fill="#334155" stroke="#64748b" />
          <rect x="124" y="24" width="32" height="78" rx="8" fill="#cbd5e1" stroke="#64748b" />
          {[45, 63, 81].map((y) => <rect key={y} x="124" y={y} width="32" height="5" fill="#0f172a" />)}
        </g>}
      </AnnotatedModuleDiagram>
      <SignalGrid pins={breakout.pins} labels={labels} />
    </div>
  );
}
