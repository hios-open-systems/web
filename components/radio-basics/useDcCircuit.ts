'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { calculateCircuit, DEFAULT_CIRCUIT, type CircuitSettings } from '@/lib/electronics/dcCircuit';

export function useDcCircuit() {
  const locale = useLocale();
  const [settings, setSettings] = useState<CircuitSettings>(DEFAULT_CIRCUIT);
  const result = calculateCircuit(settings);
  const format = (value: number, digits = 2) => {
    if (!Number.isFinite(value)) return '∞';
    const small = value !== 0 && Math.abs(value) < 10 ** (1 - digits);
    return new Intl.NumberFormat(locale, small
      ? { maximumSignificantDigits: 2 }
      : { maximumFractionDigits: digits }).format(value);
  };
  const update = <K extends keyof CircuitSettings>(key: K, value: CircuitSettings[K]) => {
    setSettings(previous => ({ ...previous, [key]: value }));
  };
  return { settings, result, format, update, reset: () => setSettings({ ...DEFAULT_CIRCUIT }) };
}
