import assert from 'node:assert/strict';
import { amplifierSineModel, nonInvertingTransfer } from '../lib/instruments/amplifier.ts';
import { sineSamples, sineVoltageLimit } from '../lib/instruments/sine.ts';
import { calc } from '../components/tools/calculators/calc.ts';
import { ampFlat } from '../components/tools/calculators/viz/responses.ts';
import { axisPosition } from '../components/instruments/plotGeometry.ts';

const near = (a: number, b: number, tolerance = 1e-10) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

export function testAmplifierScope() {
  console.log('Amplifier scope: independent gain, phase, shared scale, resistor changes and numeric guards');
  const model = amplifierSineModel(10000, 1000, 1000, 0.1)!;
  near(model.gain, 11); near(model.gainDb, 20.8278537031645); near(model.phase, 0);
  near(model.duration, 0.003);
  near(sineVoltageLimit(model), 1.32);
  const samples = sineSamples(model, 0);
  near(samples.input[40][1], 0.1); near(samples.output[40][1], 1.1);
  near(samples.output[120][1], -1.1);
  near(nonInvertingTransfer(20000, 1000)!.gain, 21);
  near(nonInvertingTransfer(10000, 2000)!.gain, 6);
  near(calc.ampGain(10000, 1000).gain, model.gain);
  assert.equal(calc.ampGain(10000, 1000).valid, true);
  assert.ok(ampFlat(model.gainDb).mag.every(([, db]) => db === model.gainDb));
  for (const frequency of [20, 2000, 20000]) {
    const response = amplifierSineModel(10000, 1000, frequency, 0.2)!;
    near(response.gain, 11); near(response.phase, 0); near(response.duration, 3 / frequency);
    near(sineSamples(response, 0).output[40][1], 2.2);
  }
  for (const phase of [0, 0.5, 12]) {
    const { input, output } = sineSamples(model, phase);
    const axis = { domain: [-sineVoltageLimit(model), sineVoltageLimit(model)] as const, label: 'V' };
    for (const [i, [time, voltage]] of output.entries()) {
      near(time, input[i][0]); near(voltage, 11 * input[i][1]);
      const y = axisPosition(voltage, axis, 192, 24);
      assert.ok(y >= 24 && y <= 192, 'amplified output must remain inside the plot');
    }
  }
  const unity = amplifierSineModel(0, 1000, 1000, 0.1)!;
  near(unity.gain, 1); near(unity.gainDb, 0);
  assert.deepEqual(sineSamples(unity, 1).input, sineSamples(unity, 1).output);
  for (const value of [-1, NaN, Infinity]) assert.equal(nonInvertingTransfer(value, 1000), null);
  for (const value of [0, -1, NaN, Infinity]) {
    assert.equal(calc.ampGain(10000, value).valid, false);
    assert.equal(amplifierSineModel(10000, value, 1000, 0.1), null);
    assert.equal(amplifierSineModel(10000, 1000, value, 0.1), null);
    assert.equal(amplifierSineModel(10000, 1000, 1000, value), null);
  }
  assert.equal(nonInvertingTransfer(Number.MAX_VALUE, Number.MIN_VALUE), null);
  assert.equal(amplifierSineModel(10000, 1000, 1000, 1e308), null);
  assert.equal(amplifierSineModel(10000, 1000, Number.MIN_VALUE, 0.1), null);
}
