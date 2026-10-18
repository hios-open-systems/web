import assert from 'node:assert/strict';
import { rlCutoff, rlSineModel, rlTransfer } from '../lib/instruments/rl.ts';
import { rclResonance, rclSineModel, rclTransfer } from '../lib/instruments/rcl.ts';
import { sineSamples } from '../lib/instruments/sine.ts';
import { calc } from '../components/tools/calculators/calc.ts';
import { rlLowpass, rclImpedance } from '../components/tools/calculators/viz/responses.ts';

const near = (a: number, b: number, tolerance = 1e-10) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

function testRl() {
  const fc = 1000 / (2 * Math.PI * 0.1);
  const model = rlSineModel(1000, 100, fc, 2)!;
  near(model.cutoff, fc);
  near(model.gain, Math.SQRT1_2);
  near(model.phase, -Math.PI / 4);
  near(sineSamples(model, 0).input[40][1], 2);
  near(sineSamples(model, 0).output[0][1], -1);
  near(sineSamples(model, 0).output[40][1], 1);
  near(rlTransfer(1000, 200, fc)!.gain, 1 / Math.sqrt(5));
  near(rlTransfer(2000, 100, fc)!.gain, 2 / Math.sqrt(5));
  assert.ok(rlTransfer(1000, 100, fc / 100)!.gain > 0.9999);
  assert.ok(rlTransfer(1000, 100, fc * 100)!.gain < 0.01);
  near(calc.rlFilter(1000, 100).fc, model.cutoff);
  const bode = rlLowpass(1000, 100);
  for (const [i, [f, db]] of bode.mag.entries()) {
    const transfer = rlTransfer(1000, 100, f)!;
    near(db, 20 * Math.log10(transfer.gain));
    near(bode.phase[i][1], transfer.phase * 180 / Math.PI);
  }
}

function testRcl() {
  const f0 = 10000 / (2 * Math.PI); // L = 10 mH, C = 1 µF → ω0 = 10,000 rad/s
  const model = rclSineModel(10, 10, 1, f0, 2)!;
  near(rclResonance(10, 1), f0);
  near(model.gain, 1); near(model.phase, 0); near(model.z, 10);
  const samples = sineSamples(model, 0);
  for (const [i, point] of samples.input.entries()) near(samples.output[i][1], point[1]);
  const below = rclTransfer(10, 10, 1, f0 / 2)!;
  const above = rclTransfer(10, 10, 1, f0 * 2)!;
  near(below.gain, 1 / Math.sqrt(226)); near(above.gain, below.gain);
  near(below.phase, Math.atan(15)); near(above.phase, -Math.atan(15));
  assert.ok(sineSamples(rclSineModel(10, 10, 1, f0 / 2, 2)!, 0).output[0][1] > 0);
  assert.ok(rclTransfer(5, 10, 1, f0 / 2)!.gain < below.gain); // smaller R → narrower passband
  assert.ok(rclTransfer(10, 20, 1, f0)!.phase < 0);
  assert.ok(rclTransfer(10, 10, 0.5, f0)!.phase > 0);
  near(sineSamples(rclSineModel(10, 10, 1, f0, 4)!, 0).output[40][1], 4);
  for (const [f, z] of rclImpedance(10, 10, 1).mag) {
    const transfer = rclTransfer(10, 10, 1, f)!;
    near(z, transfer.z); near(z, calc.rclSeries(10, 10, 1, f).z);
    near(transfer.gain, 10 / z);
  }
}

export function testFilterScopes() {
  console.log('Filter scopes: cutoff, resonance, lead/lag, parameter changes and shared frequency models');
  testRl(); testRcl();
  for (const value of [0, -1, NaN, Infinity]) {
    assert.equal(rlCutoff(value, 100), 0);
    assert.equal(rlSineModel(1000, value, 1000, 1), null);
    assert.equal(rlSineModel(1000, 100, value, 1), null);
    assert.equal(rlSineModel(1000, 100, 1000, value), null);
    assert.equal(rclSineModel(value, 10, 1, 1000, 1), null);
    assert.equal(rclSineModel(10, value, 1, 1000, 1), null);
    assert.equal(rclSineModel(10, 10, value, 1000, 1), null);
    assert.equal(rclSineModel(10, 10, 1, value, 1), null);
    assert.equal(rclSineModel(10, 10, 1, 1000, value), null);
  }
  assert.ok(rlLowpass(0, 100).mag.every(([, v]) => Number.isNaN(v)));
  assert.ok(rclImpedance(10, 0, 1).mag.every(([, v]) => Number.isNaN(v)));
  assert.equal(calc.rclSeries(-10, 10, 1, 1000).valid, false);
  assert.equal(calc.rclSeries(0, 10, 1, 1000).q, Infinity);
  assert.equal(rclSineModel(10, 10, 1, 1e308, 1), null);
}
