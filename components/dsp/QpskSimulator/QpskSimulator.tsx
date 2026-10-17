'use client';

import React, { useRef, useState } from 'react';
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

export function QpskSimulator({
  initialDibits = INITIAL_DIBITS,
  className,
}: QpskSimulatorProps) {
  const [dibits, setDibits] = useState<Dibit[]>(initialDibits);
  const [cyclesPerSymbol, setCyclesPerSymbol] = useState<number>(2.0);
  const [noiseLevel, setNoiseLevel] = useState<number>(0.05);
  const [scrollSpeed, setScrollSpeed] = useState<number>(0.8);
  const [running, setRunning] = useState<boolean>(true);
  const [showReference, setShowReference] = useState<boolean>(true);
  const [showTrajectories, setShowTrajectories] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ScreenViewMode>('both');

  const timeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const constCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const config: QpskSimConfig = {
    dibits,
    cyclesPerSymbol,
    noiseLevel,
    scrollSpeed,
    running,
    showReference,
    showTrajectories,
  };

  useQpskAnimation({
    timeCanvasRef,
    constCanvasRef,
    config,
  });

  const handleSymbolTap = (index: number) => {
    setDibits((prev) => {
      const next = [...prev];
      next[index] = getNextDibit(next[index]);
      return next;
    });
  };

  return (
    <section
      className={`${styles.instrumentChassis} ${className ?? ''}`}
      aria-label="Simulador de Osciloscopio Digital y Analizador de Constelación QPSK"
    >
      <QpskHeader running={running} />
      <QpskScreens
        timeCanvasRef={timeCanvasRef}
        constCanvasRef={constCanvasRef}
        noiseLevel={noiseLevel}
        numSymbols={dibits.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSymbolTap={handleSymbolTap}
      />
      <QpskControls
        dibits={dibits}
        onDibitsChange={setDibits}
        cyclesPerSymbol={cyclesPerSymbol}
        onCyclesChange={setCyclesPerSymbol}
        noiseLevel={noiseLevel}
        onNoiseChange={setNoiseLevel}
        scrollSpeed={scrollSpeed}
        onSpeedChange={setScrollSpeed}
        showReference={showReference}
        onShowReferenceChange={setShowReference}
        showTrajectories={showTrajectories}
        onShowTrajectoriesChange={setShowTrajectories}
        running={running}
        onToggleRunning={() => setRunning((prev) => !prev)}
      />
      <QpskLegend />
    </section>
  );
}
