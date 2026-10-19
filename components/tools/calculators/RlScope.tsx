'use client';

import { rlSineModel } from '@/lib/instruments/rl';
import { SineScope } from './SineScope';
import type { CalculatorState } from './useCalculatorState';

export function RlScope({ c }: { c: CalculatorState }) {
  const frequencyHz = Number(c.get('rlInputHz')), peakVolts = Number(c.get('rlInputV'));
  return <SineScope kind="rl" model={rlSineModel(c.rlR, c.rlL, frequencyHz, peakVolts)}
    frequency={{ value: frequencyHz, onChange: (v) => c.set('rlInputHz', v) }}
    amplitude={{ value: peakVolts, onChange: (v) => c.set('rlInputV', v) }}
    reference={{ frequencyHz: c.rlFilter.fc, onSelect: () => c.set('rlInputHz', c.rlFilter.fc), label: 'atCutoff' }} />;
}
