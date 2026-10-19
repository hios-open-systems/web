'use client';

import { amplifierSineModel } from '@/lib/instruments/amplifier';
import { SineScope } from './SineScope';
import type { CalculatorState } from './useCalculatorState';

export function GainScope({ c }: { c: CalculatorState }) {
  const frequencyHz = Number(c.get('gainInputHz')), peakVolts = Number(c.get('gainInputV'));
  return <SineScope kind="gain" model={amplifierSineModel(c.rf, c.rg, frequencyHz, peakVolts)}
    frequency={{ value: frequencyHz, onChange: (v) => c.set('gainInputHz', v) }}
    amplitude={{ value: peakVolts, onChange: (v) => c.set('gainInputV', v) }} />;
}
