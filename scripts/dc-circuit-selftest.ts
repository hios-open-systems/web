import assert from 'node:assert/strict';
import { calculateCircuit, DEFAULT_CIRCUIT } from '../lib/electronics/dcCircuit.ts';

function near(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} ≠ ${expected}`);
}

const parallel = calculateCircuit(DEFAULT_CIRCUIT);
near(parallel.equivalent, 200 / 3);
near(parallel.current, 0.18);
near(parallel.power, 2.16);
near(parallel.resistors[0].voltage, 12);
near(parallel.resistors[1].voltage, 12);
near(parallel.resistors[0].current, 0.12);
near(parallel.resistors[1].current, 0.06);
near(parallel.resistors.reduce((sum, item) => sum + item.current, 0), parallel.current);

const series = calculateCircuit({ ...DEFAULT_CIRCUIT, mode: 'series' });
near(series.equivalent, 300);
near(series.current, 0.04);
near(series.resistors[0].voltage, 4);
near(series.resistors[1].voltage, 8);
near(series.power, 0.48);
near(series.resistors.reduce((sum, item) => sum + item.voltage, 0), series.sourceVoltage);
near(series.resistors.reduce((sum, item) => sum + item.power, 0), series.power);

const openSeries = calculateCircuit({ ...DEFAULT_CIRCUIT, mode: 'series', connected: false });
assert.equal(openSeries.equivalent, Infinity);
assert.equal(openSeries.current, 0);
assert.equal(openSeries.resistors[0].voltage, 0);
assert.equal(openSeries.resistors[1].voltage, 0);

const openParallel = calculateCircuit({ ...DEFAULT_CIRCUIT, connected: false });
near(openParallel.equivalent, 100);
near(openParallel.current, parallel.resistors[0].current);
near(openParallel.resistors[0].voltage, 12);
assert.equal(openParallel.resistors[1].current, 0);
near(openParallel.power, 1.44);

const off = calculateCircuit({ ...DEFAULT_CIRCUIT, powered: false });
assert.equal(off.sourceVoltage, 0);
assert.equal(off.current, 0);
assert.equal(off.power, 0);
near(off.equivalent, parallel.equivalent);
const single = calculateCircuit({ ...DEFAULT_CIRCUIT, mode: 'single', connected: false });
near(single.current, 0.12);
assert.equal(single.resistors.length, 1);

const doubled = calculateCircuit({ ...DEFAULT_CIRCUIT, voltage: 24 });
near(doubled.current, 2 * parallel.current);
near(doubled.power, 4 * parallel.power);
for (const mode of ['single', 'series', 'parallel'] as const) {
  for (const r1 of [10, 100, 1000]) {
    for (const r2 of [10, 200, 1000]) {
      for (const connected of [true, false]) {
        const circuit = calculateCircuit({ ...DEFAULT_CIRCUIT, mode, r1, r2, voltage: 24, connected });
        near(circuit.resistors.reduce((sum, item) => sum + item.power, 0), circuit.power);
        for (const item of circuit.resistors) near(item.voltage, item.current * item.resistance);
        if (mode === 'parallel') {
          near(circuit.current, circuit.resistors.reduce((sum, item) => sum + item.current, 0));
          assert.ok(circuit.equivalent <= r1);
        }
      }
    }
  }
}
assert.throws(() => calculateCircuit({ ...DEFAULT_CIRCUIT, r1: 0 }), RangeError);
assert.throws(() => calculateCircuit({ ...DEFAULT_CIRCUIT, voltage: Infinity }), RangeError);
console.log('DC circuit self-tests passed: Ohm, KCL, KVL, power, open circuits, source off, invalid input.');
