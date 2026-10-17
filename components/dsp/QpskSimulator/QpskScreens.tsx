import React from 'react';
import type { ScreenViewMode } from './types';
import styles from './qpskSimulator.module.css';

interface QpskScreensProps {
  timeCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  constCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  noiseLevel: number;
  numSymbols: number;
  viewMode: ScreenViewMode;
  onViewModeChange: (mode: ScreenViewMode) => void;
  onSymbolTap: (index: number) => void;
}

function getOsnrStatus(noiseLevel: number): { text: string; color: string } {
  if (noiseLevel < 0.12) return { text: 'OSNR: Excelente', color: '#00ff66' };
  if (noiseLevel < 0.3) return { text: 'OSNR: Degradada', color: '#ffab00' };
  return { text: 'OSNR: Crítica (Pre-FEC)', color: '#ff4444' };
}

export function QpskScreens({
  timeCanvasRef,
  constCanvasRef,
  noiseLevel,
  numSymbols,
  viewMode,
  onViewModeChange,
  onSymbolTap,
}: QpskScreensProps) {
  const osnr = getOsnrStatus(noiseLevel);

  const handleTimeCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const x = e.clientX - rect.left;
    const idx = Math.min(numSymbols - 1, Math.max(0, Math.floor((x / rect.width) * numSymbols)));
    onSymbolTap(idx);
  };

  return (
    <>
      <div className={styles.mobileViewBar} role="tablist" aria-label="Modo de pantalla">
        {(
          [
            { id: 'both', label: 'Vista Dual' },
            { id: 'time', label: 'Tiempo CH1-3' },
            { id: 'constellation', label: 'Constelación X-Y' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={viewMode === tab.id}
            className={`${styles.viewTabBtn} ${viewMode === tab.id ? styles.viewTabBtnActive : ''}`}
            onClick={() => onViewModeChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.screensGrid}>
        {/* Osciloscopio Dominio del Tiempo */}
        <div
          className={`${styles.crtContainer} ${
            viewMode === 'constellation' ? styles.hiddenOnMobileTab : ''
          }`}
        >
          <div className={styles.crtBezelBar}>
            <div className={styles.chTagsGroup}>
              <span className={`${styles.chTag} ${styles.ch1}`}>CH1: I(t)</span>
              <span className={`${styles.chTag} ${styles.ch2}`}>CH2: Q(t)</span>
              <span className={`${styles.chTag} ${styles.ch3}`}>CH3: s(t) QPSK</span>
            </div>
            <span className={styles.bezelHint}>Tocá una columna para rotar su símbolo</span>
          </div>
          <canvas
            ref={timeCanvasRef}
            className={styles.scopeCanvas}
            onClick={handleTimeCanvasClick}
            title="Hacé clic o tocá una columna de símbolo para rotar su dibit"
          />
        </div>

        {/* Pantalla X-Y Constelación */}
        <div
          className={`${styles.crtContainer} ${
            viewMode === 'time' ? styles.hiddenOnMobileTab : ''
          }`}
        >
          <div className={styles.crtBezelBar}>
            <span className={styles.chTag} style={{ color: '#e2e8f0', border: '1px solid #475569' }}>
              X-Y: CONSTELACIÓN (I vs Q)
            </span>
            <span style={{ color: osnr.color, fontWeight: 'bold' }}>{osnr.text}</span>
          </div>
          <canvas ref={constCanvasRef} className={styles.constellationCanvas} />
        </div>
      </div>
    </>
  );
}
