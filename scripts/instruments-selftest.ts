import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { axisPosition, axisTicks, dataDomain, formatScopeValue, tracePath, validAxis } from '../components/instruments/plotGeometry.ts';
import { rcSineModel, rcSineSamples, rcTransfer } from '../lib/instruments/rc.ts';
import { i2sClockModel, i2sClockSamples, squareClock } from '../lib/instruments/i2s.ts';
import { rcLowpass } from '../components/tools/calculators/viz/responses.ts';
import { SCOPE_COLORS } from '../components/instruments/channels.ts';
import { CHANNELS } from '../components/dsp/QpskSimulator/qpskMath.ts';
import { AUDIO_BREAKOUTS } from '../config/pinouts/modules/audio.ts';
import { testFilterScopes } from './filter-scope-checks.ts';

const near = (actual: number, expected: number, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
console.log('Instruments: axes, logarithmic spacing, invalid samples and units');
const linear = { domain: [-2, 2] as const, label: 'V' };
const log = { domain: [1, 1000] as const, label: 'Hz', scale: 'log' as const };
near(axisPosition(0, linear, 20, 420), 220);
near(axisPosition(10, log, 0, 300), 100);
near(axisPosition(100, log, 0, 300), 200);
assert.deepEqual(axisTicks(log), [1, 10, 100, 1000]);
assert.equal(validAxis({ ...log, domain: [0, 1] }), false);
assert.equal(validAxis({ ...linear, domain: [1, 1] }), false);
assert.equal(validAxis({ ...linear, domain: [0, Infinity] }), false);
assert.deepEqual(dataDomain([[0, 2], [1, NaN], [2, 2]], 1), [1, 3]);
assert.equal(tracePath([[0, 1], [1, NaN], [2, 3]], (v) => v, (v) => v), 'M0.00,1.00  M2.00,3.00');
assert.equal(formatScopeValue(3_072_000, 6), '3.072M');
assert.equal(formatScopeValue(0.00002), '20µ');
assert.deepEqual(CHANNELS.map((c) => c.color), SCOPE_COLORS.slice(0, 3));

console.log('Instruments: RC independent transfer values, phase lag and Bode/time agreement');
const fc = 1 / (2 * Math.PI * 0.001);
const rc = rcSineModel(10000, 100, fc, 2)!;
near(rc.gain, Math.SQRT1_2);
near(rc.phase, -Math.PI / 4);
near(20 * Math.log10(rc.gain), -3.01029995664, 1e-9);
const samples = rcSineSamples(rc, 0);
near(samples.input[40][1], 2); // a quarter of the first period
near(samples.output[40][1], 1);
near(samples.output[0][1], -1); // negative phase: output lags input
near(samples.input[480][0], 3 / fc);
const bode = rcLowpass(10000, 100);
for (const [i, [f, db]] of bode.mag.entries()) {
  const response = rcTransfer(10000, 100, f)!;
  near(db, 20 * Math.log10(response.gain));
  near(bode.phase[i][1], response.phase * 180 / Math.PI);
}
assert.ok(rcTransfer(10000, 100, fc / 100)!.gain > 0.9999);
assert.ok(rcTransfer(10000, 100, fc * 100)!.gain < 0.01);
for (const value of [0, -1, Infinity, NaN]) {
  assert.equal(rcSineModel(value, 100, 100, 1), null);
  assert.equal(rcSineModel(10000, value, 100, 1), null);
  assert.equal(rcSineModel(10000, 100, value, 1), null);
  assert.equal(rcSineModel(10000, 100, 100, value), null);
}

console.log('Instruments: exact I²S edges, stereo slot ratio and named physical pins');
for (const rate of [44100, 48000, 96000]) for (const bits of [16, 32]) {
  const model = i2sClockModel(rate, bits)!;
  near(model.bclk, rate * bits * 2);
  const { bclk, ws } = i2sClockSamples(model, 0);
  const rises = bclk.filter((p, i) => i > 0 && p[0] === bclk[i - 1][0] && p[1] > bclk[i - 1][1]);
  assert.equal(rises.length, bits * 2);
  const wsRise = ws.find((p, i) => i > 0 && p[0] === ws[i - 1][0] && p[1] > ws[i - 1][1])!;
  near(wsRise[0], 1 / (2 * rate));
  assert.ok(bclk.every(([x, y]) => x >= 0 && x <= model.duration && [2, 3].includes(y)));
  assert.ok(ws.every(([x, y]) => x >= 0 && x <= model.duration && [0, 1].includes(y)));
  const moving = i2sClockSamples(model, 12.34);
  assert.ok(moving.bclk.every(([x], i) => !i || x >= moving.bclk[i - 1][0]));
}
assert.equal(i2sClockModel(0, 32), null);
assert.equal(i2sClockModel(48000, 17), null);
assert.deepEqual(squareClock(Infinity, 1, 0), []);
for (const breakout of AUDIO_BREAKOUTS) {
  assert.ok(breakout.signalLab);
  assert.ok(breakout.pins.some((pin) => pin.name === breakout.signalLab?.clockPin && pin.role === 'i2s'));
  assert.ok(breakout.pins.some((pin) => pin.name === breakout.signalLab?.wordPin && pin.role === 'i2s'));
}
for (const locale of ['en', 'es', 'de', 'it']) {
  const messages = JSON.parse(readFileSync(new URL(`../messages/${locale}.json`, import.meta.url), 'utf8'));
  assert.ok(messages.Instrument.rc.description && messages.Instrument.i2s.dataHint && messages.Instrument.animationHint);
  assert.ok(messages.Instrument.rl.hint.includes('H = R / (R + jωL)'));
  assert.ok(messages.Instrument.rcl.hint.includes('H = R / [R + j(ωL − 1/ωC)]'));
  assert.ok(messages.Instrument.excitation.atResonance && messages.Instrument.rcl.schematic);
}
testFilterScopes();
console.log('All instrument checks passed.');
