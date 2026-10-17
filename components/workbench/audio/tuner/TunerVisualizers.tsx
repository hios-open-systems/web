'use client';
import { useState } from 'react';
import { Card, Segmented } from 'antd';
import { useTranslations } from 'next-intl';
import { TunerGaugeView } from './TunerGaugeView';
import { TunerScopeView } from './TunerScopeView';
import { TunerSpectrumView } from './TunerSpectrumView';
import { TunerChromaticView } from './TunerChromaticView';
import workbenchStyles from '../../workbench.module.css';
import styles from '../audioTools.module.css';

export type TunerVisualizerMode = 'gauge' | 'scope' | 'spectrum' | 'chromatic';

interface Props {
  near: { label: string; cents: number; index: number } | null;
  detected: { frequency: number; clarity: number } | null;
  chroma: { note: string; octave: number; cents: number } | null;
  active: boolean;
  inTune: boolean;
  status: string;
  refA4: number;
  analyser: AnalyserNode | null;
}

export function TunerVisualizers(p: Props) {
  const t = useTranslations('Workbench.guitarTuner');
  const [mode, setMode] = useState<TunerVisualizerMode>('gauge');

  return (
    <Card className={`${workbenchStyles.sectionCard} ${styles.readoutCard}`} styles={{ body: { padding: 16 } }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <Segmented
          value={mode}
          onChange={(v) => setMode(v as TunerVisualizerMode)}
          options={[
            { value: 'gauge', label: t('modeGauge') },
            { value: 'scope', label: t('modeScope') },
            { value: 'spectrum', label: t('modeSpectrum') },
            { value: 'chromatic', label: t('modeChromatic') },
          ]}
        />
      </div>

      <div style={{ minHeight: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {mode === 'gauge' && (
          <TunerGaugeView
            near={p.near}
            detected={p.detected}
            active={p.active}
            inTune={p.inTune}
            status={p.status}
            listeningText={t('listening')}
            micPromptText={t('micPrompt')}
          />
        )}
        {mode === 'scope' && (
          <TunerScopeView
            analyser={p.analyser}
            active={p.active}
            inTune={p.inTune}
            detected={p.detected}
          />
        )}
        {mode === 'spectrum' && (
          <TunerSpectrumView
            analyser={p.analyser}
            active={p.active}
            inTune={p.inTune}
            detected={p.detected}
          />
        )}
        {mode === 'chromatic' && (
          <TunerChromaticView
            detected={p.detected}
            chroma={p.chroma}
            active={p.active}
            inTune={p.inTune}
          />
        )}
      </div>

      <div className={styles.statGrid} style={{ marginTop: 14 }}>
        <span className={styles.stat}>
          <span className={styles.statLabel}>{t('chromaticLabel')}</span>
          <span className={styles.statValue}>{p.chroma ? `${p.chroma.note}${p.chroma.octave}` : '-'}</span>
        </span>
        <span className={styles.stat}>
          <span className={styles.statLabel}>{t('centsLabel')}</span>
          <span className={styles.statValue}>
            {p.near != null ? `${p.near.cents > 0 ? '+' : ''}${p.near.cents}` : '-'}
          </span>
        </span>
        <span className={styles.stat}>
          <span className={styles.statLabel}>{t('referenceLabel')}</span>
          <span className={styles.statValue}>A4 {p.refA4}</span>
        </span>
      </div>
    </Card>
  );
}
