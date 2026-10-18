'use client';

import { rlSineModel } from '@/lib/instruments/rl';
import { FilterScope } from './FilterScope';
import type { CalculatorState } from './useCalculatorState';

export function RlScope({ c }: { c: CalculatorState }) {
  const frequencyHz = Number(c.get('rlInputHz')), peakVolts = Number(c.get('rlInputV'));
  return <FilterScope kind="rl" model={rlSineModel(c.rlR, c.rlL, frequencyHz, peakVolts)}
    frequency={{ value: frequencyHz, onChange: (v) => c.set('rlInputHz', v) }}
    amplitude={{ value: peakVolts, onChange: (v) => c.set('rlInputV', v) }}
    characteristic={c.rlFilter.fc} onCharacteristic={() => c.set('rlInputHz', c.rlFilter.fc)} />;
}
