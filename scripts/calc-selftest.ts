/**
 * Self-test for the embedded-calculators math. Exercises the real pure
 * modules the UI depends on (calc.ts + viz/responses.ts) against hand-checked
 * physics values, so a refactor that breaks a formula fails CI, not prod.
 *
 * Run: node --experimental-strip-types scripts/calc-selftest.ts
 */
import { calc, formatOhm, nearestE24 } from '../components/tools/calculators/calc.ts';
import {
  rcLowpass,
  rlLowpass,
  rclImpedance,
  ampFlat,
} from '../components/tools/calculators/viz/responses.ts';

let failures = 0;

function approx(name: string, got: number, want: number, tol = 1e-2) {
  const ok = Number.isFinite(got) && Math.abs(got - want) <= Math.abs(want) * tol + tol;
  if (!ok) {
    failures++;
    console.error(`✗ ${name}: got ${got}, want ≈ ${want}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

function assert(name: string, cond: boolean) {
  if (!cond) {
    failures++;
    console.error(`✗ ${name}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// --- calc.ts ---------------------------------------------------------------
const led = calc.ledResistor(5, 2, 10);
approx('led R', led.resistance, 300);
approx('led P', led.power, 0.03);
assert('led valid', led.valid === true);
assert('led invalid when Vs<=Vf', calc.ledResistor(2, 2, 10).valid === false);

approx('cap ripple', calc.capacitorForRipple(300, 0.2, 100000).value, 1.5e-5);
assert('cap invalid on 0 ripple', calc.capacitorForRipple(300, 0, 100000).valid === false);

const th = calc.powerAndTemp(5, 0.4, 35, 30);
approx('thermal P', th.power, 2);
approx('thermal Tj', th.junction, 100);

approx('runtime h', calc.runtimeHours(2500, 180, 85), 11.806);

const div = calc.adcDivider(12, 3.1, 10);
approx('adc ratio', div.ratio, 3.871);
approx('adc Rtop', div.rTopK, 28.71);
assert('adc invalid when Vin<=Vadc', calc.adcDivider(3, 5, 10).valid === false);

approx('rc fc', calc.rcCutoff(10000, 100), 159.155);
approx('rc required R', calc.rcRequiredR(160, 100), 9947.18);

const g = calc.ampGain(10000, 1000);
approx('amp gain', g.gain, 11);
approx('amp dB', g.gainDb, 20.828);

const i2s = calc.i2sClocks(44100, 16, 2, 256);
approx('i2s bclk', i2s.bclk, 1411200);
approx('i2s mclk', i2s.mclk, 11289600);

approx('rl fc', calc.rlFilter(1000, 100).fc, 1591.549);
approx('rl required L', calc.rlRequiredL(1000, 1000), 159.155);

const rcl = calc.rclSeries(10, 10, 1, 1000);
approx('rcl XL', rcl.xl, 62.832);
approx('rcl XC', rcl.xc, 159.155);
approx('rcl |Z|', rcl.z, 96.84);
approx('rcl f0', rcl.f0, 1591.549);
approx('rcl Q', rcl.q, 10);

approx('nearestE24 4700', nearestE24(4700) ?? -1, 4700);
approx('nearestE24 123 -> 120', nearestE24(123) ?? -1, 120);
assert('nearestE24 0 -> null', nearestE24(0) === null);
assert('formatOhm kΩ', formatOhm(4700) === '4.70 kΩ');
assert('formatOhm MΩ', formatOhm(2_200_000) === '2.20 MΩ');

// --- viz/responses.ts (center sample i = steps/2 sits on the char. freq) ---
const rc = rcLowpass(10000, 100);
approx('rc curve mark', rc.mark, 159.155);
approx('rc -3dB at fc', rc.mag[70][1], -3.0103, 5e-2);

const rl = rlLowpass(1000, 100);
approx('rl curve mark', rl.mark, 1591.549);
approx('rl -3dB at fc', rl.mag[70][1], -3.0103, 5e-2);

const zc = rclImpedance(10, 10, 1);
approx('rcl curve mark f0', zc.mark, 1591.549);
approx('rcl |Z| min ≈ R at f0', zc.mag[70][1], 10, 5e-2);

const af = ampFlat(20.83);
assert('amp flat constant', af.mag.every((p) => p[1] === 20.83));

// ---------------------------------------------------------------------------
if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll calculator self-tests passed');
