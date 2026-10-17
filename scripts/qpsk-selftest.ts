import assert from 'node:assert/strict';
import {
  mapDibit,
  getNextDibit,
  gaussianRandom,
  getRandomDibits,
  FORCED_180_DIBITS,
  GRAY_ORDER,
} from '../components/dsp/QpskSimulator/qpskMath.ts';

// Test 1: Gray Code Mapping
console.log('Testing QPSK Gray mapping...');
const m00 = mapDibit('00');
assert.equal(m00.I, 1);
assert.equal(m00.Q, 1);
assert.equal(m00.phaseDeg, 45);

const m01 = mapDibit('01');
assert.equal(m01.I, -1);
assert.equal(m01.Q, 1);
assert.equal(m01.phaseDeg, 135);

const m11 = mapDibit('11');
assert.equal(m11.I, -1);
assert.equal(m11.Q, -1);
assert.equal(m11.phaseDeg, 225);

const m10 = mapDibit('10');
assert.equal(m10.I, 1);
assert.equal(m10.Q, -1);
assert.equal(m10.phaseDeg, 315);

// Test 2: Gray order rotation
console.log('Testing Gray order cycling...');
assert.equal(getNextDibit('00'), '01');
assert.equal(getNextDibit('01'), '11');
assert.equal(getNextDibit('11'), '10');
assert.equal(getNextDibit('10'), '00');

// Test 3: Box-Muller Gaussian Random
console.log('Testing Gaussian noise distribution (Box-Muller)...');
let sum = 0;
const N = 10000;
for (let i = 0; i < N; i++) {
  sum += gaussianRandom();
}
const mean = sum / N;
assert.ok(Math.abs(mean) < 0.1, `Gaussian mean should be close to 0, got ${mean}`);

// Test 4: Random dibits generator
const rand = getRandomDibits(6);
assert.equal(rand.length, 6);
rand.forEach((d) => assert.ok(GRAY_ORDER.includes(d)));

// Test 5: Forced 180° sequence
assert.equal(FORCED_180_DIBITS[0], '00');
assert.equal(FORCED_180_DIBITS[1], '11');
assert.equal(Math.abs(mapDibit('00').phaseDeg - mapDibit('11').phaseDeg), 180);

console.log('All QPSK DSP tests passed successfully!');
