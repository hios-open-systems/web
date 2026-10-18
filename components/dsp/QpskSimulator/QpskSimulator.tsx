'use client';

import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Dibit, QpskSimConfig, ScreenViewMode } from './types';
import { getNextDibit, INITIAL_DIBITS } from './qpskMath';
import { useQpskAnimation } from './useQpskAnimation';
import { QpskHeader } from './QpskHeader';
import { QpskScreens } from './QpskScreens';
import { QpskControls } from './QpskControls';
import { QpskLegend } from './QpskLegend';
import styles from './qpskSimulator.module.css';

export interface QpskSimulatorProps {
  initialDibits?: Dibit[];
  className?: string;
}

export function QpskSimulator({ initialDibits = INITIAL_DIBITS, className }: QpskSimulatorProps) {
  const t = useTranslations('Qpsk');
  const [config, setConfig] = useState<QpskSimConfig>(() => ({
    dibits: initialDibits.length ? [...initialDibits] : [...INITIAL_DIBITS],
    cyclesPerSymbol: 2, noiseLevel: 0.05, scrollSpeed: 0.8,
    running: true, showReference: true, showTrajectories: true,
  }));
  const [viewMode, setViewMode] = useState<ScreenViewMode>('both');
  const timeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const constCanvasRef = useRef<HTMLCanvasElement | null>(null);
  useQpskAnimation({ timeCanvasRef, constCanvasRef, config });
  const onChange = (patch: Partial<QpskSimConfig>) => setConfig((prev) => ({ ...prev, ...patch }));
  const onSymbolTap = (index: number) => setConfig((prev) => ({
    ...prev, dibits: prev.dibits.map((dibit, i) => i === index ? getNextDibit(dibit) : dibit),
  }));
  return (
    <section className={[styles.instrumentChassis, className].filter(Boolean).join(' ')}
      aria-label={t('ariaLabel')}>
      <QpskHeader running={config.running && config.scrollSpeed > 0} />
      <QpskScreens timeCanvasRef={timeCanvasRef} constCanvasRef={constCanvasRef}
        numSymbols={config.dibits.length} viewMode={viewMode}
        onViewModeChange={setViewMode} onSymbolTap={onSymbolTap} />
      <QpskControls config={config} onChange={onChange} />
      <QpskLegend />
    </section>
  );
}
