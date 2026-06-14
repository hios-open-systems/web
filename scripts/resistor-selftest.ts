/**
 * Self-test for the Resistor color-code tool logic. Pure band <-> value
 * conversions against known cases, plus a round-trip and an invalid case.
 *
 * Run: node --experimental-strip-types scripts/resistor-selftest.ts
 */
import {
  BAND_COLORS,
  DIGIT_COLORS,
  MULTIPLIER_COLORS,
  TOLERANCE_COLORS,
  bandsToValue,
  valueToBands,
  formatOhms,
  type ResistorColor,
} from '../lib/workbench/resistor.ts';

let failures = 0;

function eq(name: string, got: unknown, want: unknown) {
  if (got !== want) {
    failures++;
    console.error(`✗ ${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

function hasError(value: unknown): value is { error: string } {
  return typeof value === 'object' && value !== null && 'error' in value;
}

// Table sanity
eq('BAND_COLORS count', BAND_COLORS.length, 12);
eq('DIGIT_COLORS count', DIGIT_COLORS.length, 10);
eq('MULTIPLIER_COLORS count', MULTIPLIER_COLORS.length, 12);
eq('TOLERANCE_COLORS count', TOLERANCE_COLORS.length, 8);

// 4-band: brown black red gold -> 1 kΩ ±5%
const r1 = bandsToValue(['brown', 'black', 'red', 'gold']);
eq('1k ohms', hasError(r1) ? r1.error : r1.ohms, 1000);
eq('1k tolerance', hasError(r1) ? r1.error : r1.tolerancePct, 5);

// 5-band: yellow violet black brown brown -> 4.7 kΩ ±1%
const r2 = bandsToValue(['yellow', 'violet', 'black', 'brown', 'brown']);
eq('4k7 ohms', hasError(r2) ? r2.error : r2.ohms, 4700);
eq('4k7 tolerance', hasError(r2) ? r2.error : r2.tolerancePct, 1);

// formatOhms
eq('formatOhms 220', formatOhms(220), '220 Ω');
eq('formatOhms 4700', formatOhms(4700), '4.7 kΩ');
eq('formatOhms 1000000', formatOhms(1000000), '1 MΩ');

// Round-trip: 1 kΩ, 4 bands, gold tolerance
const bands = valueToBands(1000, 4, 5);
eq(
  'valueToBands 1k',
  JSON.stringify(bands),
  JSON.stringify(['brown', 'black', 'red', 'gold'] satisfies ResistorColor[]),
);
const back = hasError(bands) ? bands : bandsToValue(bands);
eq('round-trip 1k ohms', hasError(back) ? back.error : back.ohms, 1000);

// Round-trip: 4.7 kΩ, 5 bands, brown tolerance
const bands5 = valueToBands(4700, 5, 1);
const back5 = hasError(bands5) ? bands5 : bandsToValue(bands5);
eq('round-trip 4k7 ohms', hasError(back5) ? back5.error : back5.ohms, 4700);

// Invalid: gold cannot be a digit band
const bad = bandsToValue(['gold', 'black', 'red', 'gold']);
eq('invalid digit band returns error', hasError(bad), true);

// Invalid: wrong band count
const badLen = bandsToValue(['brown', 'black', 'red']);
eq('invalid band count returns error', hasError(badLen), true);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll resistor self-tests passed');
