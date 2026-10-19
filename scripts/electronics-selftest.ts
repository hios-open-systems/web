import assert from 'node:assert/strict';
import { E_SERIES } from '../lib/electronics/series.ts';
import { preferredResistance } from '../lib/electronics/resistors.ts';
import { adcRecommendation, dividerRange, dividerVoltage } from '../lib/electronics/divider.ts';
import { MAX_SD_EXAMPLE, MAX_SD_RIGHT_RESISTOR, max98357Sd, rightChannelResistor } from '../lib/electronics/max98357.ts';
import { bandsToValue, valueToBands } from '../lib/algorithms/resistorColorCode.ts';
import { nearestStandard } from '../components/tools/calculators/eseries.ts';
import { calc } from '../components/tools/calculators/calc.ts';
import { ledRecommendation } from '../lib/electronics/led.ts';

const near = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
for (const series of ['e12', 'e24', 'e48', 'e96'] as const) {
  for (const decade of [0.01, 1, 1000, 1e9]) {
    assert.equal(preferredResistance(9.95 * decade, series), 10 * decade);
    for (const base of E_SERIES[series]) {
      const value = Number((base * decade).toPrecision(12));
      for (const mode of ['nearest', 'up', 'down'] as const) assert.equal(preferredResistance(value, series, mode), value);
    }
  }
  assert.equal(preferredResistance(10, series, 'down'), 10);
  assert.ok(preferredResistance(9.99, series, 'up')! >= 9.99);
  assert.ok(preferredResistance(1.001, series, 'down')! <= 1.001);
}
assert.equal(nearestStandard(calc.rcRequiredR(160, 100)), 10000);
assert.equal(nearestStandard(250, 'E24', 'up'), 270);
assert.equal(nearestStandard(250, 'E24', 'down'), 240);
const led = ledRecommendation(5, 2, 12, 'e24')!;
assert.equal(led.resistance, 270);
near(led.currentMa, 1000 / 90);
near(led.power, 1 / 30);
assert.equal(ledRecommendation(5, 5, 12, 'e24'), null);
assert.equal(ledRecommendation(Infinity, 2, 12, 'e24'), null);
for (const input of [NaN, Infinity, -1, 0]) assert.equal(preferredResistance(input), null);
for (const [value, bands] of [[9950, 4], [9995, 5]] as const) {
  const colors = valueToBands(value, bands);
  assert.ok(Array.isArray(colors));
  const decoded = bandsToValue(colors);
  assert.ok('ohms' in decoded);
  assert.equal(decoded.ohms, 10000);
}

near(dividerVoltage(12, 27000, 10000)!, 3.2432432432432434);
const nominal = adcRecommendation(12, 3.2, 10000, 0, 'e24')!;
assert.equal(nominal.resistance, 30000);
near(nominal.voltage.nominal, 3);
const guarded = adcRecommendation(12, 3.2, 10000, 5, 'e24')!;
assert.equal(guarded.resistance, 33000);
assert.ok(guarded.voltage.max < 3.2);
for (const series of ['e12', 'e24'] as const) {
  for (const tolerance of [0, 1, 5, 10, 20]) {
    for (const supply of [5, 12, 24, 60]) {
      const result = adcRecommendation(supply, 3.2, 10000, tolerance, series)!;
      assert.ok(result.voltage.max <= 3.2 + 1e-12);
      near(result.voltage.min, dividerVoltage(supply, result.resistance * (1 + tolerance / 100), 10000 * (1 - tolerance / 100))!);
      near(result.voltage.max, dividerVoltage(supply, result.resistance * (1 - tolerance / 100), 10000 * (1 + tolerance / 100))!);
    }
  }
}
assert.equal(adcRecommendation(3, 5, 10000, 5, 'e24'), null);
assert.equal(adcRecommendation(Infinity, 3, 10000, 5, 'e24'), null);
assert.equal(dividerRange(5, 1000, 1000, 100), null);
assert.equal(dividerRange(5, -1, 1000), null);
assert.equal(dividerVoltage(5, 1000, 0), null);

const sd = (external: number | null, onboard: number | null = null, supply = 5, tolerancePct = 5) =>
  max98357Sd({ supply, external, onboard, tolerancePct })!;
assert.equal(MAX_SD_RIGHT_RESISTOR, 360000);
assert.equal(sd(MAX_SD_RIGHT_RESISTOR).stableChannel, 'right');
assert.equal(sd(0).stableChannel, 'left');
assert.equal(sd(null).stableChannel, 'off');
assert.equal(sd(null, 1000000).stableChannel, 'mono');
near(sd(220000).voltage.nominal, 1.5625);
assert.equal(sd(220000).nominalChannel, 'left');
assert.equal(sd(220000).stableChannel, null);
assert.equal(sd(360000, 1000000).stableChannel, null);
assert.equal(rightChannelResistor(5, 100000), null);
assert.equal(sd(360000, null, 5, 10).stableChannel, null);
assert.equal(rightChannelResistor(5, null, 10), 390000);
assert.equal(sd(390000, null, 5, 10).stableChannel, 'right');
for (const supply of [2.5, 3.3, 5, 5.5]) {
  for (const onboard of [null, 1000000]) {
    const resistance = rightChannelResistor(supply, onboard)!;
    assert.ok(resistance > 0);
    assert.equal(sd(resistance, onboard, supply).stableChannel, 'right');
  }
}
for (const config of [
  { ...MAX_SD_EXAMPLE, external: NaN }, { ...MAX_SD_EXAMPLE, external: -1 },
  { ...MAX_SD_EXAMPLE, external: 360000, supply: 0 },
  { ...MAX_SD_EXAMPLE, external: 360000, tolerancePct: 100 },
]) assert.equal(max98357Sd(config), null);
console.log('Shared resistors, decade boundaries, ADC limits, tolerance corners and MAX98357 channels: OK');
