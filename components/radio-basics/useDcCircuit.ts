'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { calculateCircuit, DEFAULT_CIRCUIT, type CircuitSettings } from '@/lib/electronics/dcCircuit';

export function useDcCircuit() {
  const locale = useLocale();
  const [settings, setSettings] = useState<CircuitSettings>(DEFAULT_CIRCUIT);
  const result = calculateCircuit(settings);
  const format = (value: number, digits = 2) => Number.isFinite(value)
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)
    : '∞';
  const update = <K extends keyof CircuitSettings>(key: K, value: CircuitSettings[K]) => {
    setSettings(previous => ({ ...previous, [key]: value }));
  };
  return { settings, result, format, update, reset: () => setSettings({ ...DEFAULT_CIRCUIT }) };
}
