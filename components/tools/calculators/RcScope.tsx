'use client';

import { rcSineModel } from '@/lib/instruments/rc';
import { SineScope } from './SineScope';
import type { CalculatorState } from './useCalculatorState';

export function RcScope({ c }: { c: CalculatorState }) {
  const frequencyHz = Number(c.get('rcInputHz')), peakVolts = Number(c.get('rcInputV'));
  return <SineScope kind="rc" model={rcSineModel(c.rcR, c.rcC, frequencyHz, peakVolts)}
    frequency={{ value: frequencyHz, onChange: (v) => c.set('rcInputHz', v) }}
    amplitude={{ value: peakVolts, onChange: (v) => c.set('rcInputV', v) }}
    reference={{ frequencyHz: c.cutoff, onSelect: () => c.set('rcInputHz', Number(c.cutoff.toPrecision(6))), label: 'atCutoff' }} />;
}
