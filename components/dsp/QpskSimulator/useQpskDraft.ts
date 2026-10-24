'use client';
import type { Dispatch, SetStateAction } from 'react';
import { useToolDraft } from '@/lib/hooks/useToolDraft';
import type { Dibit, QpskSimConfig, ScreenViewMode } from './types';

export function useQpskDraft(config: QpskSimConfig, setConfig: Dispatch<SetStateAction<QpskSimConfig>>,
  viewMode: ScreenViewMode, setViewMode: (mode: ScreenViewMode) => void) {
  useToolDraft('qpsk-modulator', { config: JSON.stringify(config), viewMode }, values => {
    if (values.viewMode === 'both' || values.viewMode === 'time' || values.viewMode === 'constellation') setViewMode(values.viewMode);
    try {
      const saved = JSON.parse(values.config ?? 'null') as Partial<QpskSimConfig> | null;
      if (!saved || !Array.isArray(saved.dibits) || !saved.dibits.length || saved.dibits.length > 128 ||
        !saved.dibits.every((value: Dibit) => ['00', '01', '11', '10'].includes(value))) return;
      const bounded = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && value >= min && value <= max;
      if (!bounded(saved.cyclesPerSymbol, 1, 5) || !bounded(saved.noiseLevel, 0, 0.6) || !bounded(saved.scrollSpeed, 0, 3)) return;
      setConfig({ dibits: saved.dibits, cyclesPerSymbol: saved.cyclesPerSymbol, noiseLevel: saved.noiseLevel,
        scrollSpeed: saved.scrollSpeed, running: false, showReference: saved.showReference !== false, showTrajectories: saved.showTrajectories !== false });
    } catch { /* Ignore invalid drafts. */ }
  });
}
