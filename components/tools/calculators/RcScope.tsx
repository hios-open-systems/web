'use client';

import { rcSineModel } from '@/lib/instruments/rc';
import { FilterScope } from './FilterScope';
import type { CalculatorState } from './useCalculatorState';

export function RcScope({ c }: { c: CalculatorState }) {
  const frequencyHz = Number(c.get('rcInputHz')), peakVolts = Number(c.get('rcInputV'));
  return <FilterScope kind="rc" model={rcSineModel(c.rcR, c.rcC, frequencyHz, peakVolts)}
    frequency={{ value: frequencyHz, onChange: (v) => c.set('rcInputHz', v) }}
    amplitude={{ value: peakVolts, onChange: (v) => c.set('rcInputV', v) }}
    characteristic={c.cutoff} onCharacteristic={() => c.set('rcInputHz', Number(c.cutoff.toPrecision(6)))} />;
}
