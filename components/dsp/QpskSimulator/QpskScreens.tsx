import React from 'react';
import { Button } from 'antd';
import { useTranslations } from 'next-intl';
import type { ScreenViewMode } from './types';
import { CHANNELS } from './qpskMath';
import { InstrumentScreen } from '@/components/instruments/InstrumentScreen';
import styles from './qpskSimulator.module.css';

interface QpskScreensProps {
  timeCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  constCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  numSymbols: number;
  viewMode: ScreenViewMode;
  onViewModeChange: (mode: ScreenViewMode) => void;
  onSymbolTap: (index: number) => void;
}

function ViewSelector({ viewMode, onViewModeChange }: Pick<QpskScreensProps, 'viewMode' | 'onViewModeChange'>) {
  const t = useTranslations('Qpsk');
  return (
    <div className={styles.mobileViewBar} role="group" aria-label={t('viewMode')}>
      {(['both', 'time', 'constellation'] as const).map((mode) => (
        <Button key={mode} aria-pressed={viewMode === mode}
          className={[styles.viewTabBtn, viewMode === mode && styles.viewTabBtnActive].filter(Boolean).join(' ')}
          onClick={() => onViewModeChange(mode)}>{t('views.' + mode)}</Button>
      ))}
    </div>
  );
}

function TimeScreen({ timeCanvasRef, numSymbols, onSymbolTap, viewMode }: QpskScreensProps) {
  const t = useTranslations('Qpsk');
  const onClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    onSymbolTap(Math.min(numSymbols - 1, Math.max(0, Math.floor((e.clientX - rect.left) / rect.width * numSymbols))));
  };
  return (
    <InstrumentScreen label={t('views.time')} channels={CHANNELS} status={t('transmitted')}
      className={[styles.crtContainer, viewMode === 'constellation' && styles.hiddenOnMobileTab].filter(Boolean).join(' ')}>
      <canvas ref={timeCanvasRef} className={styles.scopeCanvas} onClick={onClick}
        role="img" aria-label={t('timeCanvas')} title={t('tapHint')} />
    </InstrumentScreen>
  );
}

function ConstellationScreen({ constCanvasRef, viewMode }: QpskScreensProps) {
  const t = useTranslations('Qpsk');
  return (
    <InstrumentScreen label={t('constellationTitle')} status={t('received')}
      className={[styles.crtContainer, viewMode === 'time' && styles.hiddenOnMobileTab].filter(Boolean).join(' ')}>
      <canvas ref={constCanvasRef} className={styles.constellationCanvas}
        role="img" aria-label={t('constellationCanvas')} />
    </InstrumentScreen>
  );
}

export function QpskScreens(props: QpskScreensProps) {
  return (
    <>
      <ViewSelector viewMode={props.viewMode} onViewModeChange={props.onViewModeChange} />
      <div className={styles.screensGrid}><TimeScreen {...props} /><ConstellationScreen {...props} /></div>
    </>
  );
}
