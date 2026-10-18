'use client';

import { rclResonance, rclSineModel } from '@/lib/instruments/rcl';
import { FilterScope } from './FilterScope';
import type { CalculatorState } from './useCalculatorState';

export function RclScope({ c }: { c: CalculatorState }) {
  const peakVolts = Number(c.get('rclInputV'));
  const resonance = rclResonance(c.rclL, c.rclC);
  return <FilterScope kind="rcl" model={rclSineModel(c.rclR, c.rclL, c.rclC, c.rclF, peakVolts)}
    amplitude={{ value: peakVolts, onChange: (v) => c.set('rclInputV', v) }}
    characteristic={resonance} onCharacteristic={() => c.setRclF(resonance)} />;
}
