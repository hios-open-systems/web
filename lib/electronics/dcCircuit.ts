export type CircuitMode = 'single' | 'series' | 'parallel';

export interface CircuitSettings {
  mode: CircuitMode;
  voltage: number;
  r1: number;
  r2: number;
  powered: boolean;
  connected: boolean;
}

export interface ResistorResult {
  number: 1 | 2;
  resistance: number;
  voltage: number;
  current: number;
  power: number;
  connected: boolean;
}

export interface CircuitResult {
  sourceVoltage: number;
  equivalent: number;
  current: number;
  power: number;
  resistors: ResistorResult[];
}

export const DEFAULT_CIRCUIT: CircuitSettings = {
  mode: 'parallel', voltage: 12, r1: 100, r2: 200, powered: true, connected: true,
};

function resistor(number: 1 | 2, resistance: number, voltage: number, connected: boolean): ResistorResult {
  const current = voltage / resistance;
  return { number, resistance, voltage, current, power: voltage * current, connected };
}

/** Steady-state ideal DC. An open switch has infinite resistance; wires have zero resistance. */
export function calculateCircuit(settings: CircuitSettings): CircuitResult {
  const { mode, voltage, r1, r2, powered, connected } = settings;
  if (![voltage, r1, r2].every(Number.isFinite) || voltage < 0 || r1 <= 0 || r2 <= 0) {
    throw new RangeError('DC circuits require finite, positive resistances and non-negative voltage.');
  }
  const sourceVoltage = powered ? voltage : 0;
  const equivalent = mode === 'single' ? r1 : mode === 'series'
    ? connected ? r1 + r2 : Infinity
    : connected ? (r1 * r2) / (r1 + r2) : r1;
  const current = sourceVoltage / equivalent;
  const v1 = mode === 'series' ? current * r1 : sourceVoltage;
  const v2 = connected ? mode === 'series' ? current * r2 : sourceVoltage : 0;
  const resistors = [resistor(1, r1, v1, true)];
  if (mode !== 'single') resistors.push(resistor(2, r2, v2, connected));
  return { sourceVoltage, equivalent, current, power: sourceVoltage * current, resistors };
}
