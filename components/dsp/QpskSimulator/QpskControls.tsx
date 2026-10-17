import React from 'react';
import type { Dibit } from './types';
import { FORCED_180_DIBITS, getNextDibit, getRandomDibits, mapDibit } from './qpskMath';
import styles from './qpskSimulator.module.css';

interface QpskControlsProps {
  dibits: Dibit[];
  onDibitsChange: (dibits: Dibit[]) => void;
  cyclesPerSymbol: number;
  onCyclesChange: (val: number) => void;
  noiseLevel: number;
  onNoiseChange: (val: number) => void;
  scrollSpeed: number;
  onSpeedChange: (val: number) => void;
  showReference: boolean;
  onShowReferenceChange: (val: boolean) => void;
  showTrajectories: boolean;
  onShowTrajectoriesChange: (val: boolean) => void;
  running: boolean;
  onToggleRunning: () => void;
}

export function QpskControls(props: QpskControlsProps) {
  const {
    dibits,
    onDibitsChange,
    cyclesPerSymbol,
    onCyclesChange,
    noiseLevel,
    onNoiseChange,
    scrollSpeed,
    onSpeedChange,
    showReference,
    onShowReferenceChange,
    showTrajectories,
    onShowTrajectoriesChange,
    running,
    onToggleRunning,
  } = props;

  const handleDibitClick = (index: number) => {
    const next = [...dibits];
    next[index] = getNextDibit(next[index]);
    onDibitsChange(next);
  };

  return (
    <div className={styles.controlsPanel}>
      <div className={styles.controlGroup}>
        <div className={styles.controlLabelRow}>
          <span>Secuencia de Dibits (Click para rotar)</span>
          <span className={styles.labelValue}>{dibits.length} símb.</span>
        </div>
        <div className={styles.bitInputWrapper}>
          {dibits.map((dibit, idx) => {
            const info = mapDibit(dibit);
            return (
              <button
                key={idx}
                type="button"
                className={styles.dibitBtn}
                onClick={() => handleDibitClick(idx)}
                aria-label={`Símbolo ${idx + 1}: ${dibit}, fase ${info.phaseDeg} grados`}
              >
                <span>{dibit}</span>
                <span className={styles.dibitPhase}>{info.phaseDeg}°</span>
              </button>
            );
          })}
        </div>
        <div className={styles.btnRow}>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            onClick={() => onDibitsChange(getRandomDibits(dibits.length))}
          >
            Aleatoria
          </button>
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            onClick={() => onDibitsChange([...FORCED_180_DIBITS])}
            title="Fuerza saltos de 180° (00 <-> 11)"
          >
            Forzar 180°
          </button>
        </div>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.sliderField}>
          <span className={styles.controlLabelRow}>
            <span>Ciclos Portadora / Símbolo</span>
            <span className={styles.labelValue}>{cyclesPerSymbol.toFixed(1)} c/s</span>
          </span>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={cyclesPerSymbol}
            onChange={(e) => onCyclesChange(parseFloat(e.target.value))}
            className={styles.sliderInput}
          />
        </label>
        <label className={styles.sliderField}>
          <span className={styles.controlLabelRow}>
            <span>Ruido de Canal (AWGN / OSNR)</span>
            <span className={styles.labelValue}>{noiseLevel.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min="0"
            max="0.6"
            step="0.02"
            value={noiseLevel}
            onChange={(e) => onNoiseChange(parseFloat(e.target.value))}
            className={styles.sliderInput}
          />
        </label>
      </div>

      <div className={styles.controlGroup}>
        <label className={styles.sliderField}>
          <span className={styles.controlLabelRow}>
            <span>Velocidad de Barrido</span>
            <span className={styles.labelValue}>{scrollSpeed.toFixed(1)}x</span>
          </span>
          <input
            type="range"
            min="0"
            max="3"
            step="0.2"
            value={scrollSpeed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className={styles.sliderInput}
          />
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={showReference}
            onChange={(e) => onShowReferenceChange(e.target.checked)}
          />
          <span>Portadora de referencia (0° gris)</span>
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={showTrajectories}
            onChange={(e) => onShowTrajectoriesChange(e.target.checked)}
          />
          <span>Transiciones vectoriales en X-Y</span>
        </label>
      </div>

      <div className={styles.controlGroup} style={{ justifyContent: 'space-between' }}>
        <div className={styles.controlLabelRow}>
          <span>Control de Adquisición</span>
        </div>
        <button
          type="button"
          className={`${styles.actionBtn} ${!running ? styles.actionBtnWarning : ''}`}
          onClick={onToggleRunning}
        >
          {running ? 'PAUSAR / SINGLE SHOT' : 'REANUDAR BARRIDO'}
        </button>
        <div className={styles.grayRefBox}>
          <strong>Mapeo Gray:</strong>
          <br />
          00: 45° (+I,+Q) | 01: 135° (-I,+Q)
          <br />
          11: 225° (-I,-Q) | 10: 315° (+I,-Q)
        </div>
      </div>
    </div>
  );
}
