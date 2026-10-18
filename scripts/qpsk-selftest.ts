import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mapDibit, getNextDibit, carrierSample, gaussianRandom, force180Dibits,
  FORCED_180_DIBITS, GRAY_ORDER, INITIAL_DIBITS, symbolSnrDb, theoreticalBer,
} from '../components/dsp/QpskSimulator/qpskMath.ts';
import { createSimulationState, stepSimulation, constellationSamples, projectPoint, HISTORY_LIMIT,
} from '../components/dsp/QpskSimulator/qpskSimulation.ts';
import type { QpskSimConfig } from '../components/dsp/QpskSimulator/types.ts';
import { testRenderer } from './qpsk-renderer-checks.ts';
import { testContent } from './qpsk-content-checks.ts';

const near = (a: number, b: number, tolerance = 1e-12) =>
  assert.ok(Math.abs(a - b) <= tolerance, a + ' differs from ' + b);
function seededRandom(seed = 12345): () => number {
  return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 4294967296; };
}

console.log('QPSK: bit assignment, phase convention, energy and Gray adjacency');
for (const dibit of GRAY_ORDER) {
  const { I, Q, phaseRad, phaseDeg } = mapDibit(dibit);
  assert.equal(I, 1 - 2 * Number(dibit[1]));
  assert.equal(Q, 1 - 2 * Number(dibit[0]));
  near((I * I + Q * Q) / 2, 1);
  near(phaseRad * 180 / Math.PI, phaseDeg);
  const neighbor = getNextDibit(dibit);
  assert.equal([...dibit].filter((bit, i) => bit !== neighbor[i]).length, 1);
  for (let i = 0; i < 4096; i++) {
    const angle = i * Math.PI / 1024;
    near(carrierSample(dibit, angle), Math.cos(angle + phaseRad));
  }
}
for (const count of [1, 2, 6, 9]) {
  const sequence = force180Dibits(count);
  assert.equal(sequence.length, count);
  sequence.slice(1).forEach((dibit, i) =>
    assert.equal(Math.abs(mapDibit(dibit).phaseDeg - mapDibit(sequence[i]).phaseDeg), 180));
}
assert.deepEqual(FORCED_180_DIBITS, force180Dibits(6));

console.log('QPSK: calibrated AWGN and analytical BER');
near(symbolSnrDb(0.35), 6.108339156354676);
assert.equal(symbolSnrDb(0), Infinity);
assert.equal(theoreticalBer(0), 0);
near(theoreticalBer(0.35), 0.021675875630431347, 1e-8);
near(theoreticalBer(0.6), 0.1192964146582157, 1e-8);
near(theoreticalBer(0.12), 1.901329943629781e-9, 1e-15);
let previous = 0;
for (let sigma = 0.01; sigma <= 0.6; sigma += 0.01) {
  assert.ok(theoreticalBer(sigma) >= previous);
  previous = theoreticalBer(sigma);
}
// A reproducible independent hard-decision experiment validates the model and BER together.
const random = seededRandom();
const noise = Array.from({ length: 100000 }, (_, index) => ({
  symbolIndex: index % 4, I: gaussianRandom(random), Q: gaussianRandom(random),
}));
const samples = constellationSamples(noise, [...GRAY_ORDER], 0.35);
let errors = 0;
for (let i = 0; i < samples.length; i++) {
  const received = (samples[i].y < 0 ? '1' : '0') + (samples[i].x < 0 ? '1' : '0');
  errors += [...received].filter((bit, j) => bit !== GRAY_ORDER[i % 4][j]).length;
}
near(errors / (2 * samples.length), theoreticalBer(0.35), 0.001);
for (const axis of ['I', 'Q'] as const) {
  const mean = noise.reduce((sum, sample) => sum + sample[axis], 0) / noise.length;
  const variance = noise.reduce((sum, sample) => sum + sample[axis] ** 2, 0) / noise.length - mean ** 2;
  near(mean, 0, 0.015);
  near(variance, 1, 0.02);
}
const correlation = noise.reduce((sum, sample) => sum + sample.I * sample.Q, 0) / noise.length;
near(correlation, 0, 0.015);
const zeroThenValid = [0, 0.5, 0, 0.5];
assert.ok(Number.isFinite(gaussianRandom(() => zeroThenValid.shift() ?? 0.5)));

console.log('QPSK: pause, zero speed, edits, resizing and frame-rate independence');
const config: QpskSimConfig = { dibits: [...INITIAL_DIBITS], cyclesPerSymbol: 2,
  noiseLevel: 0.05, scrollSpeed: 0.8, running: true, showReference: true, showTrajectories: true };
const state = createSimulationState();
stepSimulation(state, config, 0, () => 0.25);
for (const stopped of [{ ...config, running: false }, { ...config, scrollSpeed: 0 }]) {
  const snapshot = structuredClone(state);
  stepSimulation(state, stopped, 0.1, () => { throw new Error('Frozen noise must not be sampled'); });
  assert.deepEqual(state, snapshot);
}
const savedNoise = structuredClone(state.noise);
const edited = constellationSamples(state.noise, ['11', '11'], 0);
edited.forEach((point) => {
  near(point.x, -Math.SQRT1_2); near(point.y, -Math.SQRT1_2);
});
const noisy = constellationSamples(state.noise, ['11', '11'], 0.6);
near(noisy[0].x - edited[0].x, 0.15);
assert.deepEqual(state.noise, savedNoise);
const point = edited[0];
for (const [w, h] of [[300, 300], [900, 360], [250, 500]]) {
  const pixel = projectPoint(point, w, h);
  const radius = Math.min(w, h) * 0.35;
  near((pixel.x - w / 2) / radius, point.x);
  near((h / 2 - pixel.y) / radius, point.y);
}
function simulate(fps: number) {
  const result = createSimulationState();
  const rng = seededRandom(42);
  for (let i = 0; i < fps * 2; i++) stepSimulation(result, config, 1 / fps, () => gaussianRandom(rng));
  return result;
}
const slow = simulate(30), fast = simulate(144);
near(slow.timeOffset, fast.timeOffset);
near(slow.sampleClock, fast.sampleClock);
assert.deepEqual(slow.noise, fast.noise);
assert.equal(slow.noise.length, HISTORY_LIMIT);
assert.deepEqual(constellationSamples([], [], 0), []);
stepSimulation(createSimulationState(), { ...config, dibits: [] }, 1);

testRenderer(config);
testContent();
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
assert.ok(pkg.scripts['test:qpsk'].includes('qpsk-selftest.ts'));
console.log('All QPSK checks passed.');
